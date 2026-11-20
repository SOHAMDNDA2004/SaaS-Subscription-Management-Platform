import {
  User,
  Plan,
  Subscription,
  Invoice,
  UsageRecord,
  AuditLog,
  RevenueAnalytics,
  BillingCycle,
  SubscriptionStatus,
} from './types';
import {
  INITIAL_PLANS,
  INITIAL_USERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_USAGE,
  INITIAL_AUDIT_LOGS,
} from './seed-data';

// Singleton in-memory state store for reliable runtime access across API routes
declare global {
  // eslint-disable-next-line no-var
  var __dbStore: {
    users: User[];
    plans: Plan[];
    subscriptions: Subscription[];
    invoices: Invoice[];
    usage: UsageRecord[];
    auditLogs: AuditLog[];
    currentUserId: string;
  } | undefined;
}

if (!global.__dbStore) {
  global.__dbStore = {
    users: [...INITIAL_USERS],
    plans: [...INITIAL_PLANS],
    subscriptions: [...INITIAL_SUBSCRIPTIONS],
    invoices: [...INITIAL_INVOICES],
    usage: [...INITIAL_USAGE],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    currentUserId: 'usr_sarah_pro', // Default persona: active Pro tier user
  };
}

const store = global.__dbStore;

export const db = {
  // --- Active Persona Session Management ---
  getActiveUserId(): string {
    return store.currentUserId;
  },

  setActiveUserId(userId: string): User | undefined {
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      store.currentUserId = userId;
    }
    return user;
  },

  getActiveUser(): User {
    const user = store.users.find((u) => u.id === store.currentUserId);
    return user || store.users[0];
  },

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return [...store.users];
  },

  async getUserById(id: string): Promise<User | null> {
    const user = store.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  },

  async getUserByStripeCustomer(stripeCustomerId: string): Promise<User | null> {
    const user = store.users.find((u) => u.stripeCustomerId === stripeCustomerId);
    return user ? { ...user } : null;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const index = store.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`User with ID ${id} not found`);
    store.users[index] = {
      ...store.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...store.users[index] };
  },

  // --- Plans ---
  async getPlans(): Promise<Plan[]> {
    return [...store.plans];
  },

  async getPlanById(id: string): Promise<Plan | null> {
    const plan = store.plans.find((p) => p.id === id);
    return plan ? { ...plan } : null;
  },

  async getPlanBySlug(slug: string): Promise<Plan | null> {
    const plan = store.plans.find((p) => p.slug === slug);
    return plan ? { ...plan } : null;
  },

  async getPlanByStripePrice(priceId: string): Promise<Plan | null> {
    const plan = store.plans.find(
      (p) => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId
    );
    return plan ? { ...plan } : null;
  },

  // --- Subscriptions ---
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const sub = store.subscriptions.find((s) => s.userId === userId);
    if (!sub) return null;
    const plan = store.plans.find((p) => p.id === sub.planId);
    return {
      ...sub,
      plan: plan ? { ...plan } : undefined,
    };
  },

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const sub = store.subscriptions.find((s) => s.stripeSubscriptionId === stripeSubscriptionId);
    if (!sub) return null;
    const plan = store.plans.find((p) => p.id === sub.planId);
    return {
      ...sub,
      plan: plan ? { ...plan } : undefined,
    };
  },

  async createOrUpdateSubscription(
    data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<Subscription> {
    const existingIndex = store.subscriptions.findIndex(
      (s) => (data.id && s.id === data.id) || s.userId === data.userId
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      store.subscriptions[existingIndex] = {
        ...store.subscriptions[existingIndex],
        ...data,
        updatedAt: now,
      };
      const plan = store.plans.find((p) => p.id === store.subscriptions[existingIndex].planId);
      return {
        ...store.subscriptions[existingIndex],
        plan: plan ? { ...plan } : undefined,
      };
    } else {
      const newSub: Subscription = {
        id: data.id || `sub_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      store.subscriptions.push(newSub);
      const plan = store.plans.find((p) => p.id === newSub.planId);
      return {
        ...newSub,
        plan: plan ? { ...plan } : undefined,
      };
    }
  },

  async cancelSubscription(userId: string, cancelImmediately = false): Promise<Subscription> {
    const sub = await this.getSubscriptionByUserId(userId);
    if (!sub) throw new Error('No active subscription found');

    const now = new Date().toISOString();
    return this.createOrUpdateSubscription({
      ...sub,
      status: cancelImmediately ? 'CANCELED' : sub.status,
      cancelAtPeriodEnd: !cancelImmediately,
      canceledAt: now,
    });
  },

  // --- Invoices ---
  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    return store.invoices
      .filter((inv) => inv.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllInvoices(): Promise<Invoice[]> {
    return [...store.invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const inv = store.invoices.find((i) => i.id === id);
    return inv ? { ...inv } : null;
  },

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> {
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...invoiceData,
    };
    store.invoices.unshift(newInvoice);
    return newInvoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const index = store.invoices.findIndex((i) => i.id === id);
    if (index === -1) throw new Error(`Invoice ${id} not found`);
    store.invoices[index] = {
      ...store.invoices[index],
      ...updates,
    };
    return { ...store.invoices[index] };
  },

  // --- Usage Records ---
  async getUsageByUserId(userId: string): Promise<UsageRecord[]> {
    return store.usage.filter((u) => u.userId === userId);
  },

  async updateUsage(
    userId: string,
    metricKey: 'api_calls' | 'storage_gb' | 'team_seats' | 'projects',
    current: number,
    limit?: number
  ): Promise<UsageRecord> {
    const index = store.usage.findIndex((u) => u.userId === userId && u.metricKey === metricKey);
    const now = new Date().toISOString();

    if (index >= 0) {
      store.usage[index] = {
        ...store.usage[index],
        current,
        limit: limit !== undefined ? limit : store.usage[index].limit,
        updatedAt: now,
      };
      return { ...store.usage[index] };
    } else {
      const newUsage: UsageRecord = {
        id: `usg_${Date.now()}`,
        userId,
        metricKey,
        current,
        limit: limit || 100,
        periodStart: now,
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now,
      };
      store.usage.push(newUsage);
      return newUsage;
    }
  },

  // --- Audit Logs ---
  async getAuditLogs(limit = 20): Promise<AuditLog[]> {
    return store.auditLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  async logAudit(action: string, userId?: string, details?: Record<string, any>, ipAddress?: string): Promise<AuditLog> {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      userId,
      details,
      ipAddress: ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    return log;
  },

  // --- Global Analytics & Financial Metrics ---
  async getAnalytics(): Promise<RevenueAnalytics> {
    let mrr = 0;
    let activeSubscribers = 0;
    const planCounts: Record<string, { count: number; mrr: number }> = {
      starter: { count: 0, mrr: 0 },
      pro: { count: 0, mrr: 0 },
      enterprise: { count: 0, mrr: 0 },
    };
    const statusCounts: Record<SubscriptionStatus, number> = {
      ACTIVE: 0,
      TRIALING: 0,
      PAST_DUE: 0,
      CANCELED: 0,
      UNPAID: 0,
      INCOMPLETE: 0,
    };

    for (const sub of store.subscriptions) {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;

      if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') {
        activeSubscribers += 1;
        const plan = store.plans.find((p) => p.id === sub.planId);
        if (plan) {
          const planMrr = sub.billingCycle === 'MONTHLY' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
          mrr += planMrr;

          if (planCounts[plan.slug]) {
            planCounts[plan.slug].count += 1;
            planCounts[plan.slug].mrr += planMrr;
          }
        }
      }
    }

    const arr = mrr * 12;

    // Calculate total paid invoices
    const totalRevenue = store.invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amountPaid, 0);

    const arpu = activeSubscribers > 0 ? Math.round(mrr / activeSubscribers) : 0;
    const totalUsers = store.users.length;
    const churnCount = statusCounts.CANCELED || 0;
    const churnRate = totalUsers > 0 ? Number(((churnCount / totalUsers) * 100).toFixed(1)) : 2.1;

    return {
      mrr,
      arr,
      totalRevenue,
      activeSubscribers,
      churnRate,
      arpu,
      netRevenueGrowth: 18.4,
      monthlyTrends: [
        { month: 'Jun', revenue: 142000, subscribers: 38 },
        { month: 'Jul', revenue: 178000, subscribers: 47 },
        { month: 'Aug', revenue: 215000, subscribers: 58 },
        { month: 'Sep', revenue: 264000, subscribers: 72 },
        { month: 'Oct', revenue: 312000, subscribers: 86 },
        { month: 'Nov', revenue: mrr, subscribers: activeSubscribers },
      ],
      planBreakdown: [
        {
          planName: 'Starter',
          subscribers: planCounts.starter.count,
          mrr: planCounts.starter.mrr,
          color: '#818cf8',
        },
        {
          planName: 'Pro',
          subscribers: planCounts.pro.count,
          mrr: planCounts.pro.mrr,
          color: '#4f46e5',
        },
        {
          planName: 'Enterprise',
          subscribers: planCounts.enterprise.count,
          mrr: planCounts.enterprise.mrr,
          color: '#312e81',
        },
      ],
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status: status as SubscriptionStatus,
        count,
      })),
    };
  },
};
