# EHB Architecture Rules
## _context/architecture.md — Claude reads this before every task

---

## Hard Rules — Never Break These

### Rule 1 — Repo structure per platform
```
ehb-[platform]/
├── backend/    ← Nx monorepo (NestJS)
└── frontend/   ← plain Next.js (no Nx)
```
Backend uses Nx. Frontend never uses Nx. Always.

### Rule 2 — No direct platform-to-platform calls
Platforms never call each other's APIs directly.
GoSellr never calls OLS. OLS never calls JPS. Never.

### Rule 3 — PSS is the only hub
All cross-platform communication goes through PSS.
Every platform backend has one `pss-client/` module.
That module reads `PSS_API_URL` from `.env`. That is the only integration.

### Rule 4 — SQ is per entity, not per user
SQ record key = `user_id + platform_id + entity_id`
One user, 5 products = 5 separate SQ levels.

### Rule 5 — Schemas live in their module
`product/product.schema.ts` — not in a `database/` folder.
Never create a standalone `database/` folder.

### Rule 6 — Routing rules are per platform
Each platform admin configures their own routing rules in PSS.
No global routing rules shared across platforms.

### Rule 7 — PSS is deployed first
PSS must be live before any other platform can be developed or tested.
Every platform's `PSS_API_URL` points to the deployed PSS.

### Rule 8 — Audit everything
Every SQ decision (approve / reject / conditional) writes to `audit_logs`.
No silent auto-rejections. Every rejection has a logged reason.

---

## Stack Per Platform

| Layer | Technology |
|-------|-----------|
| Backend | NestJS inside Nx monorepo |
| Frontend | Next.js App Router (standalone) |
| Database | MongoDB + Mongoose (own DB per platform) |
| Auth | JWT + Passport.js |
| Queue | Bull + Redis (async SQ jobs) |
| PSS connection | pss-client/ lib via HTTP |

---

## Deployment Per Platform

| Layer | Current | Future (10+ platforms) |
|-------|---------|----------------------|
| Frontend | Vercel | Vercel (no change) |
| Backend | Railway | Kubernetes (AWS EKS / GCP GKE) |
| Database | MongoDB Atlas | MongoDB Atlas (no change) |

Migration path: add Dockerfile + deployment.yaml to backend/ — code never changes.

---

## What PSS Owns

PSS is the only system that holds:
- SQ records for all platforms
- Routing rules for all platforms
- Franchise data for all platforms
- Audit logs for all platforms
- Cross-platform user identity

All other platforms own only their own business data.
