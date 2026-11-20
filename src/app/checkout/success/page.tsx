'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Layers, FileText, RefreshCw } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const planId = searchParams.get('plan_id');
  const cycle = searchParams.get('cycle') || 'MONTHLY';
  const userId = searchParams.get('user_id');

  const [isProvisioning, setIsProvisioning] = useState(true);

  useEffect(() => {
    // If arriving from a sandbox checkout session, trigger checkout.session.completed processing
    const syncSubscription = async () => {
      try {
        if (planId) {
          await fetch('/api/simulation/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'checkout.session.completed',
              userId: userId || undefined,
              planSlug: planId.replace('plan_', ''),
            }),
          });
        }
      } catch (err) {
        console.error('Failed to sync subscription:', err);
      } finally {
        setIsProvisioning(false);
      }
    };

    syncSubscription();
  }, [sessionId, planId, cycle, userId]);

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>
      </div>

      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-3 border border-emerald-200 dark:border-emerald-800">
        Payment Processed Successfully
      </span>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Welcome to your new SubSphere tier!
      </h1>

      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-md">
        Your payment has been securely confirmed by Stripe. Your API quotas, team seats, and cloud resources have been unlocked immediately.
      </p>

      {sessionId && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Stripe Session: {sessionId}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 transition-colors"
        >
          <Layers className="h-4 w-4" />
          Go to User Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
        >
          <FileText className="h-4 w-4 text-slate-400" />
          View Invoices & Receipts
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
