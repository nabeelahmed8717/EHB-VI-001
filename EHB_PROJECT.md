# EHB — Education Health Business
## Master Project File · Claude Cowork Context Document

> **How to use this file:**
> Place this file in the root of your EHB-V1-001 folder.
> In Cowork project instructions add:
> _"Before every task read _context/EHB_PROJECT.md"_

---

## 1. What is EHB?

EHB (Education Health Business) is a centralized multi-industry trust infrastructure.
It is a parent platform that governs multiple independent service platforms through one
unified verification and trust system called PSS.

Every service, product, profile, or listing on any EHB platform gets a verified trust
score called an SQ Level — assigned by PSS, governed by admin-configured rules, and
auditable across all platforms.

---

## 2. Platforms (Sub-Companies)

| Repo | Platform | Service |
|------|----------|---------|
| ehb-pss | PSS | Central verification & SQ engine |
| ehb-gosellr | GoSellr | E-commerce platform |
| ehb-ols | OLS | Legal professional marketplace |
| ehb-hps | HPS | Healthcare professional listings |
| ehb-jps | JPS | Workforce & employment platform |
| ehb-wms | WMS | Hospital & clinic management |
| ehb-obs | OBS | Book retail |
| ehb-edr | EDR | EHB dept. of review (internal) |

---

## 3. Folder Structure — Per Platform

Each platform is its own Git repo with this exact structure:

```
ehb-[platform]/
├── backend/                  ← Nx monorepo
│   ├── apps/
│   │   └── [platform]-api/   ← NestJS main app
│   │       └── src/
│   │           ├── modules/
│   │           │   ├── [feature]/
│   │           │   │   ├── [feature].module.ts
│   │           │   │   ├── [feature].controller.ts
│   │           │   │   ├── [feature].service.ts
│   │           │   │   └── [feature].schema.ts
│   │           │   └── pss-client/
│   │           │       ├── pss.client.ts
│   │           │       └── pss.dto.ts
│   │           ├── app.module.ts
│   │           └── main.ts
│   ├── libs/
│   │   ├── [platform]-types/  ← platform-specific TS interfaces
│   │   └── [platform]-utils/  ← pure helpers, no business logic
│   ├── nx.json
│   ├── package.json
│   ├── tsconfig.base.json
│   └── .env
└── frontend/                 ← plain Next.js (no Nx)
    ├── app/                  ← App Router
    │   ├── (public)/         ← public-facing pages
    │   ├── (dashboard)/      ← authenticated pages
    │   └── api/              ← route handlers
    ├── components/
    ├── lib/
    │   ├── api.ts            ← calls own backend
    │   └── pss.ts            ← SQ status display
    ├── store/                ← state management
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── .env.local
```

---

## 4. PSS Backend Structure (special — more modules)

```
ehb-pss/backend/apps/pss-api/src/modules/
├── sq-engine/        ← criteria mapping + SQ score calculation
├── rule-engine/      ← admin routing rules (auto / franchise / EDR)
├── franchise/        ← franchise auto-creation + review handling
├── edr/              ← EDR full-access review module
├── criteria/         ← per-platform criteria set management
├── audit/            ← audit log writer + query
├── auth/             ← JWT + roles
└── platforms/        ← sub-company definitions
```

PSS libs:
```
ehb-pss/backend/libs/
├── pss-types/        ← SQLevel, Entity, SQRequest, Platform interfaces
├── pss-utils/        ← shared helpers
└── pss-dtos/         ← API request/response shapes (used by all platforms)
```

---

## 5. Architecture Rules (Non-Negotiable)

1. **Backend = Nx monorepo. Frontend = plain Next.js.** Per platform, always.

2. **Each platform is its own Git repo.**
   `ehb-pss`, `ehb-gosellr`, `ehb-ols` — separate repos, separate deploys.

3. **No direct platform-to-platform API calls. Ever.**
   GoSellr never calls OLS. OLS never calls JPS. Period.

4. **All inter-platform communication goes through PSS only.**
   Every platform backend has a `pss-client/` module.
   It reads `PSS_API_URL` from `.env` — that is the only integration point.

5. **SQ Level is per entity, not per user.**
   One user with 5 products has 5 separate SQ levels.
   SQ record = `user_id + platform_id + entity_id`.

6. **Admin routing rules are per platform, not global.**
   Each platform admin configures their own routing rules in PSS.

7. **Franchise is auto-created, never manually created.**
   Triggered when a new store/entity registers in a new area.

8. **Schemas live inside their module folder.**
   `product/product.schema.ts` — never in a separate database/ folder.

---

## 6. PSS — The Control Engine

PSS is the most critical system. Every platform depends on it.

**Deploy PSS first. All other platforms connect to PSS via URL.**

PSS handles:
- Identity validation & credential verification
- Platform-specific criteria mapping (per sub-company rule sets)
- SQ score calculation
- Admin rule engine (routes to: auto-approve / Franchise / EDR)
- Risk scoring and fraud detection
- Franchise auto-creation and review governance
- EDR oversight and override
- Full audit logging across all platforms

PSS MongoDB (`pss_db`) collections:
```
users             → cross-platform user identity
platforms         → sub-company definitions
entities          → all submittable objects
sq_records        → SQ level per entity (the trust ledger)
sq_requests       → SQ approval request lifecycle
criteria_sets     → per-platform criteria definitions
platform_rules    → admin-configured routing rules
franchises        → auto-created area franchises
franchise_reviews → manual review records
edr_reviews       → EDR override records
audit_logs        → full audit trail
```

---

## 7. SQ Level System

SQ is assigned per entity (product, listing, profile, service).

| Level | Meaning |
|-------|---------|
| SQ1 | Basic identity verified |
| SQ2 | Identity + basic platform compliance |
| SQ3 | Identity + financial validation |
| SQ5 | Professional credentials verified |
| SQ7 | Experienced + clean performance record |
| SQ10 | Elite certified entity |

**9-step flow:**
1. User clicks "Send for Approval" on an entity
2. PSS receives + classifies request
3. Loads platform-specific criteria rule set
4. Checks how many criteria the entity satisfies
5. Calculates SQ score
6. Admin rule engine determines routing
7. Franchise reviews if routed (returns: Approved / Conditional / Rejected)
8. EDR reviews if routed (can override anything)
9. PSS assigns final SQ level → entity activated on platform

---

## 8. Local Development Setup

```
# Terminal 1 — run PSS backend locally
cd ehb-pss/backend
nx serve pss-api

# Terminal 2 — run PSS frontend locally
cd ehb-pss/frontend
npm run dev

# Terminal 3 — run GoSellr backend (points to local PSS)
cd ehb-gosellr/backend
# .env: PSS_API_URL=http://localhost:3001
nx serve gosellr-api

# Terminal 4 — run GoSellr frontend
cd ehb-gosellr/frontend
npm run dev
```

Or use deployed PSS URL for easier local dev:
```
# ehb-gosellr/backend/.env
PSS_API_URL=https://pss-api.railway.app
```

---

## 9. Deployment (Current Phase)

| Layer | Tool | Per platform |
|-------|------|-------------|
| Frontend | Vercel | One Vercel project per frontend/ |
| Backend | Railway | One Railway service per backend/ |
| Database | MongoDB Atlas | One database per platform in shared cluster |

Deploy order: **PSS first → then all other platforms**

Railway root directory setting: `backend/`
Vercel root directory setting: `frontend/`

---

## 10. Deployment (Future — 10+ platforms)

Migrate backends from Railway → Kubernetes (AWS EKS or GCP GKE).
Frontends stay on Vercel — no change needed.
Code never changes. Only deployment config changes.

Steps to migrate any backend:
1. Add `Dockerfile` to `backend/`
2. Add `deployment.yaml` for Kubernetes
3. Update `PSS_API_URL` in cluster env vars
4. Done — same NestJS code running in a pod

---

## 11. Adding a New Platform

1. Create new repo: `ehb-[platform]/`
2. Scaffold `backend/` with Nx: `npx create-nx-workspace`
3. Scaffold `frontend/` with Next.js: `npx create-next-app`
4. Add `pss-client/` module to backend with `PSS_API_URL` env var
5. Define criteria set for this platform in PSS admin
6. Configure routing rules in PSS admin
7. Register platform in `pss_db.platforms`
8. Deploy backend to Railway → get URL
9. Deploy frontend to Vercel → connect to backend URL

---

## 12. Development Phases

| Phase | Deliverable | Status |
|-------|------------|--------|
| 1 | PSS: sq-engine, rule-engine, franchise, EDR, audit | Current |
| 2 | GoSellr: full platform + entity SQ flow end-to-end | Next |
| 3 | Franchise portal + auto-creation live | - |
| 4 | EDR dashboard + override system | - |
| 5 | OLS + HPS + JPS platforms | - |
| 6 | WMS + OBS platforms | - |
| 7 | Kubernetes migration | - |
| 8 | AI risk scoring + cross-platform reputation | - |

---

## 13. Cowork Prompt Templates

### Scaffold a new platform backend
```
Read _context/EHB_PROJECT.md first.
Scaffold the Nx monorepo backend for [platform].
Path: ehb-[platform]/backend/
- Init Nx workspace
- Create apps/[platform]-api/ as NestJS app
- Create libs/[platform]-types/
- Create libs/[platform]-utils/
- Add pss-client/ module that reads PSS_API_URL from .env
- Follow the structure in section 3 of EHB_PROJECT.md
```

### Scaffold a new platform frontend
```
Read _context/EHB_PROJECT.md first.
Scaffold the Next.js frontend for [platform].
Path: ehb-[platform]/frontend/
- Plain Next.js App Router — no Nx
- Route groups: (public)/ and (dashboard)/
- lib/api.ts calls [platform] backend
- lib/pss.ts fetches SQ status for display
- Tailwind CSS
```

### Build a PSS module
```
Read _context/EHB_PROJECT.md first.
Build the [module-name] module for PSS.
Path: ehb-pss/backend/apps/pss-api/src/modules/[module-name]/
Follow NestJS module pattern: module, controller, service, schema.
All SQ decisions must write to audit_logs.
No silent rejections — every rejection needs a logged reason.
```

### Build platform feature module
```
Read _context/EHB_PROJECT.md first.
Platform: [platform name]
Build the [feature] module.
Path: ehb-[platform]/backend/apps/[platform]-api/src/modules/[feature]/
Files needed: module, controller, service, schema.
If this feature needs SQ approval: call pss-client service, do not call PSS directly.
```

---

## 14. Key Reminders

- Always read this file before starting any task
- PSS is built and deployed FIRST — everything else depends on it
- Never create direct API calls between platforms
- pss-client/ is the only integration point with PSS
- SQ is per entity — stored as user_id + platform_id + entity_id
- Schemas live inside their module folder, never in a separate database/ folder
- All SQ decisions write to audit_logs in pss_db
- No silent auto-rejections — every rejection has a logged reason
- Frontend is plain Next.js — never add Nx to frontend/

---

## 15. Quick Reference

| Thing | Lives in |
|-------|----------|
| SQ records | pss_db.sq_records |
| Routing rules | pss_db.platform_rules |
| Franchise data | pss_db.franchises |
| Audit trail | pss_db.audit_logs |
| Product data | gosellr_db |
| Lawyer profiles | ols_db |
| Doctor listings | hps_db |
| Job profiles | jps_db |
| Hospital services | wms_db |
| PSS types/DTOs | ehb-pss/backend/libs/pss-types/ |
| Platform types | ehb-[platform]/backend/libs/[platform]-types/ |
| PSS connection | ehb-[platform]/backend/apps/[platform]-api/src/modules/pss-client/ |

---

*EHB — Education Health Business | Confidential Internal Document*
*Architecture version: 2.0 — Separate Nx monorepo per platform backend*
*Last updated: April 2026*
