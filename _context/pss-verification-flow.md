# PSS Verification Flow — How PSS Actually Verifies Things
## _context/pss-verification-flow.md — Step-by-step trust pipeline

> This file explains the internal verification pipeline of PSS in enough detail
> that Claude can add, modify, or debug any module inside `ehb-pss/` without
> accidentally breaking the trust model.
>
> Read `ehb-ecosystem.md` first for the big picture, then this file for the
> mechanics.

---

## 1. What "Verification" Means in PSS

Verification in PSS is **not** a yes/no decision. It is the act of:
1. Receiving a submission from a sub-platform.
2. Checking it against the platform's own criteria set.
3. Computing a numeric **SQ score** from how many criteria are satisfied.
4. Letting the platform's **admin-configured rule engine** decide the route:
   *auto-approve*, *send to franchise*, or *send to EDR*.
5. If human review is routed, collecting the reviewer's verdict.
6. Assigning the final **SQ Level** (1, 2, 3, 5, 7, 10, or rejected).
7. Writing every step to `audit_logs` and pushing the result back to the
   originating platform's webhook.

Everything in this file is about how those seven steps are implemented across
PSS's modules.

---

## 2. Modules in PSS and What Each One Owns

```
ehb-pss/backend/apps/pss-api/src/modules/
├── auth          ← login, JWT, role guard (admin / franchise / edr)
├── platforms     ← registration of sub-platforms, platform API keys
├── criteria      ← per-platform criteria sets (what makes SQ1, SQ5, etc.)
├── sq-engine     ← receive submission → score → persist request/record
├── rule-engine   ← route decision (auto / franchise / edr) per platform rules
├── franchise     ← auto-creation of franchises + manual review inbox
├── edr           ← oversight reviews + overrides
├── audit         ← write-only audit log for every state transition
├── webhook       ← outbound push to platform webhooks on final decision
└── dev-seed      ← dev-only seed data
```

Modules communicate **through the NestJS event bus** (`@nestjs/event-emitter`),
not direct function calls. This keeps them loosely coupled.

Key events currently defined in code:

| Event | Emitted by | Consumed by |
|-------|------------|-------------|
| `sq.scored` | sq-engine | rule-engine |
| `sq.decision` | rule-engine | webhook (pushes to platform) |
| `franchise.review_requested` | rule-engine | franchise |
| `edr.review_requested` | rule-engine | edr |
| `audit.write` | every module | audit |

---

## 3. The 9-Step Verification Pipeline

### Step 1 — Submission arrives

A sub-platform's `pss-client` calls:
```
POST /sq/submit
```
with `{ entity_id, entity_type, user_id, platform_id, entity_data }`.

**Handled by:** `sq-engine.controller → sq-engine.service.submit()`

The service:
- Validates the platform exists and the API key is valid.
- Checks if this entity already has an active SQ record (rejects as
  `ALREADY_HAS_SQ` if so — prevents duplicate approvals).
- Creates a new `sq_requests` document with status `pending`.
- Emits `audit.write` → "submitted".

### Step 2 — Load criteria

`sq-engine.service` calls `criteria.service.getForPlatform(platform_id, entity_type)`
which returns the criteria definitions for that combination — e.g. for GoSellr
products:
```
[ { id: "c1", label: "Product title",    required: true,  sq_min: 1 },
  { id: "c2", label: "At least 3 images",required: true,  sq_min: 1 },
  { id: "c3", label: "Seller ID verified",required: true, sq_min: 2 },
  { id: "c4", label: "Business license", required: false, sq_min: 5 },
  { id: "c5", label: "Clean sales history",required: false, sq_min: 7 } ]
```

### Step 3 — Check how many criteria are met

Each criterion has a machine-checkable rule (currently field presence /
regex / length / external-verification-boolean). `sq-engine` iterates
through them against `entity_data` + the user's PSS identity record.

Result: `{ criteria_met: 3, total_criteria: 5 }`.

### Step 4 — Calculate SQ score

`calculateSqLevel()` from `libs/pss-utils` takes `(criteria_met, criteria_definitions)`
and picks the **highest SQ level** for which all required criteria up to that
level are satisfied.

Example:
- c1, c2, c3 satisfied → SQ2 achieved (all `sq_min:1` and `sq_min:2` criteria met).
- c4 (required for SQ5) missing → SQ5 not achieved.
- Final calculated score = **SQ2**.

`sq-engine` persists the calculated score on `sq_requests` and emits:
```
event: 'sq.scored'
payload: { sq_request_id, entity_id, platform_id, user_id,
           sq_level_calculated: 2, criteria_met: 3, total_criteria: 5, sq_score }
```

### Step 5 — Rule engine picks a route

`rule-engine.service` listens on `sq.scored`. It loads `pss_db.platform_rules`
filtered by `platform_id` and evaluates them in priority order. Rules look like:

```
rules for gosellr/product:
  1. IF sq_level_calculated >= 7  AND risk_score < 20   → auto_approve
  2. IF sq_level_calculated >= 2  AND criteria_met/total > 0.6
                                                        → forward_franchise
  3. ELSE                                                → forward_edr
```

Rules are **per platform** — each platform's admin configures their own.
There is no global default.

### Step 6 — Route A: auto-approve

If the matched rule is `auto_approve`:
- `rule-engine` writes the `sq_records` entry with the calculated SQ level.
- Emits `sq.decision` with `{ decision: 'approved', decided_by: 'auto' }`.
- Emits `audit.write` → "auto-approved per rule #1".
- Webhook module (§9) pushes the decision to the platform.

### Step 7 — Route B: franchise review

If the matched rule is `forward_franchise`:
- `rule-engine` emits `franchise.review_requested`.
- `franchise.service` consumes it and either:
  a) creates a new `franchises` row if no franchise exists yet in the
     entity's region (auto-creation of regional franchise), or
  b) attaches a `franchise_reviews` row to an existing franchise.
- The row is visible in the Franchise console (PSS frontend
  `(dashboard)/franchise`).
- A franchise reviewer clicks **Approve / Conditional / Reject**.
- `franchise.service` writes the outcome back into `sq_requests`, emits
  `sq.decision` with `{ decided_by: 'franchise' }`, and emits an
  `audit.write` including the reviewer's user_id and comment.

### Step 8 — Route C: EDR review

If the matched rule is `forward_edr` (high-risk, sensitive, or over a
franchise's authority threshold):
- `rule-engine` emits `edr.review_requested`.
- `edr.service` creates an `edr_reviews` row.
- An EDR reviewer (internal EHB staff with `edr` role) reviews in the EDR
  console (PSS frontend `(dashboard)/edr`) and decides: approve / reject /
  override an earlier franchise decision.
- `edr.service` emits `sq.decision` with `{ decided_by: 'edr' }` and
  `audit.write`. EDR decisions are **final** — no further override.

### Step 9 — Final decision is pushed to the platform

`webhook.service` subscribes to `sq.decision` and:
- Loads the platform's registered `webhook_url`.
- Signs the payload with the platform's webhook secret (HMAC-SHA256).
- POSTs `POST <platform_webhook_url>/webhooks/pss` with the `PssWebhookDecisionDto`.
- The sub-platform's webhook handler verifies the signature, updates the
  entity's display status in its own DB, and notifies the user.

---

## 4. Visual Summary

```
 ┌────────────────┐
 │ Sub-platform   │  POST /sq/submit
 │ pss-client     │─────────────────────────┐
 └────────────────┘                         │
                                             ▼
                           ┌─────────────────────────────┐
                           │  sq-engine.service          │
                           │  ─ load criteria (via       │
                           │    criteria.service)        │
                           │  ─ score entity             │
                           │  ─ persist sq_requests      │
                           └──────────────┬──────────────┘
                                          │ emits: sq.scored
                                          ▼
                           ┌─────────────────────────────┐
                           │  rule-engine.service        │
                           │  loads platform_rules       │
                           │  matches first rule         │
                           └──┬────────────┬────────────┬┘
              auto_approve    │  forward   │   forward  │
                              │  franchise │     edr    │
                              ▼            ▼            ▼
                   sq.decision  franchise.review   edr.review
                       │           │                  │
                       │           ▼                  ▼
                       │   franchise.service    edr.service
                       │   (manual review)      (manual review)
                       │           │                  │
                       │       sq.decision        sq.decision
                       │       (franchise)           (edr)
                       └─────┬─────┴──────────────────┘
                             ▼
                   ┌─────────────────────┐
                   │  webhook.service    │
                   │  POST to platform   │
                   │  /webhooks/pss      │
                   └─────────────────────┘

Every step above also emits `audit.write` → audit.service → pss_db.audit_logs
```

---

## 5. Data Shape of a Full Trip

### `sq_requests` document — lifecycle

```js
// Step 1 — created by sq-engine
{
  _id: "req_abc123",
  entity_id: "64f1…d1",
  entity_type: "product",
  user_id: "64f1…d2",
  platform_id: "gosellr",
  entity_data: { title: "Samsung…", price: 85000, … },
  status: "pending",
  created_at: Date
}

// Step 4 — sq-engine writes score
{ …, sq_level_calculated: 2, criteria_met: 3, total_criteria: 5 }

// Step 5–7 — rule-engine writes route
{ …, route: "forward_franchise", matched_rule_id: "rule_42" }

// Step 8 — franchise writes verdict
{ …, status: "pending_franchise" → "approved",
      reviewed_by: "user_franchise_17", review_comment: "OK" }

// Step 9 — webhook marks as pushed
{ …, webhook_pushed_at: Date, webhook_pushed_ok: true }
```

### `sq_records` document — the trust ledger

Written once the final decision is `approved`:
```js
{
  _id: ObjectId,
  user_id: "64f1…d2",
  platform_id: "gosellr",
  entity_id: "64f1…d1",
  entity_type: "product",
  sq_level: 5,            // the number the badge displays
  status: "approved",
  approved_at: Date,
  decided_by: "franchise",
  sq_request_id: "req_abc123"
}
```

Composite primary key: `user_id + platform_id + entity_id`.

### `audit_logs` — one row per state change

```js
{ sq_request_id, entity_id, platform_id, user_id,
  action: "submitted" | "scored" | "routed_franchise" |
          "franchise_approved" | "edr_overrode" | "webhook_pushed",
  reason: string,
  performed_by: userId | "system",
  metadata: { sq_level_before, sq_level_after, decided_by, … },
  created_at: Date }
```

No row is ever updated or deleted — audit is append-only.

---

## 6. Roles That Touch the Pipeline

| Role | Where they sign in | What they can do |
|------|-------------------|-------------------|
| End user | Any sub-platform frontend | Submit entities for approval. Cannot see the pipeline internals. |
| Platform admin | PSS frontend `(dashboard)/rule-engine` + `/criteria` | Define criteria sets and routing rules for their own platform. |
| Franchise reviewer | PSS frontend `(dashboard)/franchise` | Review entries routed to their region. |
| EDR reviewer | PSS frontend `(dashboard)/edr` | Review or override any decision, cross-platform. |
| PSS platform owner (EHB) | PSS frontend `(dashboard)/platforms` + `/audit` | Register new platforms, view full audit trail. |

---

## 7. Guarantees the Pipeline Provides

1. **Determinism** — same `entity_data` + same criteria + same rules always
   produce the same route.
2. **Traceability** — you can reconstruct the full history of an SQ decision
   from `audit_logs` alone.
3. **No silent rejection** — every rejection has a written `reason` in both
   `sq_requests.rejection_reason` and `audit_logs`.
4. **Override ordering** — `auto < franchise < edr`. EDR wins ties.
5. **Platform isolation** — `platform_id` is on every record. No accidental
   cross-contamination between platforms' criteria, rules, or SQ levels.
6. **Exactly-once delivery (best-effort)** — webhook module retries with
   exponential backoff; platform webhook handlers must be idempotent keyed
   by `sq_request_id`.

---

## 8. Common Mistakes to Avoid

- ❌ Writing to `sq_records` from anywhere except `rule-engine` / `franchise` /
  `edr` (those three are the only deciders).
- ❌ Emitting `sq.decision` from `sq-engine` directly — `sq-engine` only emits
  `sq.scored`; `rule-engine` is what decides.
- ❌ Adding a direct function call between modules. Use events.
- ❌ Changing `sq-engine.service`'s event payload without updating every
  subscriber's event contract.
- ❌ Making the webhook call inline — webhook.service does it async, so a
  slow/broken platform doesn't block the decision.
- ❌ Running criteria checks on data that came from the platform's DB
  directly. The submission's `entity_data` field is the verifier's input —
  if PSS needs additional facts, it fetches them through controlled paths
  (e.g. `users/verify`).

---

## 9. Extending the Pipeline

To add a new step (e.g. fraud scoring before rule-engine):
1. Create a module that listens on `sq.scored`.
2. Do its work. Optionally enrich the request document.
3. Emit a new event (e.g. `sq.fraud_checked`) with the same payload shape
   plus new fields.
4. Update `rule-engine` to listen on `sq.fraud_checked` instead of
   `sq.scored`, so fraud scoring becomes a mandatory pre-step.
5. Keep `sq-engine` and the webhook module unchanged.

To add a new route type (e.g. `forward_ai_reviewer`):
1. Add the action to `RuleAction` enum in `platform-rule.schema.ts`.
2. Add handling in `rule-engine.service` that emits a new
   `ai_review.requested` event.
3. Build the `ai-review/` module that consumes it and eventually emits
   `sq.decision` like franchise/edr do.

---

*PSS Verification Flow v1.0 | April 2026*
