'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Plan, Subscription, BillingCycle } from '@/lib/types';
import UpgradeModal from '@/components/UpgradeModal';

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [isLoading, setIsLoading] = useState(true);

  // Upgrade Modal
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/subscription');
      const data = await res.json();
      setPlans(data.plans || []);
      setSubscription(data.subscription || null);
      if (data.subscription?.billingCycle) {
        setBillingCycle(data.subscription.billingCycle);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    const isCurrentPlan = subscription?.planId === plan.id;
    const isSameCycle = subscription?.billingCycle === billingCycle;

    if (isCurrentPlan && isSameCycle) {
      return; // Already on this plan and cycle
    }

    // If user already has an active subscription, open the in-app Proration Upgrade Modal
    if (subscription && subscription.status === 'ACTIVE') {
      setSelectedPlan(plan);
      setIsModalOpen(true);
      return;
    }

    // Otherwise, initiate Stripe Checkout Session
    setCheckoutLoading(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Title & Cycle Toggle */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Flexible SaaS Pricing
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Pick the perfect plan for your team
        </h1>
        <p className="text-sm text-slate-500">
          Switch tiers or billing cycles anytime. Upgrades are prorated immediately, with zero interruption to your service.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="pt-4 flex items-center justify-center">
          <div className="relative flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                billingCycle === 'YEARLY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Annual Commitment
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                SAVE 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;
          const isPopular = plan.isPopular;
          const price = billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
          const isHigherTier =
            subscription?.plan &&
            (billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly) >
              (subscription.billingCycle === 'MONTHLY'
                ? subscription.plan.priceMonthly
                : subscription.plan.priceYearly);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-200 ${
                isPopular
                  ? 'border-indigo-600 bg-white shadow-xl ring-2 ring-indigo-600/20 dark:bg-slate-900'
                  : 'border-slate-200 bg-white/70 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500 min-h-[32px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    /{billingCycle === 'MONTHLY' ? 'month' : 'year'}
                  </span>
                </div>

                {billingCycle === 'YEARLY' && (
                  <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Billed annually (${(price / 1200).toFixed(2)}/mo effective)
                  </p>
                )}

                {/* Limits Summary Pills */}
                <div className="mt-6 grid grid-cols-2 gap-2 border-y border-slate-100 py-4 text-xs dark:border-slate-800">
                  <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">API Calls</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {plan.limits.apiCalls >= 1000000 ? '1M+' : `${plan.limits.apiCalls.toLocaleString()}/mo`}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Team Seats</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {plan.limits.teamSeats > 500 ? 'Unlimited' : `${plan.limits.teamSeats} seats`}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent && subscription?.billingCycle === billingCycle || checkoutLoading === plan.id}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                    isCurrent && subscription?.billingCycle === billingCycle
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                      : isPopular
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700'
                      : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {checkoutLoading === plan.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : isCurrent && subscription?.billingCycle === billingCycle ? (
                    'Current Active Plan'
                  ) : isCurrent ? (
                    `Switch to ${billingCycle.toLowerCase()}`
                  ) : isHigherTier ? (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    `Switch to ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / Assurance Section */}
      <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Frequently Asked Questions regarding SaaS Billing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              How does upgrade proration work?
            </span>
            When you upgrade mid-month, you are only charged the difference for the remaining days in your billing cycle. Unused days on your current tier are automatically credited.
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Can I cancel anytime?
            </span>
            Yes. You can cancel with 1 click from the dashboard. Your plan will remain active until the end of your prepaid period, with no unexpected cancellation penalties.
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Are payments secure?
            </span>
            All transactions and card information are processed directly by Stripe’s PCI-DSS Level 1 certified infrastructure with 256-bit SSL encryption.
          </div>
        </div>
      </div>

      {/* Upgrade Proration Modal */}
      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetPlan={selectedPlan}
        currentSubscription={subscription}
        billingCycle={billingCycle}
        onSuccess={() => {
          loadData();
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
