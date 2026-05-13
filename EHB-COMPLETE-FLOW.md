# EHB Technologies — Complete System Flow & Sub-Platform Guide

> **EHB Technologies (Pvt.) Ltd.**
> *Education · Health · Business — One Platform, 38 Industries, Infinite Trust.*
> Founder: Muhammad Rafi

---

## 1. Executive Summary

EHB is a unified trust-and-services platform that lets a single user identity move across multiple verticals — buying, selling, delivering, working, learning, healing, banking — without re-proving who they are at every stop. Every action in EHB is gated by a verification score (the **SQ level** issued by PSS), and every dispute is governed by a single body (DMO), so trust scales with the platform instead of fragmenting per sub-company.

The system is built as a federation of independently deployable sub-platforms. Each one has its own database, auth, and frontend, and talks to the others over service-keyed HTTP, HMAC-signed webhooks, and a shared identity provider. Failure in one sub-platform never takes down the others.

This document describes every sub-platform, how they talk to each other, and the user journey through them for each role.

---

## 2. Mission

EHB exists to make trust portable. Today, a verified doctor on one platform has to start from zero on another; a five-star seller on Amazon means nothing on Daraz; a job seeker re-submits the same CNIC and educational records to every employer.

EHB collapses that. One verification (PSS), one skill profile (JPS), one governance body (DMO) — and every sub-platform consumes that trust to serve a specific market: e-commerce, hospitals, schools, jobs, banking, businesses.

---

## 3. The SQ Level System

The **Seller Qualification (SQ) Level** is EHB's universal trust score. It's issued by PSS and consumed by every other sub-platform when deciding what a user is allowed to do.

| Level | Label | What it gates |
|-------|-------|---------------|
| SQ0 | Unverified | View-only |
| SQ1 | Basic Verified | Buy, browse |
| SQ2 | Compliance Verified | List small-ticket items, take part-time jobs |
| SQ3 | Financially Verified | Take payments, withdraw to bank |
| SQ5 | Professional Verified | Run a registered store, hire staff |
| SQ7 | Expert Verified | Operate as licensed professional (doctor, teacher) |
| SQ10 | Elite Certified | Run a franchise, certify others |

A user's SQ level can rise over time as PSS accepts more evidence (CNIC, address proof, business registration, professional license, physical inspection by a franchise). It can also be downgraded by DMO after a substantiated complaint.

---

## 4. Sub-Platform Inventory

EHB is composed of seven layers. Each layer has at least one sub-platform.

### Layer 1 — Identity (`ehb-main`)

The single sign-on provider. Every sub-platform redirects unauthenticated users here, receives back a short-lived `ehb_token`, and exchanges it for its own JWT via `/auth/callback`. The two services intentionally do not share a JWT secret — they trust ehb-main's token only through that callback exchange.

`ehb-main` stores the bare minimum: `ehb_user_id`, `email`, `full_name`. It does not store the user's role, profile, business, or any sensitive document. Those live on the sub-platform where they're relevant.

| Field | Purpose |
|-------|---------|
| ehb_user_id | The cross-platform primary key |
| email | The cross-platform join key (used for service-to-service lookups) |
| full_name | Display fallback |

### Layer 2 — Verification (`ehb-pss`)

**Personal Security Score (PSS)** is the verification engine. When a sub-platform creates a new seller/rider/doctor/teacher profile, it submits the profile to PSS for SQ evaluation. PSS runs the evidence through a multi-step pipeline (CNIC match, NADRA cross-check, OTP, liveness, address validation, franchise physical inspection where required, regulator lookups for licensed professions) and emits an HMAC-signed webhook with the decision.

PSS is **asynchronous by design**. Sub-platforms submit and continue serving; the SQ decision arrives later via webhook. This is why every sub-platform that consumes SQ also has a `webhooks` module receiving `x-pss-signature: sha256=<hex>` payloads.

PSS evidence categories:

- Identity: CNIC front/back, NADRA cross-check, liveness selfie
- Contact: phone OTP, address proof (utility bill / GPS)
- Financial: bank account validation, IBAN format check
- Professional: license number → regulator lookup (PMDC, ICAP, PTA, FBR, DRAP, HEC, PSQCA)
- Business: registration certificate, tax number
- Physical: franchise officer in-person verification (for SQ5+)

### Layer 3 — Credential Refill (CRB)

**Credential Refill Bench (CRB)** keeps SQ levels honest over time. A driver's license expires; a doctor's CPD hours need refreshing; a food vendor's hygiene certificate lapses. CRB auto-schedules refill cycles per industry, sends reminders, runs exam sets where applicable, and downgrades the SQ level if a refill is missed. It also issues blockchain-anchored QR certificates so the user can show third parties a verifiable proof of a current credential.

CRB is invoked any time a new role/industry is created and acts as a long-running background process across the platform.

### Layer 4 — Skills & Jobs (`ehb-jps`)

**Jobs Platform & Skills (JPS)** is the canonical place where a user declares "what they do" on a given sub-platform. A user can have multiple JPS profiles — one per `(platform, role)` pair. So one human can be `(gosellr, seller)`, `(gosellr, rider)`, and `(hps, doctor)` simultaneously, each with its own SQ level and supporting documents.

JPS profiles are the source of truth for display name, bio, SQ badge, and verification status that other sub-platforms render in front of buyers/employers/patients. Sub-platforms cache JPS reads with short TTLs (typically 5 minutes) but never persist stale copies — stale verification badges are a trust hazard.

JPS also handles:

- Job posting marketplace
- AI-driven candidate matching (STL > Skills > CRB > Experience > Location)
- Contract generation (full-time, freelance, commission)
- Salary disbursement via wallet
- Designation progression (Junior → Expert) when SQ + CRB thresholds are met

### Layer 5 — Services (sub-platforms that serve end users)

These are the consumer-facing storefronts. Each one consumes identity from ehb-main, verification from PSS, and skill profile from JPS — and adds a market-specific value layer.

Currently live:

| Sub-platform | Code | Market |
|--------------|------|--------|
| GoSellr | `gosellr` | Verified e-commerce marketplace (buyer / seller / rider) |

Planned / partially built:

| Sub-platform | Code | Market |
|--------------|------|--------|
| Health Platform Service | `hps` | Hospital and doctor bookings |
| Online Learning Service | `ols` | Schools, tutoring, certification |
| Workforce Management Service | `wms` | Employer ↔ worker scheduling |
| Online Business Service | `obs` | SMB tooling and digital banking |

Every service layer follows the same skeleton: a NestJS + MongoDB backend, a Next.js 14 frontend, and a clear contract with PSS, JPS, DMO, and the Franchise system.

### Layer 6 — Governance (DMO)

**Decentralized Management & Oversight (DMO)** is the only body authorised to slash trust. Every sub-platform routes complaints, disputes, refunds, fraud alerts, and AML/KYB violations into DMO. DMO runs a seven-tier escalation queue: low-risk decisions are auto-handled by AI; medium and high-severity cases are routed to human officers tied to the relevant franchise region.

DMO outputs are binding across the platform:

- SQ downgrade
- Account freeze
- Account ban
- Refund order
- Token slashing (where the user has staked anything)
- Regional kill-switch (suspends a sub-platform in one region)

DMO writes to an immutable audit log so every decision is traceable.

### Layer 7 — Support & Distribution (Franchise + Admin Panel)

The **Franchise system** is EHB's physical-world layer. A franchise is a regional operator that performs in-person verification, resolves disputes locally, takes a revenue share, and acts as the human face of EHB in its territory. Franchises are themselves SQ-gated and have their own dashboard.

The **Admin Panel** is the internal cockpit: industry control panels, the officer queue, CRUD viewers, permission matrices, audit trails, and KPI dashboards. It auto-extends whenever a new industry, department, feature, or role is added — there is no parallel admin codebase per sub-platform.

### Layer 0 — Discovery (`ehb-landing`)

The marketing site. Unauthenticated users land here first. It does not run any business logic — it just explains what EHB is and funnels users to `ehb-main` for registration.

---

## 5. The Universal Trust Pipeline

Every action on every sub-platform follows the same five-step gate. This is the invariant that lets EHB scale across 38 industries without per-industry trust logic.

```
PSS  →  CRB  →  JPS  →  Service  →  DMO
```

| Step | Question it answers |
|------|---------------------|
| PSS | "Is this person who they claim to be, at the level of confidence this action requires?" |
| CRB | "Are their credentials currently fresh, or has a refill cycle expired?" |
| JPS | "Are they listed as performing this role on this platform, with the right skills?" |
| Service | "Has the sub-platform's own business logic accepted the request?" |
| DMO | "Are there any open disputes, bans, or freezes against them?" |

A request that fails any step is rejected with a status that names which gate blocked it, so the user sees a specific path to remediation instead of a generic "unauthorised".

---

## 6. How Sub-Platforms Communicate

Three patterns are in use, each chosen for a different requirement.

### Pattern A — Service-keyed HTTP (synchronous reads)

Used between any two sub-platforms when one needs to fetch data from the other. The caller sets two headers:

| Header | Value |
|--------|-------|
| `x-service-key` | Shared secret (one secret per receiving service, in env) |
| `x-service-id` | Caller's identifier (e.g. `gosellr`, informational) |

The receiver enforces this via a `ServiceKeyGuard`. The two services intentionally do **not** share a JWT secret — they cannot impersonate each other's users. Identity is bridged via the user's email, which is the same across all EHB platforms because ehb-main is the single identity provider.

Public reads return a sanitized DTO that strips CNIC images, full addresses, PSS internal IDs, and any field a third party should not see.

Caching: callers may keep an in-process 5-minute cache for public reads. Long-lived caches in MongoDB are forbidden, because stale verification badges are a trust risk.

### Pattern B — Platform-key + HMAC-signed webhooks (asynchronous decisions)

Used when a sub-platform needs to send a long-running result back. PSS uses this to deliver SQ decisions to GoSellr/JPS/HPS/etc. minutes or hours after the submission.

Outbound from the consumer:

| Header | Value |
|--------|-------|
| `x-platform-key` | Static API key issued to the consuming platform |
| `x-platform-id` | Consumer's id |

Inbound webhooks from PSS:

| Header | Value |
|--------|-------|
| `x-pss-signature` | `sha256=<hex>` HMAC over the raw body, secret from env |

Webhook receivers always return HTTP 200 (even on internal error). Non-2xx triggers PSS retries, which would create duplicate processing.

### Pattern C — Real-time WebSocket (live status)

GoSellr uses Socket.io on the `/orders` namespace for live order and delivery-request updates. Clients call `join:user <userId>` once and receive all events addressed to that user (order status changes, delivery request offers, accept/reject/expire notifications). Inside one sub-platform only; not cross-platform yet.

---

## 7. User Journeys by Role

### 7.1 — The Buyer (GoSellr)

| Step | What happens | Sub-platforms involved |
|------|--------------|------------------------|
| 1 | User lands on ehb-landing or directly on gosellr.com | ehb-landing → GoSellr |
| 2 | Clicks Register → redirected to ehb-main SSO | ehb-main |
| 3 | Email + OTP verification | ehb-main → GoSellr/auth/callback |
| 4 | Returned to GoSellr with a JWT, role auto-set to `buyer` | GoSellr |
| 5 | Browses approved products (SQ-verified sellers only) | GoSellr |
| 6 | Adds to cart, checks out, pays | GoSellr |
| 7 | Order is placed, status `pending` | GoSellr |
| 8 | Seller confirms → status `confirmed` | GoSellr (WS push) |
| 9 | Seller marks `ready_for_delivery` → assigns rider | GoSellr (WS push) |
| 10 | Rider picks up, marks `picked` → `out_for_delivery` → `delivered` | GoSellr (WS push) |
| 11 | Buyer can rate; complaints route through DMO | GoSellr → DMO |

PSS is invisible to buyers — they're at SQ1 by default, which is enough to buy.

### 7.2 — The Seller (GoSellr)

| Step | What happens | Sub-platforms involved |
|------|--------------|------------------------|
| 1 | Registers on GoSellr, role `seller` | ehb-main, GoSellr |
| 2 | Fills the seller profile form (business name, type, category) | GoSellr |
| 3 | GoSellr submits to PSS for SQ evaluation (async) | GoSellr → PSS |
| 4 | Seller opens "JPS Profile" page in dashboard, clicks Connect | GoSellr → JPS |
| 5 | Attaches an existing JPS profile (`platform=gosellr, role=seller`), or deep-links to JPS to create one | JPS |
| 6 | PSS webhook returns; SQ level set | PSS → GoSellr |
| 7 | Seller uploads products (blocked until JPS profile is linked) | GoSellr |
| 8 | Each product also goes through PSS approval | GoSellr → PSS → GoSellr |
| 9 | Approved products appear in buyer browse | GoSellr |
| 10 | Orders arrive; seller confirms → ready → assigns rider | GoSellr |
| 11 | CRB schedules refill of business documents, license, tax cert | CRB |

A seller who never connects their JPS profile cannot upload products — JPS is the trust anchor for the public "Owner" card on every listing.

### 7.3 — The Rider (GoSellr)

| Step | What happens | Sub-platforms involved |
|------|--------------|------------------------|
| 1 | Registers on GoSellr, role `rider` | ehb-main, GoSellr |
| 2 | Fills rider form: CNIC, vehicle, license plate, zone | GoSellr |
| 3 | GoSellr submits to PSS | GoSellr → PSS |
| 4 | Opens "JPS Profile" → connects JPS profile (`platform=gosellr, role=rider`) | GoSellr → JPS |
| 5 | PSS webhook returns; SQ level set | PSS → GoSellr |
| 6 | Toggles "Go Online" | GoSellr |
| 7 | Sellers see them in the Assign Rider modal (only if JPS profile attached + SQ approved) | GoSellr |
| 8 | A seller sends a delivery request | GoSellr (WS push) |
| 9 | Rider accepts within 60s — order is locked to them | GoSellr (WS push) |
| 10 | Rider hits Picked, then Out for delivery, then Delivered | GoSellr |
| 11 | Fee credits to wallet; CRB tracks license refill due dates | GoSellr, CRB |

Riders cannot self-assign orders. Every assignment originates from a seller's request and requires the rider's explicit accept.

### 7.4 — The Job Seeker (JPS)

| Step | What happens | Sub-platforms involved |
|------|--------------|------------------------|
| 1 | Registers on JPS via ehb-main | ehb-main → JPS |
| 2 | Creates a JPS profile per role/platform they want to be considered for | JPS |
| 3 | Uploads identity + skill evidence | JPS → PSS |
| 4 | PSS verifies → SQ level set | PSS → JPS |
| 5 | Applies to jobs (filtered by SQ + skills + zone) | JPS |
| 6 | AI matching ranks them against the posting | JPS |
| 7 | Employer reviews, schedules interview, signs contract | JPS |
| 8 | Work logs, salary disbursement, designation promotion | JPS |
| 9 | Complaints → DMO; refill cycles → CRB | DMO, CRB |

### 7.5 — The Franchise Operator

| Step | What happens | Sub-platforms involved |
|------|--------------|------------------------|
| 1 | Applies via Franchise application form | Franchise |
| 2 | KYB + physical office inspection by EHB | PSS |
| 3 | Approved → granted region, revenue share, officer credentials | Franchise, Admin Panel |
| 4 | Receives PSS verification jobs (physical visits to verify sellers SQ5+) | PSS, Franchise |
| 5 | Receives DMO escalations for their region | DMO, Franchise |
| 6 | Earns revenue share on every order/contract/booking in their region | All service platforms → Franchise wallet |

---

## 8. Cross-Platform Data Flow Examples

### 8.1 — A seller uploading their first product

```
1. Seller (in GoSellr) clicks Add Product
2. GoSellr backend checks: seller.jps_profile_id != null  → blocks if not connected
3. GoSellr writes product with sq_status='pending'
4. GoSellr submits product to PSS via:
     POST {PSS}/sq/submit
     x-platform-key, x-platform-id
     body = { entity_id, entity_type='product', user_id, platform_id='gosellr', entity_data }
5. PSS evaluates (later, async)
6. PSS calls back:
     POST {GoSellr}/webhooks/pss
     x-pss-signature: sha256=...
     body = { event, entity_id, decision, sq_level, ... }
7. GoSellr WebhooksService:
     a. Verifies HMAC signature (constant-time compare)
     b. Updates product.sq_status = approved | rejected
     c. Returns 200 regardless of internal errors
8. Product appears in buyer browse on next refresh
```

### 8.2 — A seller seeing eligible riders for an order

```
1. Seller's order reaches status='ready_for_delivery'
2. Seller clicks Assign Rider button
3. Frontend hits GET {GoSellr}/orders/:id/available-riders
4. GoSellr's OrdersService:
     a. Calls JPS: GET {JPS}/profiles/roster/lookup
          ?platform=gosellr&role=rider&status=approved
          headers: x-service-key, x-service-id=gosellr
     b. JPS returns approved rider profiles + owner_email
     c. GoSellr joins by jps_profile_id against its local Rider table
        (riders who haven't run the Connect flow are excluded here)
     d. Joins by user_id against gosellr Users for display_name
     e. Sorts: online first, then by SQ level desc
5. Modal renders the rider list with online dot, SQ badge, zone, vehicle
6. Seller picks one → POST {GoSellr}/orders/:id/delivery-requests
     body = { rider_jps_profile_id, rider_user_id }
7. DeliveryRequestsService re-checks both ids match the JPS roster
     (defensive re-validation; the frontend is not trusted)
8. Creates DeliveryRequest{status='pending', expires_at=+60s}
9. Emits WS event delivery_request:new → rider's user room
10. Rider's frontend pops a toast and updates the Requests inbox
```

### 8.3 — A buyer filing a complaint

```
1. Buyer in GoSellr opens the order detail page, clicks Report Issue
2. GoSellr forwards the complaint to DMO:
     POST {DMO}/complaints
     body = { order_id, buyer_id, seller_id, rider_id, category, description }
3. DMO triages:
     - severity LOW   → AI auto-decision
     - severity MED   → routed to franchise officer queue for the seller's region
     - severity HIGH  → routed to senior DMO officer + freezes the entity pending review
4. DMO emits webhooks back to:
     - GoSellr (to update order, freeze accounts, issue refund)
     - PSS (to slash SQ level if substantiated)
     - Franchise (if the operator is responsible for the breach)
5. Audit log entry written, immutable
```

---

## 9. Source-of-truth Map

This matrix is the single source of truth about who owns what data. Sub-platforms read from the owner over Pattern A; they cannot write outside their lane.

| Data | Owned by | Read by |
|------|----------|---------|
| User identity (ehb_user_id, email, full_name) | ehb-main | All sub-platforms (via SSO) |
| PSS evidence + SQ level | PSS | All sub-platforms via webhooks |
| User credentials (license, certs, refill state) | CRB | PSS, JPS, services |
| Skill profile per (platform, role) | JPS | Services |
| Marketplace listings, orders | GoSellr | Buyer/seller/rider in GoSellr only |
| Job postings, contracts | JPS | Employer/worker |
| Health bookings | HPS | Patient/doctor |
| Disputes, bans, audit trail | DMO | All sub-platforms (consumers of decisions) |
| Franchise regions, officers, revenue share | Franchise + Admin Panel | DMO, services |

---

## 10. Tech Stack at a Glance

| Layer | Choice |
|-------|--------|
| Backend runtime | Node.js 18+ |
| Backend framework | NestJS 10 (Nx monorepo per sub-platform) |
| Database | MongoDB 6+ via Mongoose |
| Authentication | JWT (7d) + token_version revocation + OTP email, plus EHB SSO |
| Real-time | Socket.io (per sub-platform, `/orders` namespace in GoSellr) |
| Service-to-service auth | Shared `x-service-key` + `x-service-id` headers, ServiceKeyGuard |
| Webhooks | HMAC-SHA256 signature (`x-pss-signature: sha256=<hex>`), constant-time compare |
| Frontend framework | Next.js 14 App Router + Redux Toolkit (RTK Query) + Tailwind |
| File storage | Local uploads dir (dev), object storage (prod) |
| Docs | Swagger UI at `/api/docs` on every service |

Each sub-platform runs on its own port (3001 PSS, 3002 GoSellr, 3003 JPS, etc.) and can be deployed independently. The only deployment dependency is ehb-main being up for SSO.

---

## 11. The 38 Industries

EHB's roadmap covers 38 industries grouped under three pillars. Every industry plugs into the same trust pipeline; the only per-industry code is the specific PSS evidence list and the CRB refill schedule.

**Education (12)** — Schools, universities, tutoring, online courses, certification bodies, libraries, exam centres, language schools, e-learning publishers, training institutes, scholarship orgs, edtech tools.

**Health (13)** — Hospitals, clinics, pharmacies, labs, telemedicine, mental health, fitness, alternative medicine, medical equipment, ambulances, home care, dental, vision.

**Business (13)** — E-commerce, freelancing, logistics & delivery, food service, transportation, real estate, professional services (legal/accounting), digital banking, B2B marketplaces, agriculture, manufacturing, retail, hospitality.

A new industry is added by registering it in the industry registry, defining its PSS evidence schedule, its CRB refill cycle, and (if needed) one new role enum value. Nothing in the trust pipeline changes.

---

## 12. Future Work

- Wallet & token system unified across sub-platforms
- Multilingual AI assistant (Urdu, English, regional languages)
- Voice and icon-first navigation for low-literacy users
- HPS, OLS, WMS, OBS standalone codebases
- Cross-platform WebSocket federation (so a DMO decision can push to the right service in real time)
- Open API for third-party developers building on EHB

---

*This document is the operating reference for EHB Technologies. It is intended to be readable by both engineers and the founder. When in doubt about how a piece of EHB should behave, treat this document as authoritative.*
