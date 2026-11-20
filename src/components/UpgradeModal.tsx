'use client';

import React, { useState } from 'react';
import { Plan, Subscription, BillingCycle } from '@/lib/types';
import { formatCurrency, calculateProration } from '@/lib/utils';
import { X, Check, ArrowRight, ShieldCheck, Zap, Sparkles, RefreshCw } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: Plan | null;
  currentSubscription: Subscription | null;
  billingCycle: BillingCycle;
  onSuccess: () => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  targetPlan,
  currentSubscription,
  billingCycle,
  onSuccess,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetPlan) return null;

  const currentPlan = currentSubscription?.plan;
  const isDowngrade =
    currentPlan &&
    (billingCycle === 'MONTHLY' ? targetPlan.priceMonthly : targetPlan.priceYearly) <
      (currentSubscription.billingCycle === 'MONTHLY'
        ? currentPlan.priceMonthly
        : currentPlan.priceYearly);

  const currentPrice = currentPlan
    ? currentSubscription.billingCycle === 'MONTHLY'
      ? currentPlan.priceMonthly
      : currentPlan.priceYearly
    : 0;

  const newPrice =
    billingCycle === 'MONTHLY' ? targetPlan.priceMonthly : targetPlan.priceYearly;

  const proration = calculateProration({
    currentPriceCents: currentPrice,
    newPriceCents: newPrice,
    daysRemainingInPeriod: 18,
  });

  const handleConfirmPlanSwitch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch_plan',
          planId: targetPlan.id,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update plan');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isDowngrade ? 'Confirm Plan Change' : `Upgrade to ${targetPlan.name}`}
            </h3>
            <p className="text-xs text-slate-500">
              {billingCycle === 'YEARLY' ? 'Annual Commitment' : 'Monthly Recurring'}
            </p>
          </div>
        </div>

        {/* Transition Preview Card */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {currentPlan?.name || 'Starter'}
            </div>
            <div className="text-xs text-slate-500">
              {formatCurrency(currentPrice)}/{currentSubscription?.billingCycle?.toLowerCase() || 'mo'}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              New Plan
            </span>
            <div className="font-bold text-indigo-600 dark:text-indigo-400">
              {targetPlan.name}
            </div>
            <div className="text-xs text-slate-500">
              {formatCurrency(newPrice)}/{billingCycle.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Proration Calculation Box */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 mb-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-2">
            Proration Breakdown
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Remaining balance on current plan (18 days credit):</span>
              <span className="font-medium text-emerald-600">
                -{formatCurrency(proration.unusedCredit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>New plan charge (prorated for remaining days):</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                +{formatCurrency(proration.newPlanCharge)}
              </span>
            </div>
            <div className="border-t border-indigo-100 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white dark:border-indigo-900/50">
              <span>Amount due today:</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {formatCurrency(proration.netDueNow)}
              </span>
            </div>
          </div>
        </div>

        {/* Target Plan Key Highlights */}
        <div className="mb-6 space-y-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Features included immediately:
          </span>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {targetPlan.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPlanSwitch}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Confirm {isDowngrade ? 'Change' : 'Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}
