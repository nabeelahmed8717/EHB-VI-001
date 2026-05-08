# GoSellr — EHB Verified Marketplace

Part of the **EHB Technologies** platform.  
*Education · Health · Business — One Platform, Infinite Trust.*

---

## What is GoSellr?

GoSellr is a full-stack e-commerce marketplace where every seller undergoes EHB's **Seller Qualification (SQ)** process before their products go live. Three user roles operate the platform:

| Role | What they do |
|------|-------------|
| **Buyer** | Browse SQ-verified products, add to cart, checkout, track orders live |
| **Seller** | Register, complete SQ verification, list products, manage orders |
| **Rider** | Register, complete SQ verification, pick up and deliver orders |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS · MongoDB (Mongoose) · Passport JWT · Socket.io · Nodemailer |
| Frontend | Next.js 14 App Router · Redux Toolkit + RTK Query · Tailwind CSS |
| Build system | Nx monorepo (backend) |
| Auth | JWT (7d expiry) + token_version revocation + OTP email verification |
| Real-time | WebSocket gateway (`/orders` namespace) |

---

## Project Structure

```
ehb-gosellr/
├── backend/                     # NestJS Nx monorepo
│   ├── apps/gosellr-api/src/
│   │   └── modules/
│   │       ├── auth/            # JWT + OTP + EHB SSO
│   │       ├── users/           # User CRUD
│   │       ├── seller/          # Seller profiles + SQ
│   │       ├── rider/           # Rider profiles + SQ
│   │       ├── products/        # Product CRUD + SQ
│   │       ├── cart/            # Buyer cart
│   │       ├── orders/          # Orders + WebSocket gateway
│   │       ├── email/           # Nodemailer OTP emails
│   │       ├── pss-client/      # EHB PSS integration
│   │       └── webhooks/        # PSS webhook receiver
│   └── scripts/
│       └── seed.ts              # Database seed (test accounts + products)
│
└── frontend/                    # Next.js 14 App Router
    ├── app/
    │   ├── page.tsx             # Marketing landing page
    │   ├── (auth)/              # Login, Register, EHB callback
    │   ├── (buyer)/             # Browse, Cart, Checkout, Orders
    │   ├── (seller)/            # Seller dashboard + onboarding
    │   └── (rider)/             # Rider dashboard + onboarding
    └── lib/store/api/           # RTK Query API slices
```

---

## Prerequisites

- Node.js ≥ 18
- MongoDB ≥ 6 (local or Atlas)
- npm ≥ 9

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd ehb-gosellr

# Backend deps
cd backend && npm install

# Frontend deps
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — create `backend/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/gosellr_db

# JWT
JWT_SECRET=your-very-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3002

# PSS (EHB Seller Qualification platform)
PSS_API_URL=http://localhost:3001/api
PSS_PLATFORM_KEY=pk_gosellr_dev_key
PSS_WEBHOOK_SECRET=whsec_gosellr_dev
PLATFORM_ID=gosellr

# EHB Main identity platform
EHB_API_URL=http://localhost:5000
EHB_ADMIN_KEY=changeme-admin-key

# Email (optional — falls back to console.log if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=GoSellr <noreply@gosellr.com>
```

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_GOSELLR_API_URL=http://localhost:3002/api
```

### 3. Seed the database

```bash
cd backend
npx ts-node -r tsconfig-paths/register scripts/seed.ts
```

This creates:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Ali Khan | `buyer@gosellr.test` | `Test1234` | Buyer |
| Sara Ahmed | `seller@gosellr.test` | `Test1234` | Seller |
| Bilal Raza | `rider@gosellr.test` | `Test1234` | Rider |

Plus 12 sample products (`sq_status: approved`) linked to the seller account.

### 4. Start development servers

**Backend** (port 3002):
```bash
cd backend
npx nx serve gosellr-api
```

**Frontend** (port 4002):
```bash
cd frontend
npm run dev -- --port 4002
```

Open: [http://localhost:4002](http://localhost:4002)

---

## API Reference

Swagger UI is available at: `http://localhost:3002/api/docs`

### Auth endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register buyer, seller, or rider |
| POST | `/auth/otp/send` | Resend OTP to email |
| POST | `/auth/otp/verify` | Verify OTP → returns JWT |
| POST | `/auth/login` | Login with email + password → JWT |
| GET | `/auth/me` | Get current user (JWT required) |
| PATCH | `/auth/change-password` | Change/set local password |
| POST | `/auth/logout` | Revoke all sessions |
| POST | `/auth/ehb-callback` | EHB SSO token exchange |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List approved products (paginated, filterable by category) |
| GET | `/products/:id` | Get product detail |
| POST | `/products` | Create product (seller only) |
| PATCH | `/products/:id` | Update product (seller only) |
| POST | `/products/:id/submit-sq` | Submit product for SQ review |

### Cart (buyer only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get current cart |
| POST | `/cart/items` | Add item to cart |
| PATCH | `/cart/items/:productId` | Update item quantity |
| DELETE | `/cart/items/:productId` | Remove item |
| DELETE | `/cart` | Clear cart |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order from cart |
| GET | `/orders/my` | Buyer's own orders |
| GET | `/orders/available` | Available orders for riders |
| GET | `/orders/:id` | Order detail |
| PATCH | `/orders/:id/status` | Update order status |
| PATCH | `/orders/:id/assign-rider` | Assign rider (system/seller) |

### WebSocket

Connect to: `ws://localhost:3002/orders`

```javascript
socket.emit('join:order', orderId);    // Subscribe to order updates
socket.emit('join:user', userId);      // Subscribe to all user orders
socket.on('order:updated', ({ orderId }) => { /* refetch */ });
```

---

## Order Status Flow

```
pending → confirmed → ready_for_delivery → picked → out_for_delivery → delivered
    └──────────────────────────┘
          can cancel here (buyer)
```

| Status | Who transitions |
|--------|----------------|
| `confirmed` | Seller |
| `ready_for_delivery` | Seller |
| `picked` | Rider (after assignment) |
| `out_for_delivery` | Rider |
| `delivered` | Rider |
| `cancelled` | Buyer (pending/confirmed only) |

---

## Email OTP (Development)

If `SMTP_USER` / `SMTP_PASS` are not set in `.env`, OTP codes are printed to the backend console:

```
[WARN] [EmailService] SMTP not configured — OTP for test@example.com: 847291
```

Use this code to verify accounts during development without needing a real email provider.

---

## SQ (Seller Qualification) Integration

Every seller and product goes through the EHB PSS (Platform Support System):

1. Seller registers → `SellerProfile` created → PSS submission fires (non-blocking)
2. PSS sends webhook to `/webhooks/pss` → `sq_status` updated to `approved` / `rejected`
3. Products created by approved sellers inherit `sq_status: approved`
4. Only `approved` products appear in public browse (`/products` endpoint)

For local dev without a running PSS instance, run the seed script — it creates accounts and products with `sq_status: approved` directly.

---

## Ports

| Service | Port |
|---------|------|
| Backend API | 3002 |
| Frontend | 4002 |
| MongoDB | 27017 |
| PSS (if running) | 3001 |
| EHB Main (if running) | 5000 |
