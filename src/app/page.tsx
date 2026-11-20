'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Shield,
  Layers,
  CreditCard,
  FileText,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  Database,
  Radio,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Plan, BillingCycle } from '@/lib/types';

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');

  useEffect(() => {
    fetch('/api/subscription')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Full-Stack Next.js 14 App Router + Stripe + PostgreSQL Prisma
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl max-w-4xl mx-auto leading-tight">
            Scalable SaaS Subscription & Billing Platform
          </h1>

          <p className="mt-6 text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade subscription management with Stripe Checkout, automated webhook synchronization, prorated tier upgrades, downloadable PDF invoices, and an administrator revenue control plane.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all"
            >
              <Layers className="h-4 w-4" />
              Launch User Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Shield className="h-4 w-4 text-indigo-600" />
              Open Admin Control Plane
            </Link>
          </div>

          {/* Quick Persona Launch Bar */}
          <div className="mt-12 mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Instant Persona Switcher (For Evaluation & QA)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={async () => {
                  await fetch('/api/auth/switch-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'usr_sarah_pro' }),
                  });
                  window.location.href = '/dashboard';
                }}
                className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-2 text-left hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40"
              >
                <div className="font-bold text-xs text-indigo-900 dark:text-indigo-200">Sarah Connor</div>
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400">Pro Plan (Active)</div>
              </button>

              <button
                onClick={async () => {
                  await fetch('/api/auth/switch-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'usr_admin_alex' }),
                  });
                  window.location.href = '/admin';
                }}
                className="rounded-xl border border-amber-200 bg-amber-50/60 p-2 text-left hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40"
              >
                <div className="font-bold text-xs text-amber-900 dark:text-amber-200">Alex Vance</div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400">Administrator</div>
              </button>

              <button
                onClick={async () => {
                  await fetch('/api/auth/switch-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'usr_marcus_starter' }),
                  });
                  window.location.href = '/dashboard';
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Marcus Wright</div>
                <div className="text-[10px] text-slate-500">Starter Plan</div>
              </button>

              <button
                onClick={async () => {
                  await fetch('/api/auth/switch-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'usr_elena_pastdue' }),
                  });
                  window.location.href = '/dashboard';
                }}
                className="rounded-xl border border-rose-200 bg-rose-50/60 p-2 text-left hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40"
              >
                <div className="font-bold text-xs text-rose-900 dark:text-rose-200">Elena Rostova</div>
                <div className="text-[10px] text-rose-700 dark:text-rose-400">Past Due (Delinquent)</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Architecture Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            System Pillars
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl mt-1">
            Engineered for high reliability & zero leakage
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">PostgreSQL Architecture</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Strict relational schema with Users, Plans, Subscriptions, and Invoices. Includes Prisma ORM models and pure SQL DDL scripts.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Stripe Checkout & Billing</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Hosted checkout sessions, customer billing portal, prorated billing calculations, and webhook idempotency.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-4">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Webhook Simulator</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Simulate upgrades, downgrades, cancellations, and payment failures directly in the UI without requiring Stripe CLI or tunnels.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin Control & MRR</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Role-based access dashboard calculating Monthly Recurring Revenue (MRR), ARR, Churn, and manual plan override controls.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Subscription Tiers & Packaging
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Switch between monthly and annual commitments
          </p>

          <div className="mt-4 flex items-center justify-center">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('YEARLY')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  billingCycle === 'YEARLY'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Yearly
                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  SAVE 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-3xl border p-8 ${
                  plan.isPopular
                    ? 'border-indigo-600 bg-white shadow-xl ring-2 ring-indigo-600/20 dark:bg-slate-900'
                    : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.isPopular && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs text-slate-500">
                      /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href="/dashboard/pricing"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                  >
                    Select {plan.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
