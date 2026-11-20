-- =========================================================
-- SaaS Subscription Management Platform - PostgreSQL Schema
-- Database: PostgreSQL 14+
-- =========================================================

-- Create Custom Enum Types
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'UNCOLLECTIBLE', 'VOID');

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255),
    "role" "Role" DEFAULT 'USER' NOT NULL,
    "company" VARCHAR(255),
    "avatar_url" TEXT,
    "stripe_customer_id" VARCHAR(255) UNIQUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: plans
CREATE TABLE IF NOT EXISTS "plans" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "slug" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "price_monthly" INTEGER NOT NULL, -- in cents (e.g. 2900 = $29.00)
    "price_yearly" INTEGER NOT NULL,  -- in cents (e.g. 29000 = $290.00)
    "stripe_price_id_monthly" VARCHAR(255),
    "stripe_price_id_yearly" VARCHAR(255),
    "stripe_product_id" VARCHAR(255),
    "features" TEXT[] NOT NULL DEFAULT '{}',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "is_popular" BOOLEAN DEFAULT FALSE NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "plan_id" VARCHAR(64) NOT NULL REFERENCES "plans"("id"),
    "stripe_subscription_id" VARCHAR(255) UNIQUE,
    "stripe_price_id" VARCHAR(255),
    "status" "SubscriptionStatus" DEFAULT 'ACTIVE' NOT NULL,
    "billing_cycle" "BillingCycle" DEFAULT 'MONTHLY' NOT NULL,
    "current_period_start" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "current_period_end" TIMESTAMP WITH TIME ZONE NOT NULL,
    "cancel_at_period_end" BOOLEAN DEFAULT FALSE NOT NULL,
    "canceled_at" TIMESTAMP WITH TIME ZONE,
    "trial_start" TIMESTAMP WITH TIME ZONE,
    "trial_end" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: invoices
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "subscription_id" VARCHAR(64) REFERENCES "subscriptions"("id") ON DELETE SET NULL,
    "stripe_invoice_id" VARCHAR(255) UNIQUE,
    "stripe_payment_intent_id" VARCHAR(255),
    "number" VARCHAR(100) UNIQUE NOT NULL,
    "amount_due" INTEGER NOT NULL, -- in cents
    "amount_paid" INTEGER NOT NULL, -- in cents
    "currency" VARCHAR(10) DEFAULT 'usd' NOT NULL,
    "status" "InvoiceStatus" DEFAULT 'PAID' NOT NULL,
    "billing_reason" VARCHAR(100),
    "hosted_invoice_url" TEXT,
    "invoice_pdf_url" TEXT,
    "paid_at" TIMESTAMP WITH TIME ZONE,
    "due_date" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: usage_records
CREATE TABLE IF NOT EXISTS "usage_records" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "metric_key" VARCHAR(100) NOT NULL,
    "current" INTEGER DEFAULT 0 NOT NULL,
    "limit" INTEGER DEFAULT 100 NOT NULL,
    "period_start" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "period_end" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "unique_user_metric" UNIQUE ("user_id", "metric_key")
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" VARCHAR(64) REFERENCES "users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_stripe_customer" ON "users"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user" ON "subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_plan" ON "subscriptions"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_id" ON "subscriptions"("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_user" ON "invoices"("user_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_stripe_id" ON "invoices"("stripe_invoice_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
