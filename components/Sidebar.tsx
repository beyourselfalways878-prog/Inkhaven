'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, Users, MessageSquare, Rss, Compass, User, LogIn } from 'lucide-react';
import { useSessionStore } from '../stores/useSessionStore';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { href: '/',           icon: Home,          label: 'Home',     exact: true },
  { href: '/quick-match', icon: Zap,           label: 'Match',    exact: false },
  { href: '/rooms',       icon: Users,         label: 'Rooms',    exact: false },
  { href: '/feed',        icon: Rss,           label: 'Feed',     exact: false },
  { href: '/discover',    icon: Compass,       label: 'Discover', exact: false },
  { href: '/friends',     icon: MessageSquare, label: 'Friends',  exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const session = useSessionStore((s) => s.session);
  const isLoggedIn = !!session.userId;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop Left Sidebar ───────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[72px] z-40 border-r border-slate-200 dark:border-white/5 bg-white/90 dark:bg-obsidian-950/90 backdrop-blur-xl">
        {/* Logo slot */}
        <div className="flex items-center justify-center h-[65px] border-b border-slate-200 dark:border-white/5 shrink-0">
          <Link href="/" className="group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-sm">IH</span>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                  active
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                )}
                title={label}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r-full" />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg pointer-events-none z-50">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile or Login */}
        <div className="flex flex-col items-center gap-3 p-3 border-t border-slate-200 dark:border-white/5">
          {isLoggedIn ? (
            <Link
              href="/profile"
              className={cn(
                'relative group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                pathname.startsWith('/profile')
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              )}
              title="Profile"
            >
              {session.inkId ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-500/20">
                  <span className="text-white text-[10px] font-bold">
                    {(session.displayName || session.inkId || 'U').slice(0, 1).toUpperCase()}
                  </span>
                </div>
              ) : (
                <User size={20} />
              )}
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg pointer-events-none z-50">
                My Profile
              </span>
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-slate-400 dark:text-white/40 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all duration-200"
              title="Sign In"
            >
              <LogIn size={20} />
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg pointer-events-none z-50">
                Get Started
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-white/5 bg-white/95 dark:bg-obsidian-950/95 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {NAV_ITEMS.slice(0, 5).map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl min-w-[52px] transition-all duration-200',
                  active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-white/40'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn('text-[9px] font-semibold tracking-wide uppercase', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-white/30')}>
                  {label}
                </span>
                {active && <div className="absolute bottom-0 w-4 h-0.5 bg-indigo-500 rounded-full" />}
              </Link>
            );
          })}
          {/* Profile tab */}
          <Link
            href={isLoggedIn ? '/profile' : '/onboarding'}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl min-w-[52px] transition-all duration-200',
              pathname.startsWith('/profile') || pathname.startsWith('/onboarding')
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 dark:text-white/40'
            )}
          >
            <User size={22} strokeWidth={1.8} />
            <span className="text-[9px] font-semibold tracking-wide uppercase text-slate-400 dark:text-white/30">Me</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
