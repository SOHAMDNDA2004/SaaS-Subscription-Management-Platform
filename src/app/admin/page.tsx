'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  Radio,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { formatCurrency, formatDate, getSubscriptionStatusBadge } from '@/lib/utils';
import { RevenueAnalytics, AuditLog, User, Plan } from '@/lib/types';
import WebhookSimulatorModal from '@/components/WebhookSimulatorModal';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanOverride, setSelectedPlanOverride] = useState<string>('plan_enterprise');
  const [overrideUserModal, setOverrideUserModal] = useState<any | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [authRes, metricRes, userRes, subRes] = await Promise.all([
        fetch('/api/auth/switch-user'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/users'),
        fetch('/api/subscription'),
      ]);

      const authData = await authRes.json();
      const metricData = await metricRes.json();
      const userData = await userRes.json();
      const subData = await subRes.json();

      setCurrentUser(authData.currentUser);
      setAnalytics(metricData.analytics);
      setAuditLogs(metricData.auditLogs || []);
      setUsers(userData.users || []);
      setPlans(subData.plans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    const handleUpdate = () => loadAdminData();
    window.addEventListener('subscription-updated', handleUpdate);
    return () => window.removeEventListener('subscription-updated', handleUpdate);
  }, []);

  const handleSwitchToAdmin = async () => {
    try {
      await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'usr_admin_alex' }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverridePlan = async (userId: string, planId: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'override_plan',
          userId,
          targetPlanId: planId,
        }),
      });
      if (res.ok) {
        setOverrideUserModal(null);
        await loadAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, newStatus: string) => {
    setIsActionLoading(true);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_subscription_status',
          userId,
          status: newStatus,
        }),
      });
      await loadAdminData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  // RBAC Access Control Guard
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* RBAC Notice if viewing as standard user */}
      {!isAdmin && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="text-sm font-bold">Standard User Persona Active ({currentUser?.name})</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You are currently logged in with the <strong>USER</strong> role. Administrators have unrestricted access to platform financials and user controls.
                </p>
              </div>
            </div>
            <button
              onClick={handleSwitchToAdmin}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
            >
              Switch to Admin Persona (Alex Vance)
            </button>
          </div>
        </div>
      )}

      {/* Admin Title & Webhook Simulator Launch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Role: {currentUser?.role}
            </span>
            <span className="text-xs text-slate-500">Global SaaS Control Plane</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Revenue Analytics & Subscriber Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Radio className="h-4 w-4 animate-pulse" />
            Fire Stripe Webhook
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {analytics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* MRR */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Monthly Recurring (MRR)
              </span>
              <span className="flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <TrendingUp className="h-3 w-3" />
                +{analytics.netRevenueGrowth}%
              </span>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(analytics.mrr)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ARR Run Rate: <strong>{formatCurrency(analytics.arr)}</strong>
            </p>
          </div>

          {/* Active Subscribers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Subscribers
              </span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {analytics.activeSubscribers}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Across Starter, Pro, and Enterprise
            </p>
          </div>

          {/* ARPU */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Revenue / User (ARPU)
              </span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(analytics.arpu)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Blended average monthly seat value
            </p>
          </div>

          {/* Churn Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Churn Rate
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                30-day
              </span>
            </div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {analytics.churnRate}%
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              Industry benchmark &lt; 3.5%
            </p>
          </div>
        </div>
      )}

      {/* Visual Analytics Row: Revenue Trend & Plan Distribution */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Growth Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Revenue Trajectory (MoM)
                </h3>
                <p className="text-xs text-slate-500">
                  Last 6 months verified recurring billing revenue
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Stripe Automated Sync
              </span>
            </div>

            {/* SVG / Bar Chart Representation */}
            <div className="h-56 flex items-end justify-between gap-4 pt-4 px-2">
              {analytics.monthlyTrends.map((trend, i) => {
                const maxVal = Math.max(...analytics.monthlyTrends.map((t) => t.revenue));
                const heightPercent = Math.max(15, Math.round((trend.revenue / maxVal) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(trend.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t-xl bg-indigo-600 group-hover:bg-indigo-500 transition-all duration-300 relative shadow-sm"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-t-xl" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {trend.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Plan Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-6">Active subscription share by tier</p>

            <div className="space-y-4">
              {analytics.planBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.planName}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.subscribers} subs ({formatCurrency(item.mrr)}/mo)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: item.color,
                        width: `${analytics.activeSubscribers > 0 ? (item.subscribers / analytics.activeSubscribers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Total Lifetime Collected
              </span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(analytics.totalRevenue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* User Management & Plan Override Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              User Accounts & Subscriptions
            </h3>
            <p className="text-xs text-slate-500">
              Manage accounts, override subscription tiers manually, or toggle status
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/40">
                <th className="py-3 px-4 font-bold">User</th>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Active Tier</th>
                <th className="py-3 px-4 font-bold">Cycle</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Total Spent</th>
                <th className="py-3 px-4 font-bold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users
                .filter(
                  (u) =>
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((u) => {
                  const sub = u.subscription;
                  const badge = getSubscriptionStatusBadge(sub?.status || 'INCOMPLETE');

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {sub?.plan?.name || 'No Plan'}
                      </td>
                      <td className="py-4 px-4 capitalize text-slate-600 dark:text-slate-400">
                        {sub?.billingCycle?.toLowerCase() || 'monthly'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(u.totalSpent || 0)}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => setOverrideUserModal(u)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700"
                        >
                          Change Tier
                        </button>
                        {sub?.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleToggleStatus(u.id, 'CANCELED')}
                            className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u.id, 'ACTIVE')}
                            className="rounded-lg border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Audit Log & Stripe Events */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Audit Trail & Webhook Event Logs
            </h3>
            <p className="text-xs text-slate-500">
              Live audit record of billing events, Stripe webhooks, and subscription lifecycle actions
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Event Stream
          </span>
        </div>

        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {log.action}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {log.details ? JSON.stringify(log.details) : 'Action processed successfully'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-400 mt-1 sm:mt-0 text-[11px]">
                <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                <span>{formatDate(log.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Plan Override Modal */}
      {overrideUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Override Subscription for {overrideUserModal.name}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Select target plan tier. Quotas and limits will be updated immediately.
            </p>

            <div className="space-y-2 mb-6">
              {plans.map((p) => (
                <label
                  key={p.id}
                  onClick={() => setSelectedPlanOverride(p.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer ${
                    selectedPlanOverride === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{p.name}</span>
                    <span className="text-[11px] text-slate-500">{formatCurrency(p.priceMonthly)}/mo</span>
                  </div>
                  <input
                    type="radio"
                    name="override_plan"
                    checked={selectedPlanOverride === p.id}
                    onChange={() => setSelectedPlanOverride(p.id)}
                    className="text-indigo-600"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setOverrideUserModal(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverridePlan(overrideUserModal.id, selectedPlanOverride)}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                {isActionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Apply Tier Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      <WebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onEventExecuted={loadAdminData}
      />
    </div>
  );
}
