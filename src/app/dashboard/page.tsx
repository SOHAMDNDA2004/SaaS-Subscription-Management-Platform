'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Shield,
  Layers,
  FileText,
  Zap,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getSubscriptionStatusBadge,
  getInvoiceStatusBadge,
} from '@/lib/utils';
import { User, Subscription, UsageRecord, Invoice, Plan } from '@/lib/types';
import UpgradeModal from '@/components/UpgradeModal';
import CancelConfirmModal from '@/components/CancelConfirmModal';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<Plan | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subRes, invRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/invoices'),
      ]);

      const subData = await subRes.json();
      const invData = await invRes.json();

      setUser(subData.user);
      setSubscription(subData.subscription);
      setUsage(subData.usage || []);
      setPlans(subData.plans || []);
      setInvoices(invData.invoices || []);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for global simulation updates
    const handleUpdate = () => loadData();
    window.addEventListener('subscription-updated', handleUpdate);
    return () => window.removeEventListener('subscription-updated', handleUpdate);
  }, []);

  const handleOpenStripePortal = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryInvoicePayment = async (invoiceId: string) => {
    try {
      await fetch(`/api/invoices/${invoiceId}/pay`, { method: 'POST' });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          Loading your subscription details...
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan;
  const statusBadge = getSubscriptionStatusBadge(subscription?.status || 'ACTIVE');
  const isPastDue = subscription?.status === 'PAST_DUE';
  const isCancelPending = subscription?.cancelAtPeriodEnd;

  // Next tier to recommend
  const nextTier =
    currentPlan?.slug === 'starter'
      ? plans.find((p) => p.slug === 'pro')
      : plans.find((p) => p.slug === 'enterprise');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Delinquency Alert Banner if Past Due */}
      {isPastDue && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-200 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Payment Past Due</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Your last automated renewal charge failed. Please update your payment method to avoid service interruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const openInv = invoices.find((i) => i.status === 'OPEN');
              if (openInv) handleRetryInvoicePayment(openInv.id);
              else handleOpenStripePortal();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            Retry Payment Now
          </button>
        </div>
      )}

      {/* Cancellation Notice Banner */}
      {isCancelPending && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h4 className="text-sm font-bold">Subscription Scheduled to Cancel</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Your plan will remain fully active until <strong>{formatDate(subscription?.currentPeriodEnd)}</strong>, after which it will not renew.
              </p>
            </div>
          </div>
          <button
            onClick={handleResumeSubscription}
            disabled={actionLoading}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            Resume Subscription
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Subscription & Billing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your subscription tier, track API quota usage, and review past invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pricing"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Explore All Plans
          </Link>
          <button
            onClick={handleOpenStripePortal}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <ExternalLink className="h-4 w-4 text-slate-500" />
            Stripe Customer Portal
          </button>
        </div>
      </div>

      {/* Grid: Active Plan Summary & Payment Method */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Plan Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Subscription
              </span>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  SubSphere {currentPlan?.name || 'Professional'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadge.bg}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentPlan?.description || 'Scale your business with advanced analytics and priority support.'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(
                  subscription?.billingCycle === 'YEARLY'
                    ? currentPlan?.priceYearly || 49000
                    : currentPlan?.priceMonthly || 4900
                )}
                <span className="text-xs font-normal text-slate-500">
                  /{subscription?.billingCycle === 'YEARLY' ? 'year' : 'mo'}
                </span>
              </div>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {subscription?.billingCycle === 'YEARLY' ? 'Annual Billing (Saved 17%)' : 'Monthly Recurring'}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-medium text-slate-400">Next Billing Date</span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="h-4 w-4 text-slate-400" />
                {formatDate(subscription?.currentPeriodEnd)}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Renewal Amount</span>
              <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(
                  subscription?.billingCycle === 'YEARLY'
                    ? currentPlan?.priceYearly || 49000
                    : currentPlan?.priceMonthly || 4900
                )}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400">Account Owner</span>
              <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {nextTier && (
                <button
                  onClick={() => {
                    setTargetUpgradePlan(nextTier);
                    setUpgradeModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Upgrade to {nextTier.name}
                </button>
              )}
              <Link
                href="/dashboard/pricing"
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Change Tier / Cycle
              </Link>
            </div>

            <div>
              {!isCancelPending ? (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                >
                  Cancel Subscription
                </button>
              ) : (
                <button
                  onClick={handleResumeSubscription}
                  className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Keep Subscription Active
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Payment Method
              </span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                DEFAULT
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                VISA
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  •••• •••• •••• 4242
                </div>
                <div className="text-[11px] text-slate-500">Expires 12/28</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Billing Contact:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ID:</span>
                <span className="font-mono text-[11px]">US-942817281</span>
              </div>
              <div className="flex justify-between">
                <span>Stripe Customer ID:</span>
                <span className="font-mono text-[10px] text-slate-400">{user?.stripeCustomerId || 'cus_active_user'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenStripePortal}
            disabled={actionLoading}
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
          >
            <CreditCard className="h-4 w-4 text-slate-500" />
            Update Card / Billing Info
          </button>
        </div>
      </div>

      {/* Usage & Quotas Meters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Plan Quota & Resource Usage
            </h3>
            <p className="text-xs text-slate-500">
              Current cycle usage resets on {formatDate(subscription?.currentPeriodEnd)}
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Real-time Metering
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {usage.map((item) => {
            const percentage = Math.min(100, Math.round((item.current / item.limit) * 100));
            const isNearLimit = percentage >= 80;

            let metricTitle = 'API Calls';
            let unit = 'requests';
            if (item.metricKey === 'team_seats') {
              metricTitle = 'Team Seats';
              unit = 'seats';
            } else if (item.metricKey === 'storage_gb') {
              metricTitle = 'Cloud Storage';
              unit = 'GB';
            } else if (item.metricKey === 'projects') {
              metricTitle = 'Active Projects';
              unit = 'projects';
            }

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <span>{metricTitle}</span>
                  <span className={isNearLimit ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                    {percentage}%
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearLimit ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.current.toLocaleString()} {unit}
                  </span>
                  <span>of {item.limit.toLocaleString()} {unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Billing History & Invoices
            </h3>
            <p className="text-xs text-slate-500">
              Download formal PDF invoices and receipts for accounting
            </p>
          </div>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View All Invoices
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/40">
                <th className="py-3 px-4 font-bold">Invoice Number</th>
                <th className="py-3 px-4 font-bold">Billing Date</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.slice(0, 5).map((inv) => {
                const invBadge = getInvoiceStatusBadge(inv.status);
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.amountDue, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${invBadge.bg}`}
                      >
                        {invBadge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {inv.status === 'OPEN' && (
                        <button
                          onClick={() => handleRetryInvoicePayment(inv.id)}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
                        >
                          Pay Now
                        </button>
                      )}
                      <a
                        href={`/api/invoices/${inv.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Download className="h-3 w-3 text-slate-500" />
                        PDF Invoice
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade / Tier Switch Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        targetPlan={targetUpgradePlan}
        currentSubscription={subscription}
        billingCycle={subscription?.billingCycle || 'MONTHLY'}
        onSuccess={loadData}
      />

      {/* Cancel Subscription Modal */}
      <CancelConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        subscription={subscription}
        onSuccess={loadData}
      />
    </div>
  );
}
