'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeerMessage {
  id: string;
  senderId: string;
  senderColor?: string;
  content: string;
  createdAt: string;
  replyToId?: string;
  messageType: 'text' | 'image' | 'audio' | 'system' | 'file' | 'glowpad';
  metadata?: Record<string, any>;
  reactions?: string[];
  isEdited?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

// Re-export legacy alias so existing imports keep working
export type { PeerMessage as WebRTCMessage };

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface IncomingCall {
  callId: string;
  callerId: string;
  hasVideo: boolean;
}

// ─── Internal event protocol (sent over DataConnection) ───────────────────────

type DataEvent =
  | { type: 'HELLO'; payload: { userId: string } }
  | { type: 'CHAT'; payload: PeerMessage }
  | { type: 'TYPING'; payload: { isTyping: boolean } }
  | { type: 'ACK'; payload: { id: string; status: 'delivered' | 'read' } }
  | { type: 'READ_ALL' }
  | { type: 'EDIT'; payload: { id: string; content: string } }
  | { type: 'REACTION'; payload: { id: string; reaction: string } }
  | { type: 'REVEAL' };

// ─── Constants ────────────────────────────────────────────────────────────────

const PEER_ANNOUNCE_INTERVAL_MS = 2_500;
const ICE_TIMEOUT_MS = 25_000;
const INCOMING_RATE_WINDOW = 2_000;
const INCOMING_RATE_MAX = 15;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePeer(roomId: string, userId: string) {
  // ── State ──
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [partnerId, setPartnerId] = useState<string | null>(null);  // partner's userId
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Voice / Video
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // ── Refs (never trigger re-renders) ──
  const peerRef = useRef<any>(null);
  const myPeerIdRef = useRef<string | null>(null);
  const partnerPeerIdRef = useRef<string | null>(null);
  const dataConnRef = useRef<any>(null);
  const mediaConnRef = useRef<any>(null);
  const sigChannelRef = useRef<RealtimeChannel | null>(null);
  const announceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outboxRef = useRef<PeerMessage[]>([]);
  const incomingRateRef = useRef<number[]>([]);
  const cleanedUpRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep localStreamRef in sync so closures can read the latest value
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // ── Notification sound ──
  const playSound = useCallback(() => {
    if (typeof window === 'undefined' || !document.hidden) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch { /* ignore */ }
  }, []);

  // ── Read receipts on focus/visibility ──
  useEffect(() => {
    const markRead = () => {
      if (dataConnRef.current?.open) {
        safeSend({ type: 'READ_ALL' });
      }
    };
    window.addEventListener('focus', markRead);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) markRead(); });
    return () => {
      window.removeEventListener('focus', markRead);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Data channel helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const safeSend = (event: DataEvent) => {
    try {
      if (dataConnRef.current?.open) dataConnRef.current.send(event);
    } catch { /* ignore */ }
  };

  const handleDataEvent = useCallback((raw: unknown) => {
    const event = raw as DataEvent;
    if (!event?.type) return;

    // Incoming rate limit
    const now = Date.now();
    incomingRateRef.current = [...incomingRateRef.current, now].filter(t => now - t < INCOMING_RATE_WINDOW);
    if (incomingRateRef.current.length > INCOMING_RATE_MAX) return;

    switch (event.type) {
      case 'HELLO':
        if (event.payload?.userId) setPartnerId(event.payload.userId);
        break;

      case 'CHAT': {
        const msg = event.payload;
        playSound();
        setMessages(prev => [...prev, msg]);
        const status = document.hidden ? 'delivered' : 'read';
        safeSend({ type: 'ACK', payload: { id: msg.id, status } });
        break;
      }

      case 'ACK':
        setMessages(prev => prev.map(m =>
          m.id === event.payload.id ? { ...m, status: event.payload.status } : m
        ));
        break;

      case 'READ_ALL':
        setMessages(prev => prev.map(m =>
          m.senderId === userId ? { ...m, status: 'read' as const } : m
        ));
        break;

      case 'TYPING':
        setPartnerTyping(event.payload.isTyping);
        if (event.payload.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3_000);
        }
        break;

      case 'EDIT':
        setMessages(prev => prev.map(m =>
          m.id === event.payload.id ? { ...m, content: event.payload.content, isEdited: true } : m
        ));
        break;

      case 'REACTION':
        setMessages(prev => prev.map(m =>
          m.id === event.payload.id
            ? { ...m, reactions: [...(m.reactions || []), event.payload.reaction] }
            : m
        ));
        break;

      case 'REVEAL':
        setIsRevealed(true);
        break;
    }
  }, [userId, playSound]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DataConnection setup
  // ─────────────────────────────────────────────────────────────────────────────

  const setupDataConn = useCallback((conn: any) => {
    dataConnRef.current = conn;

    conn.on('open', () => {
      if (cleanedUpRef.current) return;

      // Connected! Cancel the ICE timeout, stop announcing
      if (iceTimeoutRef.current) clearTimeout(iceTimeoutRef.current);
      if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
      setConnectionState('connected');

      // Introduce ourselves (partner may only know our peer ID, not userId)
      conn.send({ type: 'HELLO', payload: { userId } });

      // Flush queued outbox
      outboxRef.current.forEach(msg => {
        try {
          conn.send({ type: 'CHAT', payload: msg });
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
        } catch { /* ignore */ }
      });
      outboxRef.current = [];
    });

    conn.on('data', handleDataEvent);

    conn.on('close', () => {
      if (!cleanedUpRef.current) setConnectionState('disconnected');
    });

    conn.on('error', (err: any) => {
      console.error('[PeerJS] DataConnection error:', err);
    });
  }, [userId, handleDataEvent]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MediaConnection setup
  // ─────────────────────────────────────────────────────────────────────────────

  const setupMediaConn = useCallback((call: any) => {
    mediaConnRef.current = call;
    setIsInCall(true);
    setIncomingCall(null);

    call.on('stream', (remote: MediaStream) => {
      setRemoteStream(remote);
    });

    call.on('close', () => {
      setRemoteStream(null);
      setIsInCall(false);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    });

    call.on('error', (err: any) => {
      console.error('[PeerJS] MediaConnection error:', err);
      setIsInCall(false);
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Main initialization effect
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId || !userId) return;
    cleanedUpRef.current = false;

    const init = async () => {
      // PeerJS is browser-only — dynamic import ensures Next.js SSR safety
      const { Peer } = await import('peerjs');

      if (cleanedUpRef.current) return;

      // Google STUN servers (free, no auth) — PeerJS handles ICE negotiation internally
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ];

      const peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: { iceServers },
        debug: 0,
      });

      peerRef.current = peer;

      // ── Got our peer ID → start discovery ──
      peer.on('open', (myPeerId: string) => {
        if (cleanedUpRef.current) { peer.destroy(); return; }
        myPeerIdRef.current = myPeerId;

        // Supabase channel purely for peer ID exchange
        const channel = supabase.channel(`peer_${roomId}`, {
          config: { broadcast: { self: false } },
        });
        sigChannelRef.current = channel;

        // When partner announces their peer ID
        channel.on('broadcast', { event: 'peer_announce' }, ({ payload }: { payload: any }) => {
          if (cleanedUpRef.current) return;
          const { userId: theirUserId, peerId: theirPeerId } = payload;
          if (theirUserId === userId || !theirPeerId) return;

          setPartnerId(theirUserId);
          partnerPeerIdRef.current = theirPeerId;

          // Lexicographic: larger peer ID is the "Offerer" (initiates DataConnection)
          if (myPeerId > theirPeerId && !dataConnRef.current) {
            const conn = peer.connect(theirPeerId, {
              reliable: true,
              serialization: 'json',
            });
            setupDataConn(conn);
          }
        });

        channel.subscribe((status: string) => {
          if (status !== 'SUBSCRIBED' || cleanedUpRef.current) return;

          const announce = () => {
            if (cleanedUpRef.current || dataConnRef.current?.open) {
              if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
              return;
            }
            channel.send({
              type: 'broadcast',
              event: 'peer_announce',
              payload: { userId, peerId: myPeerId },
            });
          };

          announce();
          announceIntervalRef.current = setInterval(announce, PEER_ANNOUNCE_INTERVAL_MS);
        });

        // ICE handshake timeout
        iceTimeoutRef.current = setTimeout(() => {
          if (!cleanedUpRef.current && connectionState !== 'connected') {
            setConnectionState('failed');
          }
        }, ICE_TIMEOUT_MS);
      });

      // ── Answerer: incoming DataConnection ──
      peer.on('connection', (conn: any) => {
        if (cleanedUpRef.current) { conn.close(); return; }
        // Store partner peer ID
        partnerPeerIdRef.current = conn.peer;
        setupDataConn(conn);
      });

      // ── Incoming voice/video call ──
      peer.on('call', (call: any) => {
        if (cleanedUpRef.current) { call.close(); return; }
        // Show the in-app incoming call notification
        setIncomingCall({
          callId: call.peer,
          callerId: partnerPeerIdRef.current || call.peer,
          hasVideo: call.metadata?.hasVideo ?? false,
        });

        // Keep the call reference so the user can answer or reject it
        mediaConnRef.current = call;

        // Auto-reject after 30s if not answered
        setTimeout(() => {
          if (mediaConnRef.current === call && !isInCall) {
            call.close();
            setIncomingCall(null);
          }
        }, 30_000);
      });

      peer.on('error', (err: any) => {
        console.error('[PeerJS] Peer error:', err);
        if (!cleanedUpRef.current && err.type !== 'peer-unavailable') {
          setConnectionState('failed');
        }
      });

      peer.on('disconnected', () => {
        if (!cleanedUpRef.current) {
          // Try to reconnect the signaling connection to PeerServer
          try { peer.reconnect(); } catch { /* ignore */ }
        }
      });
    };

    init().catch(err => {
      console.error('[PeerJS] Init failed:', err);
      if (!cleanedUpRef.current) setConnectionState('failed');
    });

    return () => {
      cleanedUpRef.current = true;
      if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
      if (iceTimeoutRef.current) clearTimeout(iceTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      dataConnRef.current?.close();
      mediaConnRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
      if (sigChannelRef.current) supabase.removeChannel(sigChannelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API — Text Chat
  // ─────────────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback((
    content: string,
    messageType: PeerMessage['messageType'] = 'text',
    replyToId?: string,
    metadata?: Record<string, any>,
    senderColor?: string,
  ): PeerMessage => {
    const msg: PeerMessage = {
      id: crypto.randomUUID(),
      senderId: userId,
      senderColor,
      content,
      createdAt: new Date().toISOString(),
      replyToId,
      messageType,
      metadata,
      status: 'sending',
    };

    if (!dataConnRef.current?.open) {
      // Queue until connected
      outboxRef.current.push(msg);
      setMessages(prev => [...prev, msg]);
      return msg;
    }

    dataConnRef.current.send({ type: 'CHAT', payload: msg });
    msg.status = 'sent';
    setMessages(prev => [...prev, msg]);
    return msg;
  }, [userId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    safeSend({ type: 'TYPING', payload: { isTyping } });
  }, []);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    safeSend({ type: 'EDIT', payload: { id: messageId, content: newContent } });
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
    ));
  }, []);

  const reactToMessage = useCallback((messageId: string, reaction: string) => {
    safeSend({ type: 'REACTION', payload: { id: messageId, reaction } });
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, reactions: [...(m.reactions || []), reaction] } : m
    ));
  }, []);

  const revealIdentity = useCallback(() => {
    safeSend({ type: 'REVEAL' });
    setIsRevealed(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API — Voice / Video
  // ─────────────────────────────────────────────────────────────────────────────

  const startCall = useCallback(async (withVideo = false) => {
    if (!peerRef.current || !partnerPeerIdRef.current || isInCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(!withVideo);

      const call = peerRef.current.call(partnerPeerIdRef.current, stream, {
        metadata: { hasVideo: withVideo, callerId: userId },
      });
      setupMediaConn(call);
    } catch (err) {
      console.error('[Call] getUserMedia failed:', err);
      throw err; // Let the UI handle (e.g., show "mic access denied")
    }
  }, [userId, isInCall, setupMediaConn]);

  const rejectCall = useCallback(() => {
    mediaConnRef.current?.close();
    mediaConnRef.current = null;
    setIncomingCall(null);
  }, []);

  const answerCall = useCallback(async (withVideo = false) => {
    const call = mediaConnRef.current;
    if (!call || isInCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(!withVideo);

      call.answer(stream);
      setupMediaConn(call);
    } catch (err) {
      console.error('[Call] answerCall getUserMedia failed:', err);
      // Inline reject to avoid forward-reference issues
      mediaConnRef.current?.close();
      mediaConnRef.current = null;
      setIncomingCall(null);
    }
  }, [isInCall, setupMediaConn]);

  const hangUp = useCallback(() => {
    mediaConnRef.current?.close();
    mediaConnRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStream(null);
    setIsInCall(false);
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(prev => !prev);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    // Text chat
    messages,
    connectionState,
    partnerId,
    partnerTyping,
    isRevealed,
    sendMessage,
    sendTyping,
    editMessage,
    reactToMessage,
    revealIdentity,

    // Voice / Video
    localStream,
    remoteStream,
    isInCall,
    isMuted,
    isVideoOff,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleVideo,
  };
}

// ─── Legacy re-export for any file importing from useWebRTC ───────────────────
export const useWebRTC = usePeer;
