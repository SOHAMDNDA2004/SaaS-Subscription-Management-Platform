'use client';

import React, { useState } from 'react';
import { Subscription } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { X, AlertTriangle, ShieldCheck, HeartHandshake, RefreshCw } from 'lucide-react';

interface CancelConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onSuccess: () => void;
}

export default function CancelConfirmModal({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}: CancelConfirmModalProps) {
  const [reason, setReason] = useState<string>('too_expensive');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !subscription) return null;

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          immediate: false, // Standard SaaS cancel at period end
          reason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel subscription');
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
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cancel Subscription?
            </h3>
            <p className="text-xs text-slate-500">
              Your plan will remain active until {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 mb-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="font-semibold mb-1">What to expect:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>You can continue using all {subscription.plan?.name || 'Pro'} features until your billing cycle ends.</li>
            <li>No further charges will occur on your card.</li>
            <li>You can resume your plan at any time with one click.</li>
          </ul>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Help us improve (optional):
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="too_expensive">Too expensive / switching to free alternative</option>
            <option value="missing_feature">Missing specific features I need</option>
            <option value="not_using_enough">Not using the platform frequently enough</option>
            <option value="temporary_pause">Temporary pause / project completed</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Keep My Plan
          </button>
          <button
            onClick={handleConfirmCancel}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}
