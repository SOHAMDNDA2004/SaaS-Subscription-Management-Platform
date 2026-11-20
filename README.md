# SubSphere | Scalable SaaS Subscription Management Platform

> A production-ready, full-stack SaaS Subscription & Billing Platform built with Next.js (App Router), Tailwind CSS, PostgreSQL (Prisma ORM), and Stripe API.

---

## 🚀 Key Highlights & Architecture

- **Next.js App Router (14+)**: Server-rendered and client-hydrated architecture with TypeScript and Tailwind CSS.
- **Relational PostgreSQL Database Architecture**: Complete relational schema featuring `User`, `Plan`, `Subscription`, `Invoice`, `UsageRecord`, and `AuditLog` models with custom Enums, foreign key constraints, and indexing.
- **Stripe Billing Integration**:
  - Hosted Stripe Checkout sessions with metadata and billing cycle selection.
  - Stripe Customer Billing Portal for managing payment methods and cancellations.
  - Webhook endpoint (`/api/webhooks/stripe`) with cryptographic HMAC signature verification (`stripe-signature`).
  - Webhook event handling for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, and `invoice.payment_failed`.
- **Built-in Stripe Webhook Event Simulator**: A developer-friendly simulator directly integrated into the UI to fire, debug, and verify real-time subscription lifecycle events without needing Stripe CLI or external tunnels.
- **User Subscription Dashboard**:
  - Active plan status badge (`ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`).
  - Quota and resource usage meters (API calls, storage, team seats, active projects).
  - Prorated Tier Upgrade & Downgrade modal with net-due calculations.
  - Invoice history table with print-ready **PDF invoice generation** and receipt viewer.
  - Delinquency / Past-Due alert banner with instant retry payment workflow.
- **Administrator SaaS Control Plane**:
  - Role-Based Access Control (`USER` vs `ADMIN`).
  - Executive Financial KPIs: **MRR** (Monthly Recurring Revenue), **ARR**, **Active Subscribers**, **Gross Churn Rate**, **ARPU**, and **Net Growth**.
  - Interactive Revenue Trajectory Chart and Tier Share breakdown.
  - User and Subscription Management with manual tier override capabilities.
  - Live system audit trail and Stripe webhook event stream.
- **Instant Persona Switcher**: Switch between 4 personas (`Sarah Connor` - Pro, `Alex Vance` - Admin, `Marcus Wright` - Starter, `Elena Rostova` - Past Due) for instant validation.

---

## 📂 Project Structure

```text
├── prisma/
│   ├── schema.prisma        # Production PostgreSQL Prisma Schema
│   └── schema.sql           # Pure PostgreSQL DDL Script with Types & Indexes
├── src/
│   ├── app/
│   │   ├── admin/           # Admin Dashboard (MRR, ARR, Churn, User Management)
│   │   ├── api/
│   │   │   ├── admin/       # Metrics & User Override API endpoints
│   │   │   ├── auth/        # Persona switcher API
│   │   │   ├── checkout/    # Stripe Checkout Session API
│   │   │   ├── invoices/    # Invoice listing & PDF invoice generation
│   │   │   ├── portal/      # Stripe Customer Billing Portal session API
│   │   │   ├── simulation/  # Webhook Event Simulator API
│   │   │   ├── subscription/# In-app upgrade, downgrade, proration, cancel API
│   │   │   └── webhooks/    # Official Stripe Webhook endpoint
│   │   ├── checkout/        # Success & Cancel redirection pages
│   │   ├── dashboard/       # User Dashboard, Invoices & Pricing tier switcher
│   │   ├── globals.css      # Custom Tailwind styling & glassmorphic tokens
│   │   ├── layout.tsx       # Root Layout
│   │   └── page.tsx         # SaaS Landing page & feature showcase
│   ├── components/
│   │   ├── CancelConfirmModal.tsx # Retention & cancellation dialog
│   │   ├── Navbar.tsx             # Navigation, Persona switcher & Webhook launcher
│   │   ├── UpgradeModal.tsx       # Proration calculator & plan switch dialog
│   │   └── WebhookSimulatorModal.tsx # Interactive Stripe Webhook tester
│   └── lib/
│       ├── db.ts            # Database repository & state manager
│       ├── seed-data.ts     # Realistic SaaS seed records
│       ├── stripe.ts        # Stripe client, webhook dispatcher & sandbox engine
│       ├── types.ts         # TypeScript interfaces & Enums
│       └── utils.ts         # Currency formatting, proration & badge helpers
├── .env.example             # Environment template
└── package.json
```

---

## 🗄️ Database Architecture (PostgreSQL)

The platform is designed around strict relational integrity. Both `prisma/schema.prisma` and `prisma/schema.sql` are provided.

### PostgreSQL Models:

1. **User (`users`)**:
   - `id`: Unique identifier
   - `email`: User email (Indexed, Unique)
   - `name`: Full name
   - `role`: Enum (`USER`, `ADMIN`)
   - `company`: Company name
   - `stripeCustomerId`: Stripe Customer ID (Indexed, Unique)
   - `createdAt`, `updatedAt`: Timestamps

2. **Plan (`plans`)**:
   - `id`: Plan ID
   - `name`: Display name (`Starter`, `Professional`, `Enterprise`)
   - `slug`: URL slug (`starter`, `pro`, `enterprise`)
   - `priceMonthly`, `priceYearly`: In integer cents (e.g. `4900` = \$49.00)
   - `stripePriceIdMonthly`, `stripePriceIdYearly`: Stripe Price IDs
   - `features`: Array of feature strings
   - `limits`: JSON object containing `{ apiCalls, teamSeats, storageGb, projects }`
   - `isPopular`, `isActive`: Booleans

3. **Subscription (`subscriptions`)**:
   - `id`: Subscription ID
   - `userId`: Foreign key to `User` (Cascade delete, Indexed)
   - `planId`: Foreign key to `Plan`
   - `stripeSubscriptionId`: Stripe Subscription ID (Indexed, Unique)
   - `status`: Enum (`TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `UNPAID`, `INCOMPLETE`)
   - `billingCycle`: Enum (`MONTHLY`, `YEARLY`)
   - `currentPeriodStart`, `currentPeriodEnd`: Billing interval dates
   - `cancelAtPeriodEnd`: Boolean flag for grace-period cancellation
   - `canceledAt`: Timestamp

4. **Invoice (`invoices`)**:
   - `id`: Invoice ID
   - `userId`: Foreign key to `User` (Indexed)
   - `subscriptionId`: Foreign key to `Subscription`
   - `stripeInvoiceId`: Stripe Invoice ID (Indexed, Unique)
   - `number`: Formatted number (e.g., `INV-2026-0089`)
   - `amountDue`, `amountPaid`: Cents
   - `currency`: ISO currency code (`usd`)
   - `status`: Enum (`DRAFT`, `OPEN`, `PAID`, `UNCOLLECTIBLE`, `VOID`)
   - `billingReason`: Cycle, upgrade, or manual charge
   - `invoicePdfUrl`: Download endpoint for PDF receipt
   - `paidAt`, `dueDate`: Timestamps

5. **UsageRecord (`usage_records`)**:
   - `userId`, `metricKey`: Composite unique constraint (`api_calls`, `storage_gb`, `team_seats`, `projects`)
   - `current`, `limit`: Quota numbers
   - `periodStart`, `periodEnd`: Reset dates

6. **AuditLog (`audit_logs`)**:
   - Records subscription modifications, webhook execution traces, and administrative interventions.

---

## ⚡ Stripe Integration Details

### 1. Checkout Session Creation (`/api/checkout`)
Initiates hosted Stripe Checkout with:
- Subscription mode (`mode: 'subscription'`)
- Price selection based on billing interval (Monthly vs Annual)
- Customer email prefilling
- Metadata linking `userId`, `planId`, and `billingCycle`
- Fallback sandbox execution when testing without live Stripe keys

### 2. Stripe Webhook Handler (`/api/webhooks/stripe`)
Handles raw request payloads with signature verification:
```typescript
const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
```
Supported Events:
- `checkout.session.completed`: Creates subscription, generates initial paid invoice, initializes usage quotas.
- `customer.subscription.updated`: Synchronizes mid-cycle upgrades, downgrades, and cancellation schedules.
- `customer.subscription.deleted`: Marks subscription as `CANCELED`.
- `invoice.payment_succeeded`: Issues paid invoice and reactivates delinquent accounts.
- `invoice.payment_failed`: Marks subscription as `PAST_DUE` and opens recovery flow.

### 3. Customer Billing Portal (`/api/portal`)
Redirects users to Stripe-hosted self-service portal to update payment methods, update tax IDs, or manage recurring payments.

---

## 🛠️ Setup & Running Instructions

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your credentials:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_subscription_db?schema=public"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
*(Note: If Stripe keys are omitted, the built-in Sandbox & Webhook Simulator runs automatically out of the box).*

### 3. PostgreSQL Database Setup (Optional if using local database)
To push the schema to your PostgreSQL database:
```bash
npx prisma db push
```
Or execute the pure SQL script in `prisma/schema.sql` directly into Supabase, Neon, or psql.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Feature Testing Guide

1. **User Dashboard (`/dashboard`)**:
   - Inspect active plan badge, renewal date, and resource meters.
   - Click **"Upgrade to Enterprise"** to review the proration calculation.
   - Click **"PDF Invoice"** under Invoices to view and print an itemized invoice.
   - Click **"Cancel Subscription"** to review the retention modal.
2. **Pricing & Tier Switcher (`/dashboard/pricing`)**:
   - Toggle between **Monthly** and **Annual (Save 17%)**.
   - Select an alternative tier to initiate Stripe checkout or proration upgrade.
3. **Stripe Webhook Simulator**:
   - Click the **"Webhook Simulator"** pill in the top navigation bar.
   - Select `invoice.payment_failed` and click **"Execute Webhook"**.
   - Notice the subscription instantly switches to `PAST_DUE` with a high-visibility payment recovery banner!
   - Select `invoice.payment_succeeded` or `checkout.session.completed` to restore `ACTIVE` state.
4. **Admin Control Plane (`/admin`)**:
   - Switch persona to **Alex Vance (Admin)** from the top navbar.
   - Review live **MRR**, **ARR**, **Active Subscribers**, **Churn Rate**, and **ARPU**.
   - Review the monthly revenue trajectory chart and tier distribution bars.
   - In the user accounts table, click **"Change Tier"** to manually override any user's subscription tier.
