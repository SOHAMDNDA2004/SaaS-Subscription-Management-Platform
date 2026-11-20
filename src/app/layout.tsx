import type { Metadata } from 'next';
import './globals.css';
import LayoutClient from './layout-client';

export const metadata: Metadata = {
  title: 'SubSphere | SaaS Subscription Management Platform',
  description:
    'Production-ready SaaS Subscription & Billing Platform built with Next.js App Router, Tailwind CSS, PostgreSQL Prisma, and Stripe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
