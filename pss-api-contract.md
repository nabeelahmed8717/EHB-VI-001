# PSS API Contract
## _context/pss-api-contract.md — Full PSS endpoint definitions

> This file defines every endpoint PSS exposes, what platforms send,
> what PSS returns, and how the full SQ request lifecycle works.
> Claude must read this before building any PSS module or any
> platform feature that touches SQ approval.

---

## Base URL

```
Development:  http://localhost:3001
Production:   https://pss-api.railway.app  (or Kubernetes internal DNS)
```

Every platform sets this in its own `.env`:
```
PSS_API_URL=http://localhost:3001
```

---

## Authentication Between Platforms and PSS

All platform-to-PSS requests use a **service API key** — not a user JWT.
Each platform has its own key registered in PSS.

```
Header: x-platform-key: <platform_api_key>
Header: x-platform-id: gosellr
```

PSS validates the key and knows which platform is calling.
User JWT is passed separately when needed for user identity verification.

---

## 1. Submit Entity for SQ Approval

Platform calls this when user clicks "Send for Approval".

```
POST /sq/submit
```

### Request body
```json
{
  "entity_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "entity_type": "product",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "platform_id": "gosellr",
  "entity_data": {
    "title": "Samsung Galaxy S24",
    "description": "Brand new sealed box",
    "price": 85000,
    "images": ["img1.jpg", "img2.jpg"],
    "category": "electronics",
    "seller_license": "LIC-12345"
  }
}
```

### Response — request accepted
```json
{
  "success": true,
  "sq_request_id": "req_abc123",
  "status": "pending",
  "message": "SQ request submitted successfully"
}
```

### Response — already has active SQ
```json
{
  "success": false,
  "code": "ALREADY_HAS_SQ",
  "current_sq_level": 5,
  "message": "Entity already has an active SQ level"
}
```

---

## 2. Get SQ Status of an Entity

Platform calls this to show SQ badge or approval status to the user.

```
GET /sq/status/:entity_id?platform_id=gosellr
```

### Response — approved
```json
{
  "entity_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "platform_id": "gosellr",
  "sq_level": 5,
  "status": "approved",
  "approved_at": "2026-04-01T10:30:00Z",
  "expires_at": null,
  "badge_label": "SQ5 — Verified Professional"
}
```

### Response — pending review
```json
{
  "entity_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "platform_id": "gosellr",
  "sq_level": null,
  "status": "pending",
  "pending_at": "franchise",
  "message": "Under franchise review"
}
```

### Response — rejected
```json
{
  "entity_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "platform_id": "gosellr",
  "sq_level": null,
  "status": "rejected",
  "rejection_reason": "Incomplete product images",
  "rejected_at": "2026-04-01T12:00:00Z",
  "can_resubmit": true
}
```

### SQ status values
| Status | Meaning |
|--------|---------|
| `pending` | PSS is processing |
| `pending_franchise` | Waiting for franchise review |
| `pending_edr` | Waiting for EDR review |
| `approved` | SQ level assigned |
| `conditional` | Intermediate SQ assigned — conditions apply |
| `rejected` | Rejected with logged reason |

---

## 3. Get SQ Level for Multiple Entities (Bulk)

Platform calls this to show SQ badges on a listing page.

```
POST /sq/status/bulk
```

### Request body
```json
{
  "platform_id": "gosellr",
  "entity_ids": [
    "64f1a2b3c4d5e6f7a8b9c0d1",
    "64f1a2b3c4d5e6f7a8b9c0d2",
    "64f1a2b3c4d5e6f7a8b9c0d3"
  ]
}
```

### Response
```json
{
  "results": [
    { "entity_id": "64f1...d1", "sq_level": 5, "status": "approved" },
    { "entity_id": "64f1...d2", "sq_level": 2, "status": "approved" },
    { "entity_id": "64f1...d3", "sq_level": null, "status": "pending" }
  ]
}
```

---

## 4. Verify User Identity (Cross-Platform)

Platform calls this when it needs to verify a user's identity or
fetch their verified credentials from PSS.

```
POST /users/verify
```

### Request body
```json
{
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "requesting_platform": "gosellr",
  "required_fields": ["identity_verified", "sq_level_history"]
}
```

### Response
```json
{
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "identity_verified": true,
  "risk_score": 12,
  "sq_level_history": [
    { "platform": "jps", "entity_type": "job_profile", "sq_level": 7 }
  ],
  "flags": []
}
```

---

## 5. Get Platform Criteria (for display in FE)

Platform frontend calls this to show users what criteria
their entity needs to meet for each SQ level.

```
GET /criteria/:platform_id
```

### Response
```json
{
  "platform_id": "gosellr",
  "entity_type": "product",
  "criteria": [
    { "id": "c1", "label": "Product title", "required": true, "sq_min": 1 },
    { "id": "c2", "label": "At least 3 images", "required": true, "sq_min": 1 },
    { "id": "c3", "label": "Seller ID verified", "required": true, "sq_min": 2 },
    { "id": "c4", "label": "Business license", "required": false, "sq_min": 5 },
    { "id": "c5", "label": "Clean sales history", "required": false, "sq_min": 7 }
  ]
}
```

---

## 6. Webhook — PSS Notifies Platform of SQ Decision

PSS calls the platform's backend when an SQ decision is made.
This means platforms do NOT need to poll — PSS pushes the result.

Each platform registers a webhook URL in PSS during setup:
```
gosellr webhook: https://gosellr-api.railway.app/webhooks/pss
ols webhook:     https://ols-api.railway.app/webhooks/pss
```

### PSS sends to platform webhook
```
POST https://[platform]-api.railway.app/webhooks/pss
```

```json
{
  "event": "sq.decision",
  "sq_request_id": "req_abc123",
  "entity_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "platform_id": "gosellr",
  "decision": "approved",
  "sq_level": 5,
  "decided_by": "auto",
  "decided_at": "2026-04-01T10:35:00Z",
  "rejection_reason": null
}
```

### `decided_by` values
| Value | Meaning |
|-------|---------|
| `auto` | PSS rule engine approved automatically |
| `franchise` | Franchise manually approved |
| `edr` | EDR approved or overrode |

### Platform webhook handler (what GoSellr backend must implement)
```typescript
// gosellr-backend: src/modules/webhooks/pss.webhook.ts
@Post('/webhooks/pss')
async handlePssDecision(@Body() payload: PssWebhookDto) {
  // 1. Verify webhook signature (x-pss-signature header)
  // 2. Update entity SQ status in gosellr_db
  // 3. Notify user via WebSocket or email
}
```

---

## 7. Register Platform with PSS

Called once during platform onboarding setup.
Admin registers a new platform in PSS.

```
POST /platforms/register
Header: x-ehb-admin-key: <ehb_master_key>
```

### Request body
```json
{
  "platform_id": "gosellr",
  "platform_name": "GoSellr",
  "webhook_url": "https://gosellr-api.railway.app/webhooks/pss",
  "entity_types": ["product", "seller_profile"],
  "contact_email": "admin@gosellr.com"
}
```

### Response
```json
{
  "success": true,
  "platform_api_key": "pk_gosellr_a1b2c3d4e5f6...",
  "message": "Platform registered. Store this API key safely."
}
```

---

## 8. Complete Communication Flow — GoSellr Example

```
User clicks "Send for Approval" on a product
        ↓
gosellr-frontend → POST gosellr-backend /products/:id/submit-sq
        ↓
gosellr-backend (pss-client) → POST pss-api /sq/submit
        ↓
PSS runs: criteria check → SQ score → rule engine
        ↓
     ┌──────────────────────────────────┐
     │ Rule A: auto-approve             │ → assigns SQ instantly
     │ Rule B: forward to franchise     │ → franchise reviews
     │ Rule C: forward to EDR           │ → EDR reviews
     └──────────────────────────────────┘
        ↓ (decision made)
PSS → POST gosellr-backend /webhooks/pss  (webhook push)
        ↓
gosellr-backend updates entity SQ status in gosellr_db
        ↓
gosellr-backend → WebSocket push to user
        ↓
gosellr-frontend shows SQ badge on product
```

---

## 9. pss-client Implementation (inside every platform backend)

```typescript
// libs/pss-client/src/pss.client.ts

@Injectable()
export class PssClientService {
  private readonly pssUrl: string;
  private readonly platformKey: string;
  private readonly platformId: string;

  constructor(private readonly httpService: HttpService) {
    this.pssUrl = process.env.PSS_API_URL;
    this.platformKey = process.env.PSS_PLATFORM_KEY;
    this.platformId = process.env.PLATFORM_ID;
  }

  private get headers() {
    return {
      'x-platform-key': this.platformKey,
      'x-platform-id': this.platformId,
    };
  }

  async submitForSQ(
    entityId: string,
    userId: string,
    entityType: string,
    entityData: Record<string, any>,
  ) {
    return this.httpService.post(`${this.pssUrl}/sq/submit`, {
      entity_id: entityId,
      entity_type: entityType,
      user_id: userId,
      platform_id: this.platformId,
      entity_data: entityData,
    }, { headers: this.headers }).toPromise();
  }

  async getSQStatus(entityId: string) {
    return this.httpService.get(
      `${this.pssUrl}/sq/status/${entityId}?platform_id=${this.platformId}`,
      { headers: this.headers }
    ).toPromise();
  }

  async getBulkSQStatus(entityIds: string[]) {
    return this.httpService.post(`${this.pssUrl}/sq/status/bulk`, {
      platform_id: this.platformId,
      entity_ids: entityIds,
    }, { headers: this.headers }).toPromise();
  }

  async verifyUser(userId: string, requiredFields: string[]) {
    return this.httpService.post(`${this.pssUrl}/users/verify`, {
      user_id: userId,
      requesting_platform: this.platformId,
      required_fields: requiredFields,
    }, { headers: this.headers }).toPromise();
  }
}
```

---

## 10. Platform .env Variables for PSS

```bash
# Every platform backend .env must have these PSS variables
PSS_API_URL=http://localhost:3001        # local dev
# PSS_API_URL=https://pss-api.railway.app  # production

PSS_PLATFORM_KEY=pk_gosellr_a1b2c3...   # given by PSS on registration
PLATFORM_ID=gosellr                      # this platform's ID

# Webhook secret — PSS signs its webhook calls with this
PSS_WEBHOOK_SECRET=whsec_abc123...
```

---

*EHB — PSS API Contract v1.0 | April 2026*
