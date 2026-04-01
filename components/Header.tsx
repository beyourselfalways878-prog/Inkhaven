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
      <header className="w-full border-b border-gray-300 bg-slate-950 text-white">
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
            className="text-xs text-gray-300 hover:text-cyan-400 transition-colors"
          >
            [restore]
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full border-b border-white/5 backdrop-blur-2xl bg-slate-950/40 text-white/90 md:pl-[72px] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="group">
          <Logo className="h-10 w-10 text-teal-500 group-hover:scale-105 transition-transform duration-300" showText />
        </Link>

        <nav className="hidden md:flex gap-6 items-center text-sm font-medium text-slate-400">
          <Link href="/quick-match" className="hover:text-teal-400 transition-colors">Match</Link>
          <Link href="/rooms"       className="hover:text-teal-400 transition-colors">Rooms</Link>
          <Link href="/feed"        className="hover:text-teal-400 transition-colors">Feed</Link>
          <Link href="/discover"    className="hover:text-teal-400 transition-colors">Discover</Link>
          <Link href="/friends"     className="hover:text-teal-400 transition-colors">Friends</Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Ghost Mode — subtle panic button */}
          <button
            onClick={activateGhost}
            title="Ghost Mode — instant disguise (click to activate)"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all shadow-lg"
          >
            <Ghost size={16} />
          </button>
          <BackgroundThemeSelector />
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link href="/chat" className="hidden sm:block rounded-full border border-teal-500/20 bg-teal-600/10 px-5 py-2 text-sm font-bold text-teal-400 hover:bg-teal-600/20 hover:text-white hover:border-teal-400/40 transition-all uppercase tracking-widest">
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
            <Link href="/onboarding" className="group relative inline-flex items-center justify-center px-6 py-2.5 font-bold text-white transition-all duration-200 bg-teal-600 rounded-full hover:bg-teal-500 shadow-lg shadow-teal-500/25">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
