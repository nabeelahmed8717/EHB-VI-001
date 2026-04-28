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

---

## Local Dev Port Map (Authoritative)

| Service | Port | Notes |
|---------|------|-------|
| EHB Main backend | **5000** | JWT_SECRET = ehb-main-jwt-secret |
| EHB Main frontend | **4000** | NEXT_PUBLIC_EHB_API_URL = http://localhost:5000 |
| PSS backend | **3001** | |
| PSS frontend | **4001** | |
| GoSellr backend | **3002** | EHB_API_URL = http://localhost:5000 (NOT 3000) |
| GoSellr frontend | **4002** | NEXT_PUBLIC_GOSELLR_API_URL = http://localhost:3002 |

**Critical:** EHB Main backend is port 5000. Any service calling EHB Main to verify
tokens (e.g. GoSellr backend) must use port 5000. Port 3000 is wrong and will cause
"Invalid or expired EHB token" errors silently.

---

## Database Ownership

| Service | MongoDB database | Notes |
|---------|----------------|-------|
| PSS | `pss_db` | SQ records, routing rules, franchises, audit logs |
| EHB Main | `pss_db` | Writes user identity to `pss_db.users` — shared intentionally |
| GoSellr | `gosellr_db` | GoSellr business data only |
| OLS | `ols_db` | |
| HPS | `hps_db` | |
| JPS | `jps_db` | |
| WMS | `wms_db` | |
| OBS | `obs_db` | |

**EHB Main and PSS both use `pss_db` — this is intentional.**
User identity (`pss_db.users`) is the shared record that makes the ecosystem
coherent. EHB Main creates it; PSS reads it for SQ verification. All sub-platform
business data lives in each platform's own DB.

---

## EHB SSO Flow (Login with EHB across platforms)

Sub-platforms (GoSellr, OLS, etc.) let users log in via their EHB identity.
The flow is:

```
1. Sub-platform frontend
      window.location.href = 'http://localhost:4000/login?redirect=gosellr'

2. EHB Main frontend (4000)
      User submits credentials
      → POST http://localhost:5000/auth/login?redirect_platform=gosellr
      → Backend returns { ehb_token, redirect_url }
      → redirect_url = http://localhost:4002/callback?ehb_token=<jwt>

3. Sub-platform frontend /callback
      Reads ?ehb_token from URL
      → POST http://localhost:3002/auth/ehb-callback { ehb_token }

4. Sub-platform backend (e.g. 3002)
      → GET http://localhost:5000/auth/verify-token
            Authorization: Bearer <ehb_token>
      → EHB Main validates JWT + token_version
      → Returns { valid: true, user: { ehb_user_id, email, full_name } }
      → Sub-platform finds or creates local user
      → Issues sub-platform JWT
```

**Required env vars for each layer:**

EHB Main backend `.env`:
```
PORT=5000
JWT_SECRET=ehb-main-jwt-secret
PLATFORM_CALLBACK_URLS=gosellr:http://localhost:4002/callback,ols:http://localhost:4003/callback
```

EHB Main frontend `.env.local`:
```
NEXT_PUBLIC_EHB_API_URL=http://localhost:5000
NEXT_PUBLIC_CALLBACK_GOSELLR=http://localhost:4002/callback
NEXT_PUBLIC_CALLBACK_OLS=http://localhost:4003/callback
```

GoSellr backend `.env`:
```
EHB_API_URL=http://localhost:5000
```

GoSellr frontend `.env.local`:
```
NEXT_PUBLIC_EHB_URL=http://localhost:4000
NEXT_PUBLIC_GOSELLR_API_URL=http://localhost:3002
```

PSS frontend `.env.local` (for EHB SSO login into PSS admin dashboard):
```
EHB_JWT_SECRET=ehb-main-jwt-secret   <- must match JWT_SECRET in ehb-main/backend/.env
NEXTAUTH_SECRET=changeme-nextauth-secret-32chars-min
NEXTAUTH_URL=http://localhost:4001
NEXT_PUBLIC_PSS_API_URL=http://localhost:3001/api
```

PSS frontend has:
- `/callback` page (`ehb-pss/frontend/app/callback/page.tsx`) — receives `?ehb_token=` and calls NextAuth signIn('ehb-sso')
- NextAuth `ehb-sso` credentials provider (`ehb-pss/frontend/lib/auth.ts`) — verifies token using `jose` + `EHB_JWT_SECRET`

**When adding a new platform to SSO:**
1. Add `platform_id:http://localhost:<frontend_port>/callback` to EHB Main backend `PLATFORM_CALLBACK_URLS`
2. Add `NEXT_PUBLIC_CALLBACK_<PLATFORM_ID>=http://localhost:<frontend_port>/callback` to EHB Main frontend `.env.local`
3. Set `EHB_API_URL=http://localhost:5000` in new platform backend `.env`
4. Restart EHB Main backend after changing `PLATFORM_CALLBACK_URLS` (parsed once at startup)
5. Restart EHB Main frontend after changing any `NEXT_PUBLIC_*` vars
