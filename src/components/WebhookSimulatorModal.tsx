'use client';

import React, { useState } from 'react';
import {
  X,
  Radio,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Code2,
  Zap,
} from 'lucide-react';

interface WebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventExecuted?: () => void;
}

export default function WebhookSimulatorModal({
  isOpen,
  onClose,
  onEventExecuted,
}: WebhookSimulatorModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('checkout.session.completed');
  const [targetPlan, setTargetPlan] = useState<string>('enterprise');
  const [isLoading, setIsLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);

  if (!isOpen) return null;

  const eventOptions = [
    {
      id: 'checkout.session.completed',
      title: 'checkout.session.completed',
      desc: 'Simulates a user completing Stripe checkout for a new subscription.',
      category: 'New Subscription',
      color: 'text-emerald-600',
    },
    {
      id: 'customer.subscription.updated',
      title: 'customer.subscription.updated',
      desc: 'Simulates an upgrade/downgrade event received from Stripe billing engine.',
      category: 'Tier Change',
      color: 'text-indigo-600',
    },
    {
      id: 'invoice.payment_succeeded',
      title: 'invoice.payment_succeeded',
      desc: 'Simulates an automated monthly renewal invoice payment succeeding.',
      category: 'Billing Cycle',
      color: 'text-emerald-600',
    },
    {
      id: 'invoice.payment_failed',
      title: 'invoice.payment_failed',
      desc: 'Simulates card decline on renewal. Switches subscription into PAST_DUE.',
      category: 'Dunning & Recovery',
      color: 'text-rose-600',
    },
    {
      id: 'customer.subscription.deleted',
      title: 'customer.subscription.deleted',
      desc: 'Simulates immediate churn / cancellation webhook from Stripe.',
      category: 'Cancellation',
      color: 'text-slate-600',
    },
  ];

  const handleFireWebhook = async () => {
    setIsLoading(true);
    setResponseLog(null);
    try {
      const res = await fetch('/api/simulation/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: selectedEvent,
          planSlug: targetPlan,
        }),
      });
      const data = await res.json();
      setResponseLog(data);
      if (onEventExecuted) {
        onEventExecuted();
      }
    } catch (err: any) {
      setResponseLog({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Stripe Webhook Event Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Trigger and verify real-time subscription state changes without Stripe CLI or external tunnels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Select Stripe Webhook Event to Simulate
            </label>
            <div className="space-y-2">
              {eventOptions.map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setSelectedEvent(opt.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedEvent === opt.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="webhook_event"
                    checked={selectedEvent === opt.id}
                    onChange={() => setSelectedEvent(opt.id)}
                    className="mt-1 h-4 w-4 text-indigo-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-bold ${opt.color}`}>
                        {opt.title}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {opt.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(selectedEvent === 'checkout.session.completed' ||
            selectedEvent === 'customer.subscription.updated') && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Target Plan Tier in Payload
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['starter', 'pro', 'enterprise'].map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setTargetPlan(slug)}
                    className={`rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      targetPlan === slug
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {slug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response log preview */}
          {responseLog && (
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3.5 text-slate-100 font-mono text-xs overflow-x-auto max-h-48 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-sans font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Event Processed & Saved to Database
                </span>
                <span>status 200 OK</span>
              </div>
              <pre>{JSON.stringify(responseLog, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <span className="text-[11px] text-slate-500">
            Updates database models & audit logs instantly
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={handleFireWebhook}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              Execute Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
