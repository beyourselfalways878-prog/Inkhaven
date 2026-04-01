'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, X, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/useSessionStore';

interface ChatNowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RANDOM_NAMES = [
  'cosmic_dreamer', 'quiet_storm', 'neon_whisper', 'midnight_tide',
  'silver_echo', 'velvet_haze', 'aurora_ink', 'stellar_ghost',
  'prism_walker', 'ember_shade', 'lunar_drift', 'void_poet',
  'dusk_signal', 'glass_mind', 'static_bloom'
];

export default function ChatNowModal({ isOpen, onClose }: ChatNowModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholder] = useState(
    RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
  );
  const router = useRouter();
  const { session, setSession } = useSessionStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGo();
    if (e.key === 'Escape') onClose();
  };

  const handleGo = async () => {
    setLoading(true);
    try {
      const displayName = name.trim() || placeholder;

      // Get or create anonymous Supabase session
      let userId = session.userId;
      let inkId = session.inkId;

      if (!userId) {
        const { data: anonData, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        userId = anonData.user?.id ?? `guest_${Math.random().toString(36).slice(2, 9)}`;
      }

      if (!inkId) {
        inkId = `ink_${(userId ?? '').replace(/-/g, '').slice(0, 8)}`;
      }

      // Persist minimal session — no full onboarding required
      setSession({
        userId,
        inkId,
        displayName,
        interests: [],
        comfortLevel: 'balanced',
        auraSeed: Math.floor(Math.random() * 1000000),
        reputation: 50,
      });

      // Try to update profile in background (non-blocking)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId, displayName, interests: [], comfortLevel: 'balanced' }),
            keepalive: true,
          });
        }
      } catch {
        // silent — profile sync is best-effort
      }

      onClose();
      router.push('/quick-match');
    } catch (err) {
      console.error('ChatNow failed:', err);
      // Fallback: generate local guest
      const uid = `guest_${Math.random().toString(36).slice(2, 9)}`;
      setSession({
        userId: uid,
        inkId: `ink_${Math.random().toString(36).slice(2, 6)}`,
        displayName: name.trim() || placeholder,
        interests: [],
        comfortLevel: 'balanced',
        auraSeed: Math.floor(Math.random() * 1000000),
        reputation: 50,
      });
      onClose();
      router.push('/quick-match');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="relative bg-slate-950 animate-chameleon text-white dark:bg-obsidian-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">

          {/* Top gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-400" />

          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative p-8">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/40 backdrop-blur-2xl border border-white/10 dark:hover:bg-slate-950 animate-chameleon transition-all"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 dark:text-white tracking-tight">
                Enter the Haven
              </h2>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-2">
                Pick a name and dive in. No sign-up needed.
              </p>
            </div>

            {/* Name input */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2 block">
                Your Alias
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 24))}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  maxLength={24}
                  className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 font-medium text-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
                {name && (
                  <button
                    onClick={() => setName('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-white/30 mt-2">
                Leave blank for a random name. Max 24 characters.
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGo}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-70 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entering...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Chat Now</span>
                </>
              )}
            </button>

            {/* Trust signals */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-white/30">
              <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>Zero data stored</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-950 " />
              <div className="flex items-center gap-1">
                <span>🔐</span>
                <span>E2E encrypted</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-950 " />
              <div className="flex items-center gap-1">
                <span>👤</span>
                <span>Anonymous P2P</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
