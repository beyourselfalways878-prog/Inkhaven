'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, ArrowLeft, Users, Loader2, Flag, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import RoomImageUpload from '../../../components/Chat/RoomImageUpload';
import VoiceRecorder from '../../../components/Chat/VoiceRecorder';
import ReportModal from '../../../components/Chat/ReportModal';
import { useSessionStore } from '../../../stores/useSessionStore';

interface RoomInfo {
  id: string; name: string; topic: string; description: string;
}
interface Message {
  id: string; sender_id: string | null; sender_ink: string;
  content: string; created_at: string; is_system: boolean;
}

const ROOM_REGISTRY: Record<string, RoomInfo> = {
  room_vibes:       { id: 'room_vibes',       name: '🌊 Vibes Only',       topic: 'vibes',       description: 'No agenda. Just good energy.' },
  room_music:       { id: 'room_music',       name: '🎵 Music Minds',      topic: 'music',       description: 'Share what you are listening to.' },
  room_gaming:      { id: 'room_gaming',      name: '🎮 Gaming Lounge',    topic: 'gaming',      description: 'Games, memes, no gatekeeping.' },
  room_latenight:   { id: 'room_latenight',   name: '🌙 Late Night',       topic: 'latenight',   description: 'Cannot sleep? Neither can we.' },
  room_confessions: { id: 'room_confessions', name: '🖊️ Ink Confessions', topic: 'confessions', description: 'Say the unsayable. No judgment.' },
  room_random:      { id: 'room_random',      name: '🎲 Chaos Room',       topic: 'random',      description: 'Anything goes.' },
  room_india:       { id: 'room_india',       name: '🇮🇳 India Talks',     topic: 'india',       description: 'Desi conversations.' },
};

const TOPIC_GRADIENT: Record<string, string> = {
  vibes: 'from-indigo-500 to-blue-500', music: 'from-pink-500 to-rose-500',
  gaming: 'from-emerald-500 to-teal-500', latenight: 'from-violet-600 to-indigo-700',
  confessions: 'from-amber-500 to-orange-500', random: 'from-fuchsia-500 to-purple-600',
  india: 'from-orange-500 to-green-500',
};

export default function GroupChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { session, setSession } = useSessionStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [reporting, setReporting] = useState<{ ink: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myId = useRef<string | null>(null);

  // AI Wingman State
  const [wingmanSuggestions, setWingmanSuggestions] = useState<string[]>([]);
  const [isWingmanLoading, setIsWingmanLoading] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());

  const roomInfo = ROOM_REGISTRY[roomId] ?? {
    id: roomId, name: '💬 Chat Room', topic: 'random', description: 'An InkHaven chat room',
  };
  const gradient = TOPIC_GRADIENT[roomInfo.topic] ?? 'from-indigo-500 to-purple-500';

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // ── Auth init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        let userId = session.userId;
        if (!userId) {
          const { data } = await supabase.auth.getSession();
          userId = data?.session?.user?.id ?? null;
        }
        if (!userId) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          userId = data.user?.id ?? null;
          if (userId) {
            const inkId = `ink_${userId.replace(/-/g, '').slice(0, 8)}`;
            setSession({ ...session, userId, inkId });
          }
        }
        myId.current = userId;

        // Heartbeat join
        const { data: sd } = await supabase.auth.getSession();
        const token = sd?.session?.access_token;
        if (token) {
          await fetch('/api/rooms/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ roomId }),
          });
        }
      } catch (err) {
        console.error('Room auth failed:', err);
      } finally {
        setReady(true);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load message history from DB ──────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const loadHistory = async () => {
      const { data } = await supabase
        .from('group_messages')
        .select('id, sender_id, sender_ink, content, is_system, created_at')
        .eq('room_slug', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const history = data.reverse().map(m => ({
          ...m,
          id: String(m.id),
          sender_id: m.sender_id ?? null,
          is_system: m.is_system ?? false,
        }));
        setMessages(history);
        setLastMessageTime(Date.now());
        setTimeout(() => scrollToBottom(false), 50);
      }
    };
    loadHistory();
  }, [ready, roomId, scrollToBottom]);

  const triggerWingman = useCallback(async () => {
      setIsWingmanLoading(true);
      try {
          // Send last 5 messages for context
          const contextMessages = messages.slice(-5).map(m => ({
              sender: m.sender_id === myId.current ? 'Me' : m.sender_ink,
              text: m.content
          }));

          const res = await fetch('/api/ai-wingman', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: contextMessages, tone: roomInfo.topic === 'vibes' ? 'chill' : 'friendly' })
          });

          if (res.ok) {
              const data = await res.json();
              setWingmanSuggestions(data.suggestions);
          }
      } catch (err) {
          console.error("Wingman failed:", err);
      } finally {
          setIsWingmanLoading(false);
      }
  }, [messages, roomInfo]);

  // ── AI Wingman logic (Cold Start / Stalled Conversation Detection) ──────────
  useEffect(() => {
    if (!ready || messages.length === 0) return;

    // Check every 10 seconds if conversation has stalled
    const interval = setInterval(() => {
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        // If 20 seconds have passed without a message and no suggestions are showing
        if (timeSinceLastMessage > 20000 && wingmanSuggestions.length === 0 && !isWingmanLoading) {
            triggerWingman();
        }
    }, 10000);

      return () => clearInterval(interval);
  }, [ready, messages, lastMessageTime, wingmanSuggestions, isWingmanLoading, triggerWingman]);

  const handleUseSuggestion = (text: string) => {
      setInput(text);
      setWingmanSuggestions([]);
  };

  // ── Realtime channel: presence + broadcast + DB insert subscription ────────
  useEffect(() => {
    if (!ready || !myId.current) return;

    const displayName = session.displayName || session.inkId || 'Anonymous';

    const channel = supabase.channel(`group_room:${roomId}`, {
      config: { presence: { key: myId.current } },
    });

    channel
      // ── New DB-persisted messages (fallback for missed broadcasts) ──
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_messages',
        filter: `room_slug=eq.${roomId}`,
      }, (payload) => {
        const row = payload.new as any;
        const msg: Message = {
          id: String(row.id), sender_id: row.sender_id, sender_ink: row.sender_ink,
          content: row.content, created_at: row.created_at, is_system: row.is_system,
        };
        setMessages(prev => {
          // Avoid adding duplicates (broadcast already may have added it optimistically)
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setLastMessageTime(Date.now());
        setWingmanSuggestions([]); // Clear suggestions when new message arrives
        setTimeout(() => scrollToBottom(), 50);
      })
      // ── Typing indicator broadcast ──
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === myId.current) return;
        setTypingUsers(prev => {
          if (prev.includes(payload.ink)) return prev;
          return [...prev, payload.ink];
        });
        // Remove after 3s of silence
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== payload.ink));
        }, 3000);
      })
      // ── Presence sync (online count) ──
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: myId.current, displayName, joinedAt: Date.now() });
        }
      });

    channelRef.current = channel;

    // DB heartbeat for room_participants
    heartbeatRef.current = setInterval(async () => {
      const { data: sd } = await supabase.auth.getSession();
      const t = sd?.session?.access_token;
      if (t) {
        fetch('/api/rooms/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          body: JSON.stringify({ roomId }), keepalive: true,
        });
      }
    }, 60_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── Scroll on new messages ─────────────────────────────────────────────────
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Typing broadcast ───────────────────────────────────────────────────────
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !myId.current) return;
    channelRef.current.send({
      type: 'broadcast', event: 'typing',
      payload: { userId: myId.current, ink: session.inkId ?? 'anon' },
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [session.inkId]);

  // ── Send message + persist ─────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !channelRef.current || !myId.current) return;
    setSending(true);
    setInput('');

    const ink = session.inkId ?? `ink_anon`;

    // Persist to DB via Supabase client
    const { data: inserted, error } = await supabase
      .from('group_messages')
      .insert({
        room_slug:  roomId,
        sender_id:  myId.current,
        sender_ink: ink,
        content:    text,
      })
      .select('id, sender_id, sender_ink, content, is_system, created_at')
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      // Optimistic fallback — show locally even if DB fails
      const fallback: Message = {
        id: `local_${Date.now()}`, sender_id: myId.current,
        sender_ink: ink, content: text,
        created_at: new Date().toISOString(), is_system: false,
      };
      setMessages(prev => [...prev, fallback]);
    } else if (inserted) {
      // The postgres_changes subscription will add it, but also add optimistically
      const msg: Message = {
        id: String(inserted.id), sender_id: inserted.sender_id,
        sender_ink: inserted.sender_ink, content: inserted.content,
        created_at: inserted.created_at, is_system: inserted.is_system ?? false,
      };
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setLastMessageTime(Date.now());
    }

    setSending(false);
    setWingmanSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-65px)]">
      {/* ── Header ── */}
      <div className="relative flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shrink-0">
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
        <button onClick={() => router.push('/rooms')} className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{roomInfo.name}</h1>
          <p className="text-xs text-slate-400 dark:text-white/40 truncate">{roomInfo.description}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-slate-600 dark:text-white/60"><Users size={12} className="inline mr-1" />{onlineCount}</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-lg mb-4`}>
              {roomInfo.name.split(' ')[0]}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Welcome to {roomInfo.name}</h3>
            <p className="text-sm text-slate-500 dark:text-white/40 max-w-xs mb-2">{roomInfo.description}</p>
            <p className="text-xs text-slate-400 dark:text-white/30">Be the first to say something. 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === myId.current;
          if (msg.is_system) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-xs text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">{msg.content}</span>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
              {!isMe && (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {msg.sender_ink.slice(-1).toUpperCase()}
                </div>
              )}
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] text-slate-400 dark:text-white/30 font-mono">{msg.sender_ink}</span>
                    <button
                      onClick={() => setReporting({ ink: msg.sender_ink })}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-white/20 hover:text-red-400 transition-all p-0.5 rounded"
                      title="Report user"
                    >
                      <Flag size={10} />
                    </button>
                  </div>
                )}
                {msg.content.startsWith('[image]:') ? (
                  <img
                    src={msg.content.replace('[image]:', '')}
                    alt="Shared"
                    className="rounded-2xl max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                    onClick={() => window.open(msg.content.replace('[image]:', ''), '_blank')}
                  />
                ) : msg.content.startsWith('[audio]:') ? (
                  <audio
                    src={msg.content.replace('[audio]:', '')}
                    controls
                    className="h-10 max-w-[240px] rounded-full outline-none shadow-md"
                    style={{ filter: isMe ? 'invert(1)' : 'none' }}
                  />
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isMe
                    ? `bg-gradient-to-br ${gradient} text-white rounded-br-sm shadow-md`
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                )}
                <span className="text-[10px] text-slate-300 dark:text-white/20 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-xs text-slate-400 dark:text-white/30 font-mono">
              {typingUsers.slice(0, 2).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── AI Wingman Suggestions ── */}
      {wingmanSuggestions.length > 0 && (
          <div className="px-4 py-2 bg-gradient-to-t from-white dark:from-slate-950 to-transparent">
             <div className="flex items-center gap-2 mb-2">
                 <Sparkles size={14} className="text-purple-500" />
                 <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest font-mono">Wingman Suggestions</span>
             </div>
             <div className="flex flex-wrap gap-2">
                 {wingmanSuggestions.map((sug, idx) => (
                     <button
                        key={idx}
                        onClick={() => handleUseSuggestion(sug)}
                        className="text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors shadow-sm text-left truncate max-w-full"
                     >
                         {sug}
                     </button>
                 ))}
                 <button onClick={() => setWingmanSuggestions([])} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2">Dismiss</button>
             </div>
          </div>
      )}

      {/* ── Input ── */}
      <div className="border-t border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-4 py-3 shrink-0">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          {/* Media Toolbar */}
          <div className="flex items-center gap-1 shrink-0 pb-1">
            <RoomImageUpload
              roomSlug={roomId}
              onUploadComplete={() => {}}
            />
            <VoiceRecorder
              roomId={roomId}
              onAudioUploaded={() => {}}
              disabled={sending}
            />
          </div>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${roomInfo.name}…`}
              rows={1}
              maxLength={500}
              className="w-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={`flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0`}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-white/20 mt-2 text-center">
          Messages stored 48h only · No personal data · Images max 5MB
        </p>
      </div>

      {/* Report modal */}
      {reporting && (
        <ReportModal
          targetInkId={reporting.ink}
          roomSlug={roomId}
          onClose={() => setReporting(null)}
        />
      )}
    </div>
  );
}
