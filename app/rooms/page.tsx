'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight, Loader2, Zap, Search, FilterX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSessionStore } from '../../stores/useSessionStore';
import ChatNowModal from '../../components/ChatNowModal';

interface PublicRoom {
  id: string;
  name: string;
  topic: string;
  description: string;
  onlineCount: number;
}

const TOPIC_COLORS: Record<string, string> = {
  vibes:       'from-teal-500 to-blue-500',
  music:       'from-pink-500 to-rose-500',
  gaming:      'from-emerald-500 to-teal-500',
  latenight:   'from-violet-600 to-teal-700',
  confessions: 'from-amber-500 to-orange-500',
  random:      'from-cyan-500 to-cyan-600',
  india:       'from-orange-500 to-green-500',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [showChatNow, setShowChatNow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<string | null>(null);
  const { session } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms/public');
        const json = await res.json();
        if (json.ok) setRooms(json.data);
      } catch {
        // silence
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000); // refresh counts every 15s
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = async (room: PublicRoom) => {
    if (joining) return;

    // If not logged in, open ChatNow modal first
    if (!session.userId) {
      setShowChatNow(true);
      return;
    }

    setJoining(room.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (token) {
        await fetch('/api/rooms/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ roomId: room.id }),
        });
      }

      router.push(`/rooms/${room.id}`);
    } catch (err) {
      console.error('Join room failed:', err);
      setJoining(null);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTopic = filterTopic ? r.topic === filterTopic : true;
      return matchSearch && matchTopic;
    });
  }, [rooms, searchQuery, filterTopic]);

  const uniqueTopics = useMemo(() => Array.from(new Set(rooms.map(r => r.topic))), [rooms]);

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Live Rooms
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white text-white mb-3">
          Open Your World
        </h1>
        <p className="text-lg text-slate-400 max-w-xl">
          Jump into a public room. No introductions needed — just show up and vibe.
        </p>
      </div>

      {/* Quick Match CTA */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-teal-600/10 via-cyan-600/10 to-pink-600/10 border border-teal-500/20 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-white mb-0.5">Rather go 1-on-1?</p>
          <p className="text-sm text-slate-400">Instantly match with one person privately.</p>
        </div>
        <button
          onClick={() => session.userId ? router.push('/quick-match') : setShowChatNow(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-teal-500/25 shrink-0"
        >
          <Zap size={16} />
          Quick Match
        </button>
      </div>

      {/* Discovery Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search rooms by name or vibe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 backdrop-blur-2xl border border-white/10 text-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm"
          />
        </div>

        {rooms.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pb-2">
            <button
              onClick={() => setFilterTopic(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterTopic === null
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-900 backdrop-blur-2xl border border-white/10 text-slate-400 hover:bg-slate-800'
              }`}
            >
              All Rooms
            </button>
            {uniqueTopics.map(topic => (
              <button
                key={topic}
                onClick={() => setFilterTopic(topic)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                  filterTopic === topic
                    ? `bg-teal-500/20 border-teal-500/40 text-teal-500 shadow-sm`
                    : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900 backdrop-blur-2xl border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/5 flex items-center justify-center mb-4">
                <FilterX className="w-8 h-8 text-slate-400 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white text-white mb-2">No rooms found</h3>
              <p className="text-sm text-slate-500 text-white/40 max-w-md mx-auto">
                No rooms match your current filters. Try searching for something else or clearing the topic filter.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setFilterTopic(null); }}
                className="mt-6 text-sm font-semibold text-teal-500 hover:text-teal-600 hover:text-teal-400"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const gradient = TOPIC_COLORS[room.topic] ?? 'from-slate-500 to-slate-600';
              const isJoining = joining === room.id;
              return (
                <div
                  key={room.id}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-in fade-in zoom-in-95 duration-300"
                  onClick={() => handleJoinRoom(room)}
                >
                  {/* Gradient top bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                  {/* Card body */}
                  <div className="bg-slate-900 text-white bg-slate-900 text-white/[0.03] border border-slate-200 border-white/5 p-6 h-full flex flex-col">
                    {/* Ambient glow on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />

                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-lg font-bold text-white text-white leading-tight pr-2">
                          {room.name}
                        </h2>
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/5 px-2 py-1 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                          <span className="text-xs font-semibold text-slate-600 text-white/60">
                            {room.onlineCount} online
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 text-white/50 mb-6 leading-relaxed flex-1">
                        {room.description}
                      </p>

                      <button
                        disabled={isJoining}
                        className={`mt-auto flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${gradient} text-white opacity-90 group-hover:opacity-100 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-60`}
                      >
                        {isJoining ? (
                          <><Loader2 size={16} className="animate-spin" /> Entering...</>
                        ) : (
                          <><Users size={16} /> Enter Room <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <ChatNowModal isOpen={showChatNow} onClose={() => setShowChatNow(false)} />
    </div>
  );
}
