import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format cents into formatted USD currency string (e.g. 2900 -> "$29.00")
 */
export function formatCurrency(cents: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Format ISO date string into readable format (e.g. "Nov 15, 2026")
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Calculate prorated difference when switching from current plan to new plan
 */
export function calculateProration({
  currentPriceCents,
  newPriceCents,
  daysRemainingInPeriod,
  totalDaysInPeriod = 30,
}: {
  currentPriceCents: number;
  newPriceCents: number;
  daysRemainingInPeriod: number;
  totalDaysInPeriod?: number;
}): {
  unusedCredit: number;
  newPlanCharge: number;
  netDueNow: number;
} {
  const fractionRemaining = Math.max(0, Math.min(1, daysRemainingInPeriod / totalDaysInPeriod));
  const unusedCredit = Math.round(currentPriceCents * fractionRemaining);
  const newPlanCharge = Math.round(newPriceCents * fractionRemaining);
  const netDueNow = Math.max(0, newPlanCharge - unusedCredit);

  return {
    unusedCredit,
    newPlanCharge,
    netDueNow,
  };
}

/**
 * Status color helper for subscription badges
 */
export function getSubscriptionStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return {
        label: "Active",
        bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    case "TRIALING":
      return {
        label: "Trialing",
        bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
      };
    case "PAST_DUE":
      return {
        label: "Past Due",
        bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    case "CANCELED":
      return {
        label: "Canceled",
        bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        dot: "bg-rose-500",
      };
    default:
      return {
        label: status,
        bg: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Invoice status color helper
 */
export function getInvoiceStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
      return {
        label: "Paid",
        bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      };
    case "OPEN":
      return {
        label: "Payment Due",
        bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      };
    case "VOID":
      return {
        label: "Void",
        bg: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      };
    default:
      return {
        label: status,
        bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      };
  }
}
