# EHB Ecosystem — Umbrella, Sub-Companies & Inter-Platform Communication
## _context/ehb-ecosystem.md — How the pieces fit together

> Read this **after** `EHB_PROJECT.md` to understand how the umbrella operates
> and how sub-companies talk to each other. If you are about to touch anything
> that crosses a platform boundary, read this first.

---

## 1. The Umbrella Model

EHB is not a single application. It is a **holding company of products** — each
sub-company is its own customer-facing platform, its own repo, its own database,
and its own deploy. What makes them "EHB" and not "eight unrelated startups" is:

1. **One shared identity** — a user registered anywhere is known everywhere
   (the record lives in `pss_db.users`).
2. **One shared trust system** — every product/profile/listing on every
   sub-platform carries an **SQ Level** assigned by PSS using the same machinery.
3. **One shared oversight path** — Franchise (regional manual review) and
   EDR (central override) apply to every sub-platform.
4. **One shared audit ledger** — every trust decision, everywhere, is written
   to `pss_db.audit_logs`.

```
                ┌────────────────────────────────────────┐
                │             EHB  UMBRELLA              │
                │   (holding / brand / governance)       │
                └────────────────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ┌──────────────┐       ┌─────────────┐       ┌──────────────┐
    │ ENTRY LAYER  │       │ TRUST LAYER │       │ INDUSTRY LAYER│
    │              │       │             │       │               │
    │ ehb-landing  │       │  ehb-pss    │◄──────┤  ehb-gosellr  │
    │ ehb-main     │──────►│  (verifier) │◄──────┤  ehb-ols      │
    │              │       │  + EDR      │◄──────┤  ehb-hps      │
    │              │       │  + Franchise│◄──────┤  ehb-jps      │
    └──────────────┘       └─────────────┘◄──────┤  ehb-wms      │
                                                 │  ehb-obs      │
                                                 └───────────────┘
```

---

## 2. The Three Layers in Detail

### 2.1 Entry layer — `ehb-landing` + `ehb-main`

**`ehb-landing`** is a pure marketing site (Next.js). No auth, no user data.
Its job is to explain what EHB is and link out to:
- `ehb-main` (generic "Join EHB") — creates the shared identity, then routes
  the user to whichever sub-platform fits them.
- A specific sub-platform (e.g. "Become a seller on GoSellr" → `ehb-gosellr`).

**`ehb-main`** is the central EHB portal. It owns:
- The **shared EHB signup** — creates a user record in `pss_db.users` via PSS.
- A **platform directory** so users can discover every sub-platform.
- Optionally, a **unified dashboard** showing the user's SQ history and activity
  across every sub-platform they use.

> A user does **not** have to enter through `ehb-main`. They may land directly
> on, say, `ehb-gosellr` and register there. Either way the same PSS identity
> record is created — entry point is just UX, not architecture.

### 2.2 Trust layer — PSS + Franchise + EDR

**PSS** (`ehb-pss`) is the control plane. It is the **only** system that:
- holds cross-platform user identity (`pss_db.users`),
- holds SQ records for every entity on every platform (`pss_db.sq_records`),
- holds every platform's routing rules (`pss_db.platform_rules`),
- holds the audit trail (`pss_db.audit_logs`).

**Franchise** — regional manual reviewers, governed by PSS. When PSS's rule
engine routes a request to "franchise", a franchise reviewer (via the PSS
frontend Franchise console) approves / conditionally approves / rejects.

**EDR** — EHB Department of Review. The oversight body. EDR can review anything,
override any franchise decision, and override any auto-approval. EDR decisions
are final (with an audit log explaining the override).

> Franchise + EDR are **modules inside PSS**, not separate backends. The
> "EDR portal" is just a role-gated area of the PSS frontend. The `ehb-edr`
> repo in the platforms table is the planned dedicated reviewer console UI,
> still powered by PSS APIs.

### 2.3 Industry layer — the sub-platforms

Each sub-platform (`ehb-gosellr`, `ehb-ols`, `ehb-hps`, `ehb-jps`, `ehb-wms`,
`ehb-obs`) is:
- Its own Git repo.
- Its own NestJS backend (Nx monorepo) + Next.js frontend.
- Its own MongoDB database (stores only its own business data).
- Its own Railway service + Vercel project.

What they **all share** is a `pss-client/` module in the backend that talks to
PSS. That is the only thing they have in common code-wise.

---

## 3. How Sub-Companies Communicate With Each Other

### 3.1 The Hard Rule

> **No sub-platform ever calls another sub-platform directly. Ever.**
> GoSellr does not call OLS. OLS does not call JPS. WMS does not call HPS.

Every cross-platform need goes through **PSS**. PSS is the hub; platforms are
spokes. There are no lateral edges.

```
          ❌ NOT ALLOWED                  ✅ ALLOWED
     GoSellr ──────► OLS            GoSellr ──► PSS ──► (data)
     OLS ──────────► JPS            OLS ─────► PSS ──► (data)
     HPS ──────────► WMS            HPS ─────► PSS ──► (data)
```

### 3.2 Why This Rule Exists

1. **Identity consistency.** A user known as verified on JPS must be
   recognizably the same user on GoSellr. Only PSS holds that mapping.
2. **Trust portability.** If a doctor is SQ7 on HPS, a pharmacy on GoSellr
   may want to see that — but the pharmacy must not trust a raw call from
   HPS, it must trust PSS's signed, audited answer.
3. **Audit integrity.** Every cross-platform data flow is logged in one place.
4. **Decoupling.** OLS can redeploy or rename endpoints without breaking
   any other sub-platform.
5. **Security.** Platforms only need one shared secret (their PSS platform
   key), not N-to-N credentials with every sibling.

### 3.3 The Communication Patterns

All communication between a sub-platform and PSS happens over HTTP, using the
sub-platform's `pss-client/` module. Two directions:

**A. Platform → PSS (pull / push)**

| Intent | Endpoint | Caller |
|--------|----------|--------|
| Submit entity for SQ approval | `POST /sq/submit` | Any sub-platform |
| Get SQ status for one entity | `GET /sq/status/:entity_id` | Any sub-platform |
| Get SQ status for many entities | `POST /sq/status/bulk` | Any sub-platform (listing pages) |
| Verify a user / fetch SQ history | `POST /users/verify` | Any sub-platform |
| Load platform criteria definitions | `GET /criteria/:platform_id` | Any sub-platform |

Every request carries two headers:
```
x-platform-key:  <platform's registered API key>
x-platform-id:   <gosellr | ols | hps | …>
```
PSS uses these to authenticate and know which platform is calling.

**B. PSS → Platform (webhook push)**

When PSS finishes making an SQ decision, PSS calls the originating platform's
webhook:
```
POST https://[platform]-api.railway.app/webhooks/pss
```
Payload: see `pss-api-contract.md §6`. The platform verifies the signature
(using `PSS_WEBHOOK_SECRET`), writes the result to its own DB, and pushes the
result to the user (WebSocket / email / in-app toast).

### 3.4 Example — Cross-Platform Data Flow

**Scenario:** A pharmacy seller on GoSellr wants to show that its pharmacist
is a verified SQ7 doctor on HPS.

```
[GoSellr backend] wants to display "Verified Pharmacist (SQ7 on HPS)"
        │
        ├─► calls pssClient.verifyUser(userId, ["sq_level_history"])
        │
        ▼
[ PSS ] looks up pss_db.users[userId] + pss_db.sq_records
        │   filters to entity_type=doctor_profile, platform=hps
        │
        ▼
[ PSS ] returns signed payload:
        {
          identity_verified: true,
          sq_level_history: [
            { platform: "hps", entity_type: "doctor_profile", sq_level: 7 }
          ]
        }
        │
        ▼
[GoSellr backend] writes a cache entry in gosellr_db (with a short TTL)
                  and renders the badge. Never calls HPS directly.
```

If HPS later revokes the doctor's SQ (say, license expired), PSS's webhook to
GoSellr updates the cache. GoSellr stays in sync without ever knowing HPS exists.

### 3.5 Data Ownership Rules

| Data | Owner (single source of truth) |
|------|-------------------------------|
| User identity + PII | `pss_db.users` |
| SQ records (level per entity) | `pss_db.sq_records` |
| Routing rules per platform | `pss_db.platform_rules` |
| Franchise records | `pss_db.franchises` |
| EDR reviews | `pss_db.edr_reviews` |
| Audit trail | `pss_db.audit_logs` |
| Products | `gosellr_db.products` |
| Lawyer profiles | `ols_db.profiles` |
| Doctor listings | `hps_db.profiles` |
| Job profiles | `jps_db.profiles` |
| Hospital services | `wms_db.services` |
| Books | `obs_db.books` |

A sub-platform **may cache** data from PSS (e.g. the current SQ level on a
product) for read performance, but the master record is always in PSS.

---

## 4. The `pss-client/` Module

Every sub-platform backend has exactly one `pss-client/` module at:
```
ehb-[platform]/backend/apps/[platform]-api/src/modules/pss-client/
```

It is the **only** place in the codebase where PSS is referenced. Every other
module that needs PSS injects `PssClientService`; no one uses `HttpService`
directly for PSS.

```typescript
// CORRECT
constructor(private readonly pssClient: PssClientService) {}
await this.pssClient.submitForSQ(entityId, userId, entityType, data);

// WRONG — don't do this, ever
await this.httpService.post('https://pss-api.railway.app/sq/submit', ...);
```

See `pss-api-contract.md §9` for the full reference implementation.

---

## 5. Environment Variables — The Integration Surface

Each sub-platform's `.env` contains **exactly** these PSS-related variables:

```bash
PSS_API_URL=https://pss-api.railway.app   # or http://localhost:3001 in dev
PSS_PLATFORM_KEY=pk_<platform>_<secret>   # issued by PSS on /platforms/register
PLATFORM_ID=gosellr                       # | ols | hps | jps | wms | obs
PSS_WEBHOOK_SECRET=whsec_<secret>         # for verifying incoming webhooks
```

Changing which PSS a platform talks to is a **URL change only** — no code
change. This is what lets the same codebase run against local PSS in
development and against production PSS in staging/prod.

---

## 6. Deployment Order — Why It Matters

PSS is deployed **first**, always. Because:
- Every sub-platform's `.env` needs a real `PSS_API_URL` to boot the
  `pss-client/` module cleanly.
- Every sub-platform must be registered (via `POST /platforms/register`) to
  receive its platform API key, before its backend can make any SQ calls.
- Every sub-platform's webhook URL must be stored in PSS before PSS can push
  decisions back to it.

Bootstrapping a brand-new sub-platform against an existing PSS:
1. Deploy empty backend on Railway to get its URL.
2. `POST /platforms/register` against PSS with the new platform's webhook URL
   → PSS returns a `platform_api_key`.
3. Store that key in the new platform's `.env` as `PSS_PLATFORM_KEY`.
4. Define the new platform's criteria set (via PSS admin UI or API).
5. Define its routing rules (via PSS admin UI).
6. Now the new platform can submit SQ requests and receive webhook decisions.

---

## 7. Mental Model for Claude

When you are about to write code and there's any doubt, ask:

1. **Is this cross-platform?**
   - If yes → it goes through `pss-client/`. Never a direct HTTP call to
     another sub-platform's URL.
2. **Is this trust/verification/identity?**
   - If yes → it is PSS's responsibility, not the sub-platform's. The
     sub-platform only *displays* the result.
3. **Is this business data for a specific industry?**
   - If yes → it lives in that platform's own DB, not `pss_db`.
4. **Does this decision need to be reversible / auditable?**
   - If yes → it must go through PSS's rule engine and emit an `audit_logs`
     entry. No silent decisions.
5. **Am I about to add a second "source of truth" for something PSS already owns?**
   - Don't. Cache it if you need speed, but the master copy stays in PSS.

---

## 8. Quick Diagram — Who Knows About Whom

```
             knows about   →
             ┌──────────────────────────────────────────┐
             │                                           ▼
ehb-landing ──► ehb-main                          ┌─────────┐
                 │                                │ ehb-pss │◄── every sub-platform
                 │                                └─────────┘    (via pss-client)
                 └──► links out to sub-platforms       │
                                                       │
             ┌──────────────────────────────────────── ▼ ─────────────┐
             │ Sub-platforms know ONLY about PSS — never each other. │
             └────────────────────────────────────────────────────────┘
```

---

*EHB Ecosystem Map v1.0 | April 2026*
