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
PSS_API_URL=          ← deployed PSS URL or localhost:3001
MONGODB_URI=          ← this platform's own DB
JWT_SECRET=
PORT=
```

Never hardcode URLs. Always use env vars.

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
