'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import WebhookSimulatorModal from '@/components/WebhookSimulatorModal';

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <>
      <Navbar onOpenWebhookSimulator={() => setIsSimulatorOpen(true)} />
      <main className="flex-1">{children}</main>
      <WebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onEventExecuted={() => {
          // Trigger reload of active pages to show new data
          window.dispatchEvent(new Event('subscription-updated'));
        }}
      />
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            © 2026 SubSphere Platform. Enterprise SaaS Subscription & Billing System.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Stripe Integration Active
            </span>
            <span>PostgreSQL Schema Ready</span>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Simulate Webhook
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
