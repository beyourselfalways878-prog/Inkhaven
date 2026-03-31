'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '../../stores/useSessionStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import AuraSphere from '../../components/Profile/AuraSphere';
import { useToast } from '../../components/ui/toast';
import { Loader2, Users, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import MinigameHub from '../../components/NeonLounge/MinigameHub';

export default function QuickMatchPage() {
  const router = useRouter();
  const { session } = useSessionStore();
  const [status, setStatus] = useState<'idle' | 'searching' | 'matched' | 'error'>('searching');
  const [errorMsg, setErrorMsg] = useState('');
  const toast = useToast();
  const navigatedRef = useRef(false); // prevent double-navigation

  // ── Initial match attempt ──────────────────────────────────────────────────
  const handleQuickMatch = async () => {
    try {
      setStatus('searching');
      setErrorMsg('');

      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData?.session?.access_token ?? null;

      if (!token) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw anonError;
        token = anonData.session?.access_token ?? null;
        const userId = anonData.user?.id ?? session.userId;
        useSessionStore.getState().setSession({ ...session, userId });
      }

      if (!token) throw new Error('Unable to authenticate. Please try refreshing the page.');

      const res = await fetch('/api/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ interests: [] }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Failed to join queue: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.data?.matchFound && data.data?.roomId && !navigatedRef.current) {
        navigatedRef.current = true;
        setStatus('matched');
        toast.success('Match found! Connecting you now...');
        setTimeout(() => router.push(`/chat/${data.data.roomId}`), 800);
      }
    } catch (err: any) {
      console.error('Quick Match Error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      toast.error(err.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    handleQuickMatch().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Supabase Realtime subscription on the connection_queue row ──────────────
  // This fires immediately when the server updates our matched_with / current_room_id
  // rather than waiting for the next 3-second poll interval.
  useEffect(() => {
    if (status !== 'searching' || !session.userId) return;

    const channel = supabase
      .channel(`queue_watch_${session.userId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'connection_queue',
          filter: `user_id=eq.${session.userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row?.current_room_id && row?.matched_with && !navigatedRef.current) {
            navigatedRef.current = true;
            setStatus('matched');
            toast.success('Match found! Connecting you now...');
            setTimeout(() => router.push(`/chat/${row.current_room_id}`), 800);
          }
        }
      )
      .subscribe();

    // Fallback: retry attempt every 4s in case the Realtime event is missed
    const fallback = setInterval(async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const t = sd?.session?.access_token;
        if (!t || navigatedRef.current) return;

        const res = await fetch('/api/quick-match', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          body:    JSON.stringify({ interests: [] }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data?.matchFound && data.data?.roomId && !navigatedRef.current) {
            navigatedRef.current = true;
            setStatus('matched');
            toast.success('Match found! Connecting you now...');
            setTimeout(() => router.push(`/chat/${data.data.roomId}`), 800);
          }
        }
      } catch { /* ignore */ }
    }, 4000);

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [status, session.userId, router, toast]);

  if (!session.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background aura glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {status === 'searching' ? 'The Neon Lounge' : 'Quick Match'}
          </h1>
          <p className="text-slate-500 dark:text-white/50">
            {status === 'searching' ? 'Sharpen your mind while we find your match.' : 'Instantly connect with someone available now.'}
          </p>
        </div>

        {status === 'searching' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 w-full">
            {/* Top compact scanning indicator */}
            <div className="flex items-center gap-4 bg-slate-900/50 border border-indigo-500/20 px-6 py-3 rounded-full backdrop-blur-md mb-8">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/50 animate-[spin_4s_linear_infinite]" />
                <div className="absolute inset-[-4px] rounded-full border border-purple-500/20 animate-[spin_8s_linear_infinite_reverse]" />
                <Activity className="absolute inset-0 m-auto w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="text-left flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">Scanning Frequencies</span>
                <span className="text-[10px] text-indigo-400 font-mono">Live match detection active...</span>
              </div>
            </div>

            {/* Minigame Hub */}
            <MinigameHub />
          </div>
        )}

        {status === 'matched' && (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-10 fade-in duration-1000">
            <div className="text-center mb-10">
              <p className="text-sm font-mono text-emerald-400 mb-2 tracking-widest uppercase">Signal Locked</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Vibe Check</h2>
              <p className="text-slate-500 dark:text-white/50 text-sm mt-2">A connection is forming. Prepare your energy.</p>
            </div>

            <div className="flex items-center justify-center gap-8 w-full">
              <div className="flex flex-col items-center">
                <AuraSphere inkId={session.inkId || 'fallback'} size="md" />
                <span className="text-xs text-slate-400 dark:text-white/40 mt-4 font-mono">YOU</span>
              </div>
              <div className="relative flex-1 max-w-[100px] h-[2px] bg-slate-200 dark:bg-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/20 rounded-full p-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-white" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <AuraSphere inkId="mysterious_stranger" size="md" comfortLevel="bold" isPulsing={true} />
                <span className="text-xs text-slate-400 dark:text-white/40 mt-4 font-mono tracking-widest">UNKNOWN</span>
              </div>
            </div>

            <div className="mt-12 bg-slate-50 dark:bg-white/5 px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 flex items-center gap-3 backdrop-blur-md">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-sm text-slate-900 dark:text-white font-medium">Establishing Secure WebRTC Tunnel...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center animate-in zoom-in-95 duration-300">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl mb-6 backdrop-blur-md">
              <p className="text-red-400 font-medium mb-2">Connection Severed</p>
              <p className="text-sm text-slate-500 dark:text-white/50">{errorMsg}</p>
            </div>
            <Button onClick={() => { navigatedRef.current = false; handleQuickMatch(); }} variant="secondary" className="px-8">
              Recalibrate & Retry
            </Button>
          </div>
        )}
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-8 border-t border-slate-200 dark:border-white/5">
        <div className="flex flex-col items-center glass-panel p-4">
          <ShieldCheck className="w-6 h-6 text-indigo-400 mb-2" />
          <span className="text-xs text-slate-500 dark:text-white/60 font-medium tracking-wide">ZERO DATA RETAINED</span>
        </div>
        <div className="flex flex-col items-center glass-panel p-4">
          <Users className="w-6 h-6 text-purple-400 mb-2" />
          <span className="text-xs text-slate-500 dark:text-white/60 font-medium tracking-wide">ANONYMOUS P2P</span>
        </div>
      </div>
    </div>
  );
}
