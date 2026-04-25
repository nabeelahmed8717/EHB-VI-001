# Claude Cowork — Working Rules
## _context/working-rules.md — Behaviour rules for every session

---

## Before Every Task

1. Read `_context/EHB_PROJECT.md` fully
2. Read `_context/architecture.md` fully
3. Identify which platform repo this task is for
4. Confirm the output path before writing any files

---

## File Creation Rules

- Always output backend files inside `backend/apps/[platform]-api/src/`
- Always output frontend files inside `frontend/`
- Never create a `database/` folder — schemas go inside their module
- Never add `nx.json` or Nx config to `frontend/`
- Never create direct HTTP calls between platform backends

## NestJS Module Pattern (always follow this)

Every feature module must have these 4 files:
```
[feature].module.ts
[feature].controller.ts
[feature].service.ts
[feature].schema.ts   ← Mongoose schema lives here
```

## PSS Integration Pattern (always follow this)

When a platform feature needs to call PSS:
```typescript
// CORRECT — use pss-client service
constructor(private readonly pssClient: PssClientService) {}
await this.pssClient.submitForSQ(entityId, platformId, userId);

// WRONG — never do this
await this.httpService.post('https://other-platform.railway.app/...')
```

## Environment Variables Pattern

Each backend `.env` must have:
```
PSS_API_URL=          <- deployed PSS URL or localhost:3001
MONGODB_URI=          <- this platform's OWN DB (never share dbs between services)
JWT_SECRET=
PORT=
```

Sub-platforms that support EHB SSO also need:
```
EHB_API_URL=http://localhost:5000   <- EHB Main backend (always port 5000 in dev)
```

EHB Main frontend `.env.local` needs one entry per supported platform:
```
NEXT_PUBLIC_EHB_API_URL=http://localhost:5000
NEXT_PUBLIC_CALLBACK_GOSELLR=http://localhost:4002/callback
NEXT_PUBLIC_CALLBACK_OLS=http://localhost:4003/callback
```

Never hardcode URLs. Always use env vars.

---

## Known Pitfalls — Read Before Touching Auth or Env Files

**1. EHB Main backend is port 5000, not 3000.**
Any service calling EHB Main with port 3000 gets connection refused and
throws "Invalid or expired EHB token". Always 5000.

**2. Each service gets its own MongoDB database — never share.**
EHB Main = `ehb_main_db`. PSS = `pss_db`. GoSellr = `gosellr_db`.
Pointing two services at the same DB causes silent schema collisions.

**3. NEXT_PUBLIC_* vars need a dev server restart to take effect.**
Adding a new var to `.env.local` has no effect until Next.js is restarted.
Code will get `undefined` and may silently fall back to a wrong default.

**4. EHB Main frontend needs NEXT_PUBLIC_CALLBACK_<PLATFORM> per platform.**
`buildCallbackUrl()` in `ehb-main/frontend/app/login/page.tsx` reads
`process.env[NEXT_PUBLIC_CALLBACK_<PLATFORM_ID_UPPERCASE>]`. Missing var
returns null and the SSO redirect silently fails.

**5. PLATFORM_CALLBACK_URLS in EHB Main backend is parsed once at startup.**
Any change requires restarting the EHB Main backend process.

**6. Never use em dashes or smart quotes in .env files.**
The Windows filesystem mount corrupts `.env` files that contain multi-byte
UTF-8 characters (em dash, curly quotes, etc.). Use only plain ASCII in
all `.env` files. Use `-` not `--` in comments.

---

## Asking Before Acting

Always ask before:
- Creating a new folder structure not in EHB_PROJECT.md
- Adding a new npm package
- Changing an existing schema (could break data)
- Creating files outside the expected platform path

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Folders | kebab-case | `pss-client/` |
| NestJS files | kebab-case | `product.service.ts` |
| Classes | PascalCase | `ProductService` |
| Variables | camelCase | `sqLevel` |
| DB collections | snake_case | `sq_records` |
| Env vars | UPPER_SNAKE | `PSS_API_URL` |
| Git repos | kebab-case | `ehb-gosellr` |

---

## Output Checklist

Before finishing any task, verify:
- [ ] Files are in the correct platform folder
- [ ] No cross-platform imports
- [ ] Schema is inside its module folder
- [ ] PSS calls go through pss-client, not direct HTTP
- [ ] Env vars used for all URLs and secrets
- [ ] New SQ decisions write to audit_logs
