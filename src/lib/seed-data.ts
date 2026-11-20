import { Plan, User, Subscription, Invoice, UsageRecord, AuditLog } from './types';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan_starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Essential tools for early-stage teams and indie builders.',
    priceMonthly: 1900,  // $19/mo
    priceYearly: 19000,  // $190/yr ($15.83/mo - ~17% off)
    stripePriceIdMonthly: 'price_starter_monthly_live_test',
    stripePriceIdYearly: 'price_starter_yearly_live_test',
    stripeProductId: 'prod_starter_saas',
    features: [
      'Up to 10,000 API calls / month',
      '3 Team member seats',
      '5 GB Secure cloud storage',
      'Up to 5 active projects',
      'Community & email support',
      'Standard webhook latency (500ms)',
      'Basic analytics dashboard'
    ],
    limits: {
      apiCalls: 10000,
      teamSeats: 3,
      storageGb: 5,
      projects: 5
    },
    isPopular: false,
    isActive: true
  },
  {
    id: 'plan_pro',
    name: 'Professional',
    slug: 'pro',
    description: 'High performance, increased throughput, and advanced SaaS workflows.',
    priceMonthly: 4900,  // $49/mo
    priceYearly: 49000,  // $490/yr ($40.83/mo - ~17% off)
    stripePriceIdMonthly: 'price_pro_monthly_live_test',
    stripePriceIdYearly: 'price_pro_yearly_live_test',
    stripeProductId: 'prod_pro_saas',
    features: [
      'Up to 100,000 API calls / month',
      '15 Team member seats',
      '50 GB Secure cloud storage',
      'Unlimited active projects',
      'Priority 24/7 chat & email support',
      'High-throughput webhooks (<100ms)',
      'Custom webhook signatures & retries',
      'Advanced financial & cohort analytics',
      'Team audit logs'
    ],
    limits: {
      apiCalls: 100000,
      teamSeats: 15,
      storageGb: 50,
      projects: 9999
    },
    isPopular: true,
    isActive: true
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Dedicated infrastructure, custom SLAs, and custom limits for scale.',
    priceMonthly: 14900, // $149/mo
    priceYearly: 149000, // $1,490/yr ($124.16/mo - ~17% off)
    stripePriceIdMonthly: 'price_enterprise_monthly_live_test',
    stripePriceIdYearly: 'price_enterprise_yearly_live_test',
    stripeProductId: 'prod_enterprise_saas',
    features: [
      'Unlimited API calls (fair use 1M+)',
      'Unlimited team member seats',
      '500 GB Secure cloud storage',
      'Dedicated private database cluster',
      'Dedicated account manager & 99.99% SLA',
      'Role-based SSO (SAML, Okta, Azure AD)',
      'Custom Stripe billing schedules',
      'SOC2 compliance reports'
    ],
    limits: {
      apiCalls: 1000000,
      teamSeats: 999,
      storageGb: 500,
      projects: 99999
    },
    isPopular: false,
    isActive: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_sarah_pro',
    email: 'sarah.connor@cyberdyne.io',
    name: 'Sarah Connor',
    role: 'USER',
    company: 'Cyberdyne Systems',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    stripeCustomerId: 'cus_N9Xv72QweL1',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z'
  },
  {
    id: 'usr_admin_alex',
    email: 'alex.vance@blackmesa.org',
    name: 'Alex Vance (Admin)',
    role: 'ADMIN',
    company: 'Black Mesa Labs',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    stripeCustomerId: 'cus_Adm981ZyxK2',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-11-02T09:30:00Z'
  },
  {
    id: 'usr_marcus_starter',
    email: 'marcus.wright@resistance.dev',
    name: 'Marcus Wright',
    role: 'USER',
    company: 'Resistance Core',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    stripeCustomerId: 'cus_K4R12Pq981',
    createdAt: '2026-09-01T14:20:00Z',
    updatedAt: '2026-10-25T11:15:00Z'
  },
  {
    id: 'usr_elena_pastdue',
    email: 'elena.rostova@aurora.tech',
    name: 'Elena Rostova',
    role: 'USER',
    company: 'Aurora AI',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    stripeCustomerId: 'cus_PastDue992x',
    createdAt: '2026-07-20T16:45:00Z',
    updatedAt: '2026-11-03T04:10:00Z'
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_sarah_001',
    userId: 'usr_sarah_pro',
    planId: 'plan_pro',
    stripeSubscriptionId: 'sub_1OqK2x8291KlMN',
    stripePriceId: 'price_pro_monthly_live_test',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    currentPeriodStart: '2026-10-15T10:00:00Z',
    currentPeriodEnd: '2026-11-15T10:00:00Z',
    cancelAtPeriodEnd: false,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'sub_admin_001',
    userId: 'usr_admin_alex',
    planId: 'plan_enterprise',
    stripeSubscriptionId: 'sub_1AdminEnt99120',
    stripePriceId: 'price_enterprise_yearly_live_test',
    status: 'ACTIVE',
    billingCycle: 'YEARLY',
    currentPeriodStart: '2026-01-10T08:00:00Z',
    currentPeriodEnd: '2027-01-10T08:00:00Z',
    cancelAtPeriodEnd: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'sub_marcus_001',
    userId: 'usr_marcus_starter',
    planId: 'plan_starter',
    stripeSubscriptionId: 'sub_1MarcStarter882',
    stripePriceId: 'price_starter_monthly_live_test',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    currentPeriodStart: '2026-10-01T14:20:00Z',
    currentPeriodEnd: '2026-11-01T14:20:00Z',
    cancelAtPeriodEnd: false,
    createdAt: '2026-09-01T14:20:00Z',
    updatedAt: '2026-10-01T14:20:00Z'
  },
  {
    id: 'sub_elena_001',
    userId: 'usr_elena_pastdue',
    planId: 'plan_pro',
    stripeSubscriptionId: 'sub_1ElenaPastDue44',
    stripePriceId: 'price_pro_monthly_live_test',
    status: 'PAST_DUE',
    billingCycle: 'MONTHLY',
    currentPeriodStart: '2026-10-20T16:45:00Z',
    currentPeriodEnd: '2026-11-20T16:45:00Z',
    cancelAtPeriodEnd: false,
    createdAt: '2026-07-20T16:45:00Z',
    updatedAt: '2026-11-03T04:10:00Z'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_1001',
    userId: 'usr_sarah_pro',
    subscriptionId: 'sub_sarah_001',
    stripeInvoiceId: 'in_1Pqw928741Xza9',
    stripePaymentIntentId: 'pi_3Mtw2899xKlq',
    number: 'INV-2026-0089',
    amountDue: 4900,
    amountPaid: 4900,
    currency: 'usd',
    status: 'PAID',
    billingReason: 'subscription_cycle',
    hostedInvoiceUrl: 'https://pay.stripe.com/invoice/mock_inv_1001',
    invoicePdfUrl: '/api/invoices/inv_1001/download',
    paidAt: '2026-10-15T10:02:14Z',
    dueDate: '2026-10-15T10:00:00Z',
    createdAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'inv_1002',
    userId: 'usr_sarah_pro',
    subscriptionId: 'sub_sarah_001',
    stripeInvoiceId: 'in_1Oxx918274Klqq',
    stripePaymentIntentId: 'pi_3Lqq182937Aad',
    number: 'INV-2026-0042',
    amountDue: 4900,
    amountPaid: 4900,
    currency: 'usd',
    status: 'PAID',
    billingReason: 'subscription_cycle',
    hostedInvoiceUrl: 'https://pay.stripe.com/invoice/mock_inv_1002',
    invoicePdfUrl: '/api/invoices/inv_1002/download',
    paidAt: '2026-09-15T10:01:45Z',
    dueDate: '2026-09-15T10:00:00Z',
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'inv_1003',
    userId: 'usr_sarah_pro',
    subscriptionId: 'sub_sarah_001',
    stripeInvoiceId: 'in_1Nyy827163Mopq',
    stripePaymentIntentId: 'pi_3Kpp928172Zxc',
    number: 'INV-2026-0015',
    amountDue: 4900,
    amountPaid: 4900,
    currency: 'usd',
    status: 'PAID',
    billingReason: 'subscription_create',
    hostedInvoiceUrl: 'https://pay.stripe.com/invoice/mock_inv_1003',
    invoicePdfUrl: '/api/invoices/inv_1003/download',
    paidAt: '2026-08-15T10:03:00Z',
    dueDate: '2026-08-15T10:00:00Z',
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'inv_1004',
    userId: 'usr_elena_pastdue',
    subscriptionId: 'sub_elena_001',
    stripeInvoiceId: 'in_1Fail827192Fail',
    stripePaymentIntentId: 'pi_3FailIntent889',
    number: 'INV-2026-0094',
    amountDue: 4900,
    amountPaid: 0,
    currency: 'usd',
    status: 'OPEN',
    billingReason: 'subscription_cycle',
    hostedInvoiceUrl: 'https://pay.stripe.com/invoice/mock_inv_1004',
    invoicePdfUrl: '/api/invoices/inv_1004/download',
    paidAt: undefined,
    dueDate: '2026-10-25T16:45:00Z',
    createdAt: '2026-10-20T16:45:00Z'
  },
  {
    id: 'inv_1005',
    userId: 'usr_marcus_starter',
    subscriptionId: 'sub_marcus_001',
    stripeInvoiceId: 'in_1MarcInv10092',
    stripePaymentIntentId: 'pi_3MarcPi10928',
    number: 'INV-2026-0078',
    amountDue: 1900,
    amountPaid: 1900,
    currency: 'usd',
    status: 'PAID',
    billingReason: 'subscription_cycle',
    hostedInvoiceUrl: 'https://pay.stripe.com/invoice/mock_inv_1005',
    invoicePdfUrl: '/api/invoices/inv_1005/download',
    paidAt: '2026-10-01T14:22:10Z',
    dueDate: '2026-10-01T14:20:00Z',
    createdAt: '2026-10-01T14:20:00Z'
  }
];

export const INITIAL_USAGE: UsageRecord[] = [
  {
    id: 'usg_sarah_api',
    userId: 'usr_sarah_pro',
    metricKey: 'api_calls',
    current: 68420,
    limit: 100000,
    periodStart: '2026-10-15T10:00:00Z',
    periodEnd: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-04T08:30:00Z'
  },
  {
    id: 'usg_sarah_seats',
    userId: 'usr_sarah_pro',
    metricKey: 'team_seats',
    current: 9,
    limit: 15,
    periodStart: '2026-10-15T10:00:00Z',
    periodEnd: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-04T08:30:00Z'
  },
  {
    id: 'usg_sarah_storage',
    userId: 'usr_sarah_pro',
    metricKey: 'storage_gb',
    current: 38,
    limit: 50,
    periodStart: '2026-10-15T10:00:00Z',
    periodEnd: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-04T08:30:00Z'
  },
  {
    id: 'usg_sarah_proj',
    userId: 'usr_sarah_pro',
    metricKey: 'projects',
    current: 24,
    limit: 9999,
    periodStart: '2026-10-15T10:00:00Z',
    periodEnd: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-04T08:30:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    userId: 'usr_sarah_pro',
    action: 'SUBSCRIPTION_RENEWED',
    details: { plan: 'Pro', amount: '$49.00', invoice: 'INV-2026-0089' },
    ipAddress: '198.51.100.42',
    createdAt: '2026-10-15T10:02:14Z'
  },
  {
    id: 'log_02',
    userId: 'usr_elena_pastdue',
    action: 'PAYMENT_FAILED',
    details: { invoice: 'INV-2026-0094', reason: 'card_declined', attempt: 1 },
    ipAddress: '203.0.113.19',
    createdAt: '2026-10-20T16:45:10Z'
  },
  {
    id: 'log_03',
    userId: 'usr_sarah_pro',
    action: 'API_KEY_ROTATED',
    details: { keyHint: 'sk_live_...9f2a' },
    ipAddress: '198.51.100.42',
    createdAt: '2026-10-28T14:12:00Z'
  },
  {
    id: 'log_04',
    userId: 'usr_admin_alex',
    action: 'STRIPE_WEBHOOK_PROCESSED',
    details: { event: 'customer.subscription.updated', status: 'handled' },
    ipAddress: '54.187.174.169',
    createdAt: '2026-11-01T09:15:30Z'
  }
];
