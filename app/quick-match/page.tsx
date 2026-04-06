'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '../../stores/useSessionStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import AuraSphere from '../../components/Profile/AuraSphere';
import { useToast } from '../../components/ui/toast';
import { Loader2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import MinigameHub from '../../components/NeonLounge/MinigameHub';
import { getModerationMode } from '../../components/ModerationGate';

export default function QuickMatchPage() {
  const router = useRouter();
  const { session } = useSessionStore();
  const [status, setStatus] = useState<'idle' | 'searching' | 'matched' | 'error'>('searching');
  const [errorMsg, setErrorMsg] = useState('');
  const [secondsWaiting, setSecondsWaiting] = useState(0);
  const toast = useToast();
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (status !== 'searching') {
        if (secondsWaiting !== 0) setSecondsWaiting(0);
        return;
    }
    const interval = setInterval(() => {
      setSecondsWaiting(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status, secondsWaiting]);

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

      const mode = getModerationMode();
      const res = await fetch('/api/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ interests: [], mode }),
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
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong.');
      toast.error(err.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    handleQuickMatch().catch(console.error);
  }, []);

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

    const fallback = setInterval(async () => {
      try {
        const { data: sd } = await supabase.auth.getSession();
        const t = sd?.session?.access_token;
        if (!t || navigatedRef.current) return;

        const mode = getModerationMode();
        const res = await fetch('/api/quick-match', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          body:    JSON.stringify({ interests: [], mode }),
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950 text-white">
      {/* Background aura glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tight">
            {status === 'searching' ? 'The Neon Lounge' : 'Quick Match'}
          </h1>
          <p className="text-slate-400 font-medium">
            {status === 'searching' ? 'Sharpen your mind while we scan the frequencies.' : 'Instantly connect with a resonant partner.'}
          </p>
        </div>

        {status === 'searching' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 w-full">
            <div className="flex items-center gap-4 bg-slate-900/60 border border-teal-500/20 px-6 py-3 rounded-full backdrop-blur-md mb-8">
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-dashed border-teal-500/50 animate-[spin_4s_linear_infinite]" />
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-white uppercase tracking-widest">Searching The Haven</p>
                    <p className="text-[10px] text-teal-500/60 font-mono">P2P TUNNELING ACTIVE...</p>
                </div>
            </div>
            <MinigameHub />
            {secondsWaiting > 15 && (
              <div className="mt-8 animate-in slide-in-from-bottom-5 fade-in duration-500 w-full max-w-sm">
                <div className="bg-slate-900 border border-teal-500/30 p-5 rounded-2xl backdrop-blur-md">
                  <p className="text-teal-400 font-bold uppercase tracking-widest text-xs mb-2">The Network is Quiet</p>
                  <p className="text-sm text-slate-300 mb-4">Nobody&apos;s around right now. Want to drop a thought on the wall while you wait?</p>
                  <Button onClick={() => router.push('/feed')} className="w-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20">
                    Go to Feed
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'matched' && (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-10 fade-in duration-1000">
            <div className="text-center mb-10">
              <p className="text-sm font-mono text-teal-400 mb-2 tracking-widest uppercase">Signal Locked</p>
              <h2 className="text-3xl font-bold text-white">Vibe Check</h2>
              <p className="text-slate-400 text-sm mt-2">A connection is forming. Prepare your energy.</p>
            </div>

            <div className="flex items-center justify-center gap-12 w-full">
              <div className="flex flex-col items-center">
                <AuraSphere inkId={session.inkId || 'fallback'} size="lg" />
                <span className="text-xs text-teal-400 mt-4 font-bold tracking-widest uppercase">You</span>
              </div>
              
              <div className="relative flex flex-col items-center gap-4">
                 <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
                 <Sparkles className="text-teal-400 animate-pulse" />
                 <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
              </div>

              <div className="flex flex-col items-center">
                <AuraSphere inkId="mysterious_stranger" size="lg" comfortLevel="bold" isPulsing={true} />
                <span className="text-xs text-cyan-400 mt-4 font-bold tracking-widest uppercase">Partner</span>
              </div>
            </div>

            <div className="mt-12 bg-teal-500/5 backdrop-blur-2xl border border-teal-500/20 px-8 py-3 rounded-full flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              <span className="text-sm text-teal-100 font-medium tracking-wide uppercase">Establishing WebRTC Tunnel...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center animate-in zoom-in-95 duration-300 max-w-sm mx-auto">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl mb-6 backdrop-blur-md">
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-2">Connection Severed</p>
              <p className="text-sm text-slate-400">{errorMsg}</p>
            </div>
            <Button onClick={() => { navigatedRef.current = false; handleQuickMatch(); }} variant="secondary" className="w-full py-6 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold tracking-widest uppercase">
              Recalibrate Signal
            </Button>
          </div>
        )}
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto mt-20 pt-8 border-t border-white/5">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
          <ShieldCheck className="w-6 h-6 text-teal-400" />
          <div className="text-left">
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">Privacy First</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Zero Data Retained</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
          <Users className="w-6 h-6 text-cyan-400" />
          <div className="text-left">
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">P2P Mesh</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Encrypted Tunnel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
