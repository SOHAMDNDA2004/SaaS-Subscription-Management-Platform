'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate, getInvoiceStatusBadge } from '@/lib/utils';
import { Invoice } from '@/lib/types';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'OPEN'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleRetryPayment = async (invoiceId: string) => {
    setRetryingId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: 'POST' });
      if (res.ok) {
        await loadInvoices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRetryingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'PAID') return inv.status === 'PAID';
    if (filter === 'OPEN') return inv.status === 'OPEN';
    return true;
  });

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Invoices & Payment History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Access itemized VAT invoices, receipts, and manage outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Lifetime Billed
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(totalPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          All ({invoices.length})
        </button>
        <button
          onClick={() => setFilter('PAID')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'PAID'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Paid ({invoices.filter((i) => i.status === 'PAID').length})
        </button>
        <button
          onClick={() => setFilter('OPEN')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'OPEN'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Outstanding ({invoices.filter((i) => i.status === 'OPEN').length})
        </button>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-600" />
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No invoices found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="py-3 px-4 font-bold">Invoice</th>
                  <th className="py-3 px-4 font-bold">Issue Date</th>
                  <th className="py-3 px-4 font-bold">Billing Reason</th>
                  <th className="py-3 px-4 font-bold">Amount Due</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map((inv) => {
                  const badge = getInvoiceStatusBadge(inv.status);
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.number}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-4 px-4 capitalize text-slate-600 dark:text-slate-400">
                        {inv.billingReason?.replace(/_/g, ' ') || 'Subscription Cycle'}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.amountDue, inv.currency)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {inv.status === 'OPEN' && (
                          <button
                            onClick={() => handleRetryPayment(inv.id)}
                            disabled={retryingId === inv.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {retryingId === inv.id && (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            )}
                            Pay Invoice
                          </button>
                        )}
                        <a
                          href={`/api/invoices/${inv.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          PDF Invoice
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
