'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  Shield,
  Layers,
  FileText,
  Zap,
  Activity,
  User,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { User as UserType } from '@/lib/types';

interface NavbarProps {
  onOpenWebhookSimulator?: () => void;
}

export default function Navbar({ onOpenWebhookSimulator }: NavbarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch current user and available personas
  const fetchPersonas = async () => {
    try {
      const res = await fetch('/api/auth/switch-user');
      const data = await res.json();
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
        setAvailableUsers(data.availableUsers || []);
      }
    } catch (e) {
      console.error('Failed to load user persona:', e);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [pathname]);

  const switchUser = async (userId: string) => {
    try {
      await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setIsPersonaOpen(false);
      window.location.reload();
    } catch (e) {
      console.error('Failed to switch user:', e);
    }
  };

  const navLinks = [
    { href: '/', label: 'Overview', icon: Zap },
    { href: '/dashboard', label: 'My Subscription', icon: Layers },
    { href: '/dashboard/pricing', label: 'Upgrade & Plans', icon: CreditCard },
    { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
    { href: '/admin', label: 'Admin Panel', icon: Shield, adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Sub<span className="text-indigo-600">Sphere</span>
              </span>
              <span className="ml-1.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                SaaS Billing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {link.adminOnly && (
                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      ADMIN
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Webhook Simulator Action Button */}
          {onOpenWebhookSimulator && (
            <button
              onClick={onOpenWebhookSimulator}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
              title="Test real-time Stripe webhooks without Stripe CLI"
            >
              <Radio className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              Webhook Simulator
            </button>
          )}

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPersonaOpen(!isPersonaOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-2.5 text-left text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {currentUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="font-semibold leading-none">{currentUser?.name?.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-500 capitalize">{currentUser?.role?.toLowerCase()}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Persona Dropdown Menu */}
            {isPersonaOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 dark:border-slate-700 dark:bg-slate-800 animate-in fade-in-50 slide-in-from-top-2">
                <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Persona
                </div>
                <div className="space-y-1">
                  {availableUsers.map((user) => {
                    const isSelected = user.id === currentUser?.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => switchUser(user.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <div className="flex-1 truncate">
                          <div className="truncate font-medium">{user.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{user.company}</div>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            user.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2 dark:border-slate-800 dark:bg-slate-900">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {onOpenWebhookSimulator && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenWebhookSimulator();
              }}
              className="flex w-full items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            >
              <Radio className="h-4 w-4" />
              Open Webhook Simulator
            </button>
          )}
        </div>
      )}
    </header>
  );
}
