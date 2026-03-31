'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, X, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/useSessionStore';

interface Invite {
  id: string;
  roomId: string;
  inviterName: string;
  receivedAt: number;
}

/**
 * InviteToast — renders a stack of non-blocking invite notifications.
 * Replaces the terrible window.confirm() approach.
 * Mount this once in layout alongside Sidebar/Header.
 */
export default function InviteToast() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const { session } = useSessionStore();
  const router = useRouter();

  const dismiss = useCallback((id: string) => {
    setInvites(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const accept = useCallback((invite: Invite) => {
    dismiss(invite.id);
    router.push(`/chat/${invite.roomId}`);
  }, [dismiss, router]);

  // Auto-dismiss after 20 seconds
  useEffect(() => {
    if (invites.length === 0) return;
    const oldest = invites[0];
    const remaining = 20_000 - (Date.now() - oldest.receivedAt);
    if (remaining <= 0) { dismiss(oldest.id); return; }
    const t = setTimeout(() => dismiss(oldest.id), remaining);
    return () => clearTimeout(t);
  }, [invites, dismiss]);

  // Subscribe to personal broadcast channel
  useEffect(() => {
    if (!session.userId) return;

    const channel = supabase
      .channel(`user_${session.userId}`)
      .on('broadcast', { event: 'invite' }, ({ payload }) => {
        const invite: Invite = {
          id:          `inv_${Date.now()}`,
          roomId:      payload.roomId,
          inviterName: payload.inviterName ?? 'Anonymous',
          receivedAt:  Date.now(),
        };
        setInvites(prev => [...prev.slice(-2), invite]); // max 3 stacked
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [session.userId]);

  if (invites.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {invites.map((invite, i) => (
        <div
          key={invite.id}
          className="pointer-events-auto flex items-start gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/40 animate-in slide-in-from-right-8 fade-in duration-300"
          style={{ transform: `translateY(${i * -4}px)`, zIndex: 9999 - i }}
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Zap size={18} className="text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">Resonate Request ✨</p>
            <p className="text-xs text-slate-500 dark:text-white/50 truncate">
              <span className="font-mono text-fuchsia-500">{invite.inviterName}</span> wants to connect
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => accept(invite)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Accept <ArrowRight size={12} />
              </button>
              <button
                onClick={() => dismiss(invite.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>

          {/* Dismiss X */}
          <button
            onClick={() => dismiss(invite.id)}
            className="flex-shrink-0 text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/50 transition-colors mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
