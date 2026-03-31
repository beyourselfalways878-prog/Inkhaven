"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { useSessionStore } from '../stores/useSessionStore';
import { Avatar } from './ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import BackgroundThemeSelector from './Backgrounds/BackgroundThemeSelector';
import { Ghost } from 'lucide-react';

export default function Header() {
  const session = useSessionStore((s) => s.session);
  const isLoggedIn = !!session.userId;
  const [ghosted, setGhosted] = useState(false);

  // NOTE: Invite broadcast subscription is now handled by InviteToast component


  // Ghost mode: one-click disguise as a plain news site
  const activateGhost = () => {
    setGhosted(true);
    document.title = 'Times of India - Latest News';
  };

  const deactivateGhost = () => {
    setGhosted(false);
    document.title = 'InkHaven | Anonymous & Safe Chat';
  };

  // Ghost mode rendering — looks like a normal news header
  if (ghosted) {
    return (
      <header className="w-full border-b border-gray-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-serif text-2xl font-black text-red-700 select-none">Times of India</div>
          <nav className="hidden md:flex gap-6 text-sm text-gray-600">
            <span className="cursor-default">India</span>
            <span className="cursor-default">World</span>
            <span className="cursor-default">Sports</span>
            <span className="cursor-default">Business</span>
            <span className="cursor-default">Entertainment</span>
          </nav>
          <button
            onClick={deactivateGhost}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            [restore]
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full border-b border-slate-200 dark:border-white/5 backdrop-blur-xl bg-white/80 dark:bg-white/[0.02] md:pl-[72px]">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="group">
          <Logo className="h-10 w-10 text-indigo-500 group-hover:scale-105 transition-transform duration-300" showText />
        </Link>

        <nav className="hidden md:flex gap-5 items-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/quick-match" className="hover:text-slate-900 dark:hover:text-white/80 transition-colors">Match</Link>
          <Link href="/rooms"       className="hover:text-slate-900 dark:hover:text-white/80 transition-colors">Rooms</Link>
          <Link href="/feed"        className="hover:text-slate-900 dark:hover:text-white/80 transition-colors">Feed</Link>
          <Link href="/discover"    className="hover:text-slate-900 dark:hover:text-white/80 transition-colors">Discover</Link>
          <Link href="/friends"     className="hover:text-slate-900 dark:hover:text-white/80 transition-colors">Friends</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Ghost Mode — subtle panic button */}
          <button
            onClick={activateGhost}
            title="Ghost Mode — instant disguise (click to activate)"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 dark:text-white/15 hover:text-slate-500 dark:hover:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <Ghost size={16} />
          </button>
          <BackgroundThemeSelector />
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link href="/chat" className="hidden sm:block rounded-full border border-slate-200 dark:border-white/10 px-4 py-2 text-sm text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/20 transition-colors">
                Enter chat
              </Link>
              <Link href="/profile">
                <Avatar
                  userId={session.userId ?? undefined}
                  displayName={session.displayName || undefined}
                  auraSeed={session.auraSeed ?? undefined}
                  reputation={session.reputation ?? undefined}
                  size="sm"
                  showStatus
                  status="online"
                />
              </Link>
            </>
          ) : (
            <Link href="/onboarding" className="btn-primary text-sm">
              Create profile
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
