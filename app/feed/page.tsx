'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Loader2, Flame, ThumbsDown, Clock, Feather } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSessionStore } from '../../stores/useSessionStore';
import ChatNowModal from '../../components/ChatNowModal';

interface FeedPost {
  id: string;
  authorInkId: string;
  content: string;
  resonateCount: number;
  dismissCount: number;
  userReactions: Record<string, 'resonate' | 'dismiss'>;
  createdAt: number;
  expiresAt: number;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return 'yesterday';
}

function timeLeft(ts: number): string {
  const diff = Math.max(0, Math.floor((ts - Date.now()) / 1000));
  if (diff < 3600) return `${Math.floor(diff / 60)}m left`;
  return `${Math.floor(diff / 3600)}h left`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showChatNow, setShowChatNow] = useState(false);
  const [sort, setSort] = useState<'recent' | 'trending'>('recent');
  const { session } = useSessionStore();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = async (currentSort: 'recent' | 'trending') => {
    try {
      const res = await fetch(`/api/feed?sort=${currentSort}`);
      const json = await res.json();
      if (json.ok) setPosts(json.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPosts(sort);
    const interval = setInterval(() => fetchPosts(sort), 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [sort]);

  useEffect(() => {
    if (composing && textRef.current) {
      setTimeout(() => textRef.current?.focus(), 100);
    }
  }, [composing]);

  const getToken = async () => {
    const { data: sd } = await supabase.auth.getSession();
    return sd?.session?.access_token ?? null;
  };

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    if (!session.userId) { setShowChatNow(true); return; }

    setPosting(true);
    try {
      const token = await getToken();
      if (!token) { setShowChatNow(true); return; }

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: text.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        setPosts((prev) => [json.data, ...prev]);
        setText('');
        setComposing(false);
      }
    } catch { /* silent */ } finally {
      setPosting(false);
    }
  };

  const handleReact = async (postId: string, action: 'resonate' | 'dismiss') => {
    if (!session.userId) { setShowChatNow(true); return; }

    const token = await getToken();
    if (!token) return;

    // Optimistic update
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const prev_react = p.userReactions?.[session.userId!];
      const updated = { ...p, userReactions: { ...(p.userReactions ?? {}) } };

      if (prev_react === action) {
        // Toggle off
        if (action === 'resonate') updated.resonateCount--;
        else updated.dismissCount--;
        delete updated.userReactions[session.userId!];
      } else {
        if (prev_react === 'resonate') updated.resonateCount--;
        if (prev_react === 'dismiss') updated.dismissCount--;
        if (action === 'resonate') updated.resonateCount++;
        else updated.dismissCount++;
        updated.userReactions[session.userId!] = action;
      }
      return updated;
    }));

    // Background sync
    fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action, postId }),
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">
            <Feather size={12} />
            Ink Feed
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            The Ink Wall
          </h1>
          <p className="text-slate-500 dark:text-white/50">
            Anonymous thoughts, confessions, and vibes. Disappears in 24h.
          </p>
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 w-fit shrink-0">
          <button
            onClick={() => setSort('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              sort === 'recent'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/70'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort('trending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
              sort === 'trending'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/70'
            }`}
          >
            <Flame size={14} className={sort === 'trending' ? 'text-white' : 'text-amber-500'} />
            Trending
          </button>
        </div>
      </div>

      {/* Compose */}
      {composing ? (
        <div className="mb-6 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
              {(session.displayName || session.inkId || 'A').slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-400 dark:text-white/40 font-mono">
              {session.inkId ?? 'ink_anonymous'}
            </span>
          </div>
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder="What's on your mind? (anonymous, disappears in 24h)"
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 text-base resize-none focus:outline-none leading-relaxed min-h-[80px]"
            rows={3}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <span className={`text-xs font-mono ${text.length > 250 ? 'text-red-400' : 'text-slate-400 dark:text-white/30'}`}>
              {280 - text.length} chars left
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => { setComposing(false); setText(''); }}
                className="px-4 py-1.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ink It ✍️'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => session.userId ? setComposing(true) : setShowChatNow(true)}
          className="w-full mb-6 flex items-center gap-3 bg-white dark:bg-white/[0.03] border border-dashed border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all text-sm group"
        >
          <Plus size={18} className="group-hover:text-amber-500 transition-colors" />
          <span>Drop an anonymous thought, confession, or vibe...</span>
        </button>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🖊️</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">The wall is blank</h3>
          <p className="text-slate-500 dark:text-white/40 text-sm">Be the first to leave a mark.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const myReaction = post.userReactions?.[session.userId ?? ''] ?? null;
            const netScore = (post.resonateCount ?? 0) - (post.dismissCount ?? 0);
            const scorePositive = netScore >= 0;
            const isHot = netScore >= 3;

            return (
              <div
                key={post.id}
                className={`group bg-white dark:bg-white/[0.03] border transition-all rounded-2xl p-5 hover:shadow-md ${
                  isHot 
                    ? 'border-amber-400/50 shadow-[0_0_20px_-5px_rgba(251,191,36,0.2)] dark:shadow-[0_0_20px_-5px_rgba(251,191,36,0.1)]' 
                    : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 dark:hover:shadow-black/20'
                }`}
              >
                {/* Author + time */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isHot ? 'bg-gradient-to-br from-red-500 to-amber-500 animate-pulse ring-2 ring-amber-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      {post.authorInkId.slice(4, 5).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-slate-600 dark:text-white/50 font-semibold">{post.authorInkId}</span>
                      {isHot && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Trending</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 dark:text-white/25">{timeAgo(post.createdAt)}</span>
                    <div className="flex items-center gap-1 text-xs text-slate-300 dark:text-white/20 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      <Clock size={10} />
                      {timeLeft(post.expiresAt)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-slate-800 dark:text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                  {post.content}
                </p>

                {/* Reactions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReact(post.id, 'resonate')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                      myReaction === 'resonate'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                        : 'text-slate-400 dark:text-white/30 hover:text-emerald-500 hover:bg-emerald-500/10'
                    }`}
                  >
                    <Flame size={15} className={myReaction === 'resonate' ? 'fill-emerald-400' : ''} />
                    {post.resonateCount ?? 0}
                  </button>

                  <button
                    onClick={() => handleReact(post.id, 'dismiss')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                      myReaction === 'dismiss'
                        ? 'bg-slate-500/15 text-slate-500 border border-slate-500/20'
                        : 'text-slate-400 dark:text-white/30 hover:text-slate-500 hover:bg-slate-500/10'
                    }`}
                  >
                    <ThumbsDown size={15} />
                    {post.dismissCount ?? 0}
                  </button>

                  {/* Net score */}
                  <span className={`ml-auto text-xs font-bold font-mono ${scorePositive ? 'text-emerald-500' : 'text-slate-400 dark:text-white/25'}`}>
                    {scorePositive ? '+' : ''}{netScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ChatNowModal isOpen={showChatNow} onClose={() => setShowChatNow(false)} />
    </div>
  );
}
