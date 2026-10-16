'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  LayoutDashboard,
  Users,
  Kanban,
  UserPlus,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === '/' || pathname === '/dashboard',
  },
  {
    name: 'Candidates',
    href: '/candidates',
    icon: Users,
    isActive: (pathname: string) =>
      pathname === '/candidates' ||
      (pathname.startsWith('/candidates/') && pathname !== '/candidates/new'),
  },
  {
    name: 'Pipeline',
    href: '/pipeline',
    icon: Kanban,
    isActive: (pathname: string) => pathname.startsWith('/pipeline'),
  },
  {
    name: 'Add Candidate',
    href: '/candidates/new',
    icon: UserPlus,
    isActive: (pathname: string) => pathname === '/candidates/new',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const renderNavLinks = () => (
    <ul className="space-y-1.5 px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110',
                  active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                )}
              />
              <span>{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-40 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-white font-bold tracking-tight text-base">Mini ATS</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
              Recruiter
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-white font-bold tracking-tight text-base">Mini ATS</span>
                <span className="ml-2 text-[10px] uppercase font-semibold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
                  Recruiter
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-4">{renderNavLinks()}</nav>
        </div>

        <div className="p-4 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Smart Recruiting</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Streamline hiring from screening to offer.
            </p>
          </div>
        </div>
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800 z-30 justify-between select-none">
        <div>
          {/* Logo */}
          <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800/90">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-tight text-lg">Mini ATS</span>
              </div>
              <p className="text-xs text-slate-400">Applicant Tracking</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-3 pt-5 pb-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Menu
            </p>
            <nav>{renderNavLinks()}</nav>
          </div>
        </div>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-800/50 p-3.5 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hiring Pipeline</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Track candidates across all interview stages.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
