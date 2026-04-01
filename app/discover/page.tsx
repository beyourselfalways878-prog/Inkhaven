'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Eye, EyeOff, Loader2, Zap, Users } from 'lucide-react';
import AuraSphere from '../../components/Profile/AuraSphere';
import { supabase } from '../../lib/supabase';
import { useSessionStore } from '../../stores/useSessionStore';
import ChatNowModal from '../../components/ChatNowModal';

interface DiscoverUser {
  userId: string;
  inkId: string;
  displayName: string;
  comfortLevel: 'gentle' | 'balanced' | 'bold';
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [resonating, setResonating] = useState<string | null>(null);
  const [showChatNow, setShowChatNow] = useState(false);
  const { session } = useSessionStore();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const getToken = useCallback(async () => {
    const { data: sd } = await supabase.auth.getSession();
    return sd?.session?.access_token ?? null;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/discover', { headers });
      const json = await res.json();
      if (json.ok) {
        setUsers(json.data);
        setTotal(json.total);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 8000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Toggle discoverability
  const toggleDiscoverable = async () => {
    if (!session.userId) { setShowChatNow(true); return; }

    const token = await getToken();
    if (!token) return;

    if (isDiscoverable) {
      // Leave pool
      setIsDiscoverable(false);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'leave' }),
      });
    } else {
      // Join pool
      setIsDiscoverable(true);
      const joinDiscover = async () => {
        const t = await getToken();
        if (!t) return;
        await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          body: JSON.stringify({ action: 'join' }),
        });
      };
      await joinDiscover();
      heartbeatRef.current = setInterval(joinDiscover, 90_000); // heartbeat every 90s
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (isDiscoverable && session.userId) {
        getToken().then((t) => {
          if (t) fetch('/api/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
            body: JSON.stringify({ action: 'leave' }),
            keepalive: true,
          });
        });
      }
    };
  }, [isDiscoverable, session.userId, getToken]);

  const handleResonate = async (targetUser: DiscoverUser) => {
    if (!session.userId) { setShowChatNow(true); return; }
    if (resonating) return;

    setResonating(targetUser.userId);

    try {
      const token = await getToken();
      if (!token) return;

      // Create a new chat room via the existing quick-match API
      const matchRes = await fetch('/api/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ interests: [] }),
      });

      let roomId = null;
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        roomId = matchData.data?.roomId;
      }

      if (!roomId) {
        // Fallback room id
        roomId = `room_discover_${Date.now()}`;
      }

      // Send resonate invite to target via Broadcast
      await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'resonate',
          targetUserId: targetUser.userId,
          inviterName: session.inkId ?? 'Anonymous',
          roomId,
        }),
      });

      // Send Offline Web Push Notification
      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          targetUserId: targetUser.userId,
          title: '✨ Resonate Request',
          payload: `${session.inkId ?? 'Someone'} wants to connect with you!`,
          url: `/chat/${roomId}`
        }),
      }).catch(e => console.error('Push delivery error:', e));

      // Navigate to the room
      router.push(`/chat/${roomId}`);
    } catch {
      setResonating(null);
    }
  };

  const comfortColors: Record<string, string> = {
    gentle:   'ring-emerald-400/40',
    balanced: 'ring-teal-400/40',
    bold:     'ring-rose-400/40',
  };

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Compass size={12} />
            Discover
          </div>
          <h1 className="text-4xl font-bold text-white text-white mb-2">
            Auras Online Now
          </h1>
          <p className="text-slate-500 text-white/50">
            {total} {total === 1 ? 'soul' : 'souls'} in the field. Resonate to connect.
          </p>
        </div>

        {/* Discoverable toggle */}
        <button
          onClick={toggleDiscoverable}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border transition-all duration-300 font-semibold text-sm ${
            isDiscoverable
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
              : 'bg-slate-900 text-white border border-white/10 text-slate-500 hover:border-teal-500/40 hover:text-teal-400'
          }`}
        >
          {isDiscoverable ? <Eye size={16} /> : <EyeOff size={16} />}
          {isDiscoverable ? 'Visible to others' : 'Go Visible'}
          {isDiscoverable && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute right-3" />
          )}
        </button>
      </div>

      {/* Info banner */}
      {!isDiscoverable && (
        <div className="mb-6 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center gap-3 text-sm text-cyan-400/80">
          <EyeOff size={16} className="shrink-0" />
          <span>You are invisible right now. Toggle <strong>Go Visible</strong> above to appear in the grid and receive Resonate requests.</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center mb-6">
            <Users className="w-9 h-9 text-cyan-400/60" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No auras visible</h3>
          <p className="text-slate-500 max-w-xs text-sm">
            Be the first to go visible. Others who toggle discoverability will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {users.map((user) => {
            const isResonating = resonating === user.userId;
            return (
              <div
                key={user.userId}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-900 text-white text-white/[0.02] border border-slate-200 border-white/5 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-pointer"
                onClick={() => handleResonate(user)}
              >
                {/* Aura */}
                <div className={`relative ring-4 ${comfortColors[user.comfortLevel] ?? 'ring-teal-400/40'} rounded-full group-hover:ring-cyan-400/60 transition-all duration-300`}>
                  <AuraSphere inkId={user.inkId} size="md" comfortLevel={user.comfortLevel} isPulsing />
                </div>

                {/* Name */}
                <div className="text-center">
                  <p className="text-xs font-mono text-slate-500 text-white/40 truncate max-w-[90px]">{user.inkId}</p>
                </div>

                {/* Resonate button */}
                <button
                  disabled={!!resonating}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group-hover:bg-cyan-500/20"
                >
                  {isResonating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <><Zap size={13} /> Resonate</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ChatNowModal isOpen={showChatNow} onClose={() => setShowChatNow(false)} />
    </div>
  );
}
