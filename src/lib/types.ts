// Core Types for SaaS Subscription Management Platform

export type Role = 'USER' | 'ADMIN';

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'INCOMPLETE';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID';

export interface PlanLimits {
  apiCalls: number;
  teamSeats: number;
  storageGb: number;
  projects: number;
}

export interface Plan {
  id: string;
  name: string;
  slug: 'starter' | 'pro' | 'enterprise';
  description: string;
  priceMonthly: number; // in cents ($29.00 -> 2900)
  priceYearly: number;  // in cents ($290.00 -> 29000)
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  stripeProductId?: string;
  features: string[];
  limits: PlanLimits;
  isPopular?: boolean;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  company?: string;
  avatarUrl?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
  // Joined relation
  plan?: Plan;
  user?: User;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  number: string;
  amountDue: number; // cents
  amountPaid: number; // cents
  currency: string;
  status: InvoiceStatus;
  billingReason?: string;
  hostedInvoiceUrl?: string;
  invoicePdfUrl?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  // Joined
  planName?: string;
}

export interface UsageRecord {
  id: string;
  userId: string;
  metricKey: 'api_calls' | 'storage_gb' | 'team_seats' | 'projects';
  current: number;
  limit: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface RevenueAnalytics {
  mrr: number;           // Monthly Recurring Revenue in cents
  arr: number;           // Annual Recurring Revenue in cents
  totalRevenue: number;  // Total collected revenue in cents
  activeSubscribers: number;
  churnRate: number;     // e.g. 2.4%
  arpu: number;          // Average Revenue Per User in cents
  netRevenueGrowth: number; // percentage
  monthlyTrends: {
    month: string;
    revenue: number;
    subscribers: number;
  }[];
  planBreakdown: {
    planName: string;
    subscribers: number;
    mrr: number;
    color: string;
  }[];
  statusBreakdown: {
    status: SubscriptionStatus;
    count: number;
  }[];
}
