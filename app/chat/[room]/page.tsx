"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SkipForward, Loader2, Save, ShieldAlert, Ban, Sparkles,
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming,
} from 'lucide-react';
import MessageList from '../../../components/Chat/MessageList';
import MessageInput from '../../../components/Chat/MessageInput';
import PresenceIndicator from '../../../components/Chat/PresenceIndicator';
import { Avatar } from '../../../components/ui/avatar';
import { MessageSkeleton } from '../../../components/ui/skeleton';
import { AuraBlendBackground } from '../../../components/InkAura';
import { useSessionStore } from '../../../stores/useSessionStore';
import { usePeer } from '../../../lib/hooks/usePeer';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/toast';

interface PartnerProfile {
  displayName: string;
  avatarUrl?: string;
}

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = (params?.room as string) || 'room_demo';
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const [ready, setReady] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const myId = session.userId || 'guest_local';
  const myAuraSeed = session.auraSeed ?? 42;
  const myRep = session.reputation ?? 50;

  const {
    messages, connectionState, partnerId, partnerTyping, isRevealed,
    sendMessage, sendTyping, editMessage, reactToMessage,
    // Voice / Video
    localStream, remoteStream, isInCall, isMuted, isVideoOff,
    incomingCall, startCall, answerCall, rejectCall, hangUp, toggleMute, toggleVideo,
  } = usePeer(roomId, myId);

  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'mutual'>('idle');
  const [myIntensity, setMyIntensity] = useState(0);
  const [panicked, setPanicked] = useState(false);

  // Local/remote video element refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // AI Wingman
  const [wingmanSuggestions, setWingmanSuggestions] = useState<string[]>([]);
  const [isWingmanLoading, setIsWingmanLoading] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageTime(Date.now());
      setWingmanSuggestions([]);
    }
  }, [messages.length]);

  const triggerWingman = useCallback(async () => {
    setIsWingmanLoading(true);
    try {
      const context = messages.slice(-5).map(m => ({
        sender: m.senderId === myId ? 'Me' : 'Partner',
        text: m.content,
      }));
      const res = await fetch('/api/ai-wingman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: context, tone: 'friendly' }),
      });
      if (res.ok) {
        const data = await res.json();
        setWingmanSuggestions(data.suggestions);
      }
    } catch { /* ignore */ } finally {
      setIsWingmanLoading(false);
    }
  }, [messages, myId]);

  useEffect(() => {
    if (!ready || messages.length === 0 || connectionState !== 'connected') return;
    const interval = setInterval(() => {
      if (Date.now() - lastMessageTime > 20_000 && wingmanSuggestions.length === 0 && !isWingmanLoading) {
        triggerWingman();
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [ready, messages.length, lastMessageTime, wingmanSuggestions.length, isWingmanLoading, connectionState, triggerWingman]);

  // Auth init
  useEffect(() => {
    const initAuth = async () => {
      try {
        let uid = session.userId ?? null;
        if (!uid) {
          const { data } = await supabase.auth.getSession();
          uid = data?.session?.user?.id ?? null;
        }
        if (!uid) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          uid = data.user?.id ?? null;
          setSession({ ...session, userId: uid });
        }
      } catch { /* fallback to local session */ } finally {
        setReady(true);
      }
    };
    initAuth();
  }, [session, setSession]);

  // Fetch partner profile when revealed
  useEffect(() => {
    if (isRevealed && partnerId && !partnerProfile) {
      supabase.from('profiles').select('display_name, avatar_url').eq('id', partnerId).single()
        .then(({ data }) => {
          if (data) {
            setPartnerProfile({ displayName: data.display_name, avatarUrl: data.avatar_url });
            setSaveStatus('mutual');
            toast.success(`Identities Revealed! You are now friends with ${data.display_name}`);
          }
        });
    }
  }, [isRevealed, partnerId, partnerProfile, toast]);

  // Zen Panic Switch (Double-Escape)
  useEffect(() => {
    let lastEsc = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 500) { setPanicked(true); document.title = '404 Not Found'; }
        lastEsc = now;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Local Scorched Earth Enforcement
  useEffect(() => {
    if (partnerId) {
      const existingBans = JSON.parse(localStorage.getItem('inkhaven_blocklist') || '[]');
      if (existingBans.includes(partnerId)) {
        toast.error('Blocked user encountered. Severing connection...');
        hangUp();
        router.push('/quick-match');
      }
    }
  }, [partnerId, router, hangUp, toast]);

  if (panicked) {
    return (
      <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center p-8 font-mono">
        <h1 className="text-4xl font-bold mb-4">404 Not Found</h1>
        <p>The requested URL was not found on this server.</p>
        <p className="mt-8 text-sm text-teal-400 hover:text-cyan-400 cursor-pointer transition-colors"
          onClick={() => { setPanicked(false); document.title = 'InkHaven | Anonymous & Safe Chat'; }}>
          [Click to restore]
        </p>
      </div>
    );
  }

  const handleSaveChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) { toast.error('You must register an account to save chats.'); return; }
      if (messages.length === 0) { toast.error('No messages to save yet.'); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        setSaveStatus('pending');
        const res = await fetch('/api/chat/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ roomId, partnerId }),
        });
        const data = await res.json();
        if (data.ok && data.status === 'pending') toast.success('Save request sent! Waiting for partner...');
      }
    } catch { toast.error('Failed to save chat.'); setSaveStatus('idle'); }
  };

  const handleSkipChat = async () => {
    setSkipping(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token && messages.length > 0) {
        fetch('/api/chat/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ roomId, messages }),
          keepalive: true,
        }).catch(() => { /* best-effort analytics flush */ });
      }
      const res = await fetch('/api/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'skip', currentRoomId: roomId, partnerId: partnerId || null }),
      });
      const data = await res.json();
      if (data.ok && data.data?.matchFound && data.data?.roomId) {
        router.push(`/chat/${data.data.roomId}`);
      } else {
        router.push('/quick-match');
      }
    } catch { setSkipping(false); }
  };

  const handleBlockPartner = async () => {
    if (!partnerId) return;
    try {
      // 1. Local Scorched Earth ban
      const existingBans = JSON.parse(localStorage.getItem('inkhaven_blocklist') || '[]');
      if (!existingBans.includes(partnerId)) {
        existingBans.push(partnerId);
        localStorage.setItem('inkhaven_blocklist', JSON.stringify(existingBans));
      }

      // 2. Sever P2P tunnel instantly
      hangUp(); // Closes streams

      // 3. Optional server report (fire and forget)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        fetch('/api/moderation/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ blockedId: partnerId }),
        }).catch(() => {});
      }

      toast.success('Connection severed and fingerprint banned.');
      router.push('/quick-match');
    } catch { toast.error('Failed to execute scorched earth protocol.'); }
  };

  const submitReport = async () => {
    if (!partnerId || !reportReason.trim()) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reportedId: partnerId, reason: reportReason }),
      });
      toast.success('Report submitted. Thank you.');
      setIsReporting(false);
      setReportReason('');
    } catch { toast.error('Failed to submit report.'); }
  };

  const handleStartVoiceCall = async () => {
    try { await startCall(false); }
    catch { toast.error('Microphone access denied or unavailable.'); }
  };

  const handleStartVideoCall = async () => {
    try { await startCall(true); }
    catch { toast.error('Camera/microphone access denied or unavailable.'); }
  };

  if (!ready) {
    return (
      <div className="container mx-auto px-6 py-10">
        <div className="card p-0 overflow-hidden border border-white/5">
          <div className="px-6 py-4 border-b border-white/10">
            <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
          </div>
          <MessageSkeleton count={5} />
        </div>
      </div>
    );
  }

  const isConnected = connectionState === 'connected';

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="hyper-glass overflow-hidden shadow-2xl border border-white/10 relative">

        {/* ── Chat Header ── */}
        <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <Avatar
                userId={partnerId || 'partner'}
                displayName={isRevealed && partnerProfile ? partnerProfile.displayName : 'Connected Partner'}
                size="md" showStatus status="online"
              />
            ) : (
              <Avatar displayName="?" size="md" showStatus
                status={connectionState === 'connecting' ? 'away' : 'offline'} />
            )}
            <div>
              <div className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                {isConnected
                  ? (isRevealed && partnerProfile ? partnerProfile.displayName : 'Anonymous Partner')
                  : connectionState === 'failed' ? 'Connection Failed'
                  : connectionState === 'disconnected' ? 'Partner Left'
                  : 'Scanning The Haven...'}
                {isRevealed && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-500 uppercase tracking-widest border border-green-500/30">Friend</div>
                )}
              </div>
              <div className="text-xs text-teal-400 font-mono tracking-wider mt-0.5">
                {connectionState === 'connecting' ? 'NEGOTIATING P2P TUNNEL...'
                  : connectionState === 'failed' ? 'HANDSHAKE FAILED — TRY NEXT'
                  : connectionState === 'disconnected' ? 'PARTNER DISCONNECTED'
                  : isRevealed ? 'MUTUAL SECURE CHANNEL' : 'ANONYMOUS P2P CHANNEL'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <PresenceIndicator
              onlineCount={isConnected ? 2 : 1}
              partnerStatus={isConnected ? 'online' : 'offline'}
              partnerName={isRevealed && partnerProfile ? partnerProfile.displayName : 'Partner'}
              isConnected={isConnected}
            />

            {/* Voice Call */}
            {isConnected && !isInCall && (
              <button onClick={handleStartVoiceCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                title="Start Voice Call">
                <Phone size={14} />
                <span className="hidden sm:inline uppercase tracking-widest">Voice</span>
              </button>
            )}

            {/* Video Call */}
            {isConnected && !isInCall && (
              <button onClick={handleStartVideoCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                title="Start Video Call">
                <Video size={14} />
                <span className="hidden sm:inline uppercase tracking-widest">Video</span>
              </button>
            )}

            {/* In-call controls */}
            {isInCall && (
              <div className="flex items-center gap-1.5">
                <button onClick={toggleMute}
                  className={`p-2 rounded-full border transition-all ${isMuted ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
                  title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                {!isVideoOff && (
                  <button onClick={toggleVideo}
                    className={`p-2 rounded-full border transition-all ${isVideoOff ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
                    title="Toggle Camera">
                    {isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}
                  </button>
                )}
                <button onClick={hangUp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-xs font-bold transition-all hover:scale-105 active:scale-95">
                  <PhoneOff size={14} />
                  <span className="hidden sm:inline uppercase tracking-widest">End</span>
                </button>
              </div>
            )}

            <button onClick={handleSaveChat} disabled={saveStatus !== 'idle'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${saveStatus === 'mutual' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : saveStatus === 'pending' ? 'bg-teal-500/20 text-teal-300 animate-pulse border border-teal-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:scale-105 active:scale-95'}`}>
              <Save size={14} />
              <span className="hidden sm:inline uppercase tracking-widest">
                {saveStatus === 'mutual' ? 'Saved' : saveStatus === 'pending' ? 'Pending' : 'Save'}
              </span>
            </button>

            <button onClick={() => setIsReporting(true)} disabled={!isConnected || !partnerId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              <ShieldAlert size={14} />
              <span className="hidden sm:inline uppercase tracking-widest">Report</span>
            </button>

            <button onClick={handleBlockPartner} disabled={!isConnected || !partnerId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)] border border-red-500/50 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              <Ban size={14} />
              <span className="hidden lg:inline uppercase tracking-widest">Ban & Disconnect</span>
            </button>

            <button onClick={handleSkipChat} disabled={skipping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/40 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
              <SkipForward size={14} />
              <span className="uppercase tracking-widest">Next</span>
            </button>
          </div>
        </div>

        {/* ── Chat Body ── */}
        <AuraBlendBackground
          seed1={myAuraSeed} rep1={myRep}
          seed2={isConnected ? 777 : 0} rep2={50}
          intensity={myIntensity}
          className="relative flex flex-col h-[70vh] pb-28 md:pb-24"
        >
          <MessageList
            roomId={roomId} myId={myId} messages={messages}
            partnerTyping={partnerTyping} onEdit={editMessage} onReact={reactToMessage}
          />

          {/* AI Wingman Suggestions */}
          {wingmanSuggestions.length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-t from-slate-950 to-transparent backdrop-blur-sm z-10 mt-auto">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-teal-400" />
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-mono">Wingman</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {wingmanSuggestions.map((sug, i) => (
                  <button key={i}
                    onClick={() => { sendMessage(sug); setWingmanSuggestions([]); }}
                    className="text-xs bg-slate-900 border border-teal-500/30 text-teal-200 px-3 py-1.5 rounded-full hover:bg-teal-500/20 transition-all hover:scale-105 active:scale-95">
                    {sug}
                  </button>
                ))}
                <button onClick={() => setWingmanSuggestions([])} className="text-xs text-slate-500 hover:text-white px-2">Dismiss</button>
              </div>
            </div>
          )}

          <MessageInput
            myId={myId} onIntensityChange={setMyIntensity}
            onSendMessage={sendMessage} onTyping={sendTyping}
            isPremium={session.isPremium} myColor={session.usernameColor}
          />
        </AuraBlendBackground>

        {/* ── Overlays ── */}
        <AnimatePresence>

          {/* Skipping */}
          {skipping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
              <p className="text-lg font-bold text-white animate-pulse">Finding your next match...</p>
              <p className="text-sm text-slate-400 mt-1">Hang tight</p>
            </motion.div>
          )}

          {/* Connection failed */}
          {connectionState === 'failed' && !skipping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md gap-5 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">P2P Tunnel Failed</h3>
                <p className="text-sm text-slate-400 max-w-xs">Could not establish a direct connection. This can happen due to strict firewalls or NAT. Try finding a new match.</p>
              </div>
              <button onClick={handleSkipChat}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95">
                Find New Match
              </button>
            </motion.div>
          )}

          {/* Incoming call notification */}
          {incomingCall && !isInCall && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-4 min-w-[260px]">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                <PhoneIncoming className="w-7 h-7 text-teal-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white">Incoming {incomingCall.hasVideo ? 'Video' : 'Voice'} Call</p>
                <p className="text-xs text-slate-400 mt-0.5">Partner wants to connect</p>
              </div>
              <div className="flex gap-4">
                <button onClick={rejectCall}
                  className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all hover:scale-105">
                  <PhoneOff size={20} />
                </button>
                <button onClick={() => answerCall(incomingCall.hasVideo)}
                  className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center hover:bg-teal-500/30 transition-all hover:scale-105">
                  <Phone size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Video call overlay */}
          {isInCall && !isVideoOff && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black flex items-center justify-center">
              {/* Remote video (large) */}
              <video ref={remoteVideoRef} autoPlay playsInline
                className="w-full h-full object-cover" />
              {/* Local video (pip) */}
              <div className="absolute bottom-24 right-4 w-32 aspect-video rounded-xl overflow-hidden border-2 border-teal-500/40 shadow-lg bg-slate-900">
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="w-full h-full object-cover" />
              </div>
              {/* Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button onClick={toggleMute}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/30 border-red-500/50 text-red-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}>
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/30 border-red-500/50 text-red-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}>
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
                <button onClick={hangUp}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-900/30 transition-all hover:scale-105">
                  <PhoneOff size={22} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Voice call bar (audio only) */}
          {isInCall && isVideoOff && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-[73px] left-0 right-0 z-30 bg-slate-950/95 border-b border-teal-500/20 backdrop-blur-md px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                  <Phone size={14} className="text-teal-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Voice Call Active</p>
                  <p className="text-xs text-teal-400">Peer-to-peer encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs transition-all ${isMuted ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                  {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button onClick={hangUp}
                  className="px-4 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5">
                  <PhoneOff size={12} /> End
                </button>
              </div>
              {/* Hidden remote audio */}
              <audio ref={remoteVideoRef as any} autoPlay />
            </motion.div>
          )}

          {/* Report modal */}
          {isReporting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Report User</h3>
                <p className="text-sm text-slate-400 mb-4">Please specify why you are reporting this user.</p>
                <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors mb-4 resize-none"
                  rows={4} placeholder="Reason for reporting..." />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsReporting(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={submitReport} disabled={!reportReason.trim()} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors disabled:opacity-50">Submit Report</button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
