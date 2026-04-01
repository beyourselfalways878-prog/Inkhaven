/* eslint-disable no-unused-vars */
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, PenTool } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { FileUpload } from './FileUpload';
import { EmojiToggle } from './EmojiPicker';
import Glowpad from './Glowpad';
import { MessageReplyPreview, type ReplyMessage } from './MessageReply';
import type { WebRTCMessage } from '../../lib/hooks/useWebRTC';
import { supabase } from '../../lib/supabase';

interface MessageInputProps {
  myId: string;
  replyTo?: ReplyMessage | null;
  onCancelReply?: () => void;
  onIntensityChange?: (__intensity: number) => void;
  onSendMessage: (_content: string, _type?: WebRTCMessage['messageType'], _replyToId?: string, _metadata?: any, _senderColor?: string) => void;
  onTyping: (_isTyping: boolean) => void;
  isPremium?: boolean;
  myColor?: string;
}

export default function MessageInput({ myId, replyTo, onCancelReply, onIntensityChange, onSendMessage, onTyping, isPremium = false, myColor }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [safetyEnabled, setSafetyEnabled] = useState(true);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showGlowpad, setShowGlowpad] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const typingTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outgoingRateRef = useRef<number[]>([]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;

    // Token Expiration Edge-Case: Check session before sending
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      localStorage.setItem(`inkhaven_draft_${myId}`, value.trim());
      setBlockedMessage('Session expired or network disconnected. Secure draft saved locally.');
      return;
    }

    // Outgoing spam protection: max 5 messages per 3 seconds
    const now = Date.now();
    outgoingRateRef.current = [...outgoingRateRef.current, now].slice(-5);
    if (outgoingRateRef.current.length === 5 && (now - outgoingRateRef.current[0]) < 3000) {
      setBlockedMessage('You are sending messages too fast. Please slow down.');
      return;
    }

    setBlockedMessage(null);
    if (safetyEnabled) {
      setChecking(true);
      try {
        const res = await fetch('/api/moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check', text: value.trim() })
        });
        const json = await res.json();
        if (json?.data?.flagged === true) {
          setBlockedMessage('Message blocked by safety filter. Try rephrasing.');
          setChecking(false);
          return;
        }
      } catch {
        // fail open
      } finally {
        setChecking(false);
      }
    }

    onSendMessage(value.trim(), 'text', replyTo?.id, undefined, myColor);
    setValue('');
    onCancelReply?.();
  };

  const handleAudioRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setShowAudioRecorder(false);
    setUploadProgress(0);
    try {
      const urlRes = await fetch('/api/audio/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: myId, audioDuration: duration, fileMimeType: 'audio/webm' })
      });
      const { uploadUrl, audioUrl } = await urlRes.json();
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/webm' },
        body: audioBlob
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      onSendMessage(audioUrl, 'audio', replyTo?.id, undefined, myColor);
      onCancelReply?.();
    } catch (err) {
      console.error('Audio upload failed:', err);
      setBlockedMessage('Failed to upload audio. Please try again.');
    }
  };

  const handleFileSelected = async (file: File) => {
    setShowFileUpload(false);
    setUploadProgress(0);
    try {
      let payloadFile = file;

      // Aggressive Native Compression for Images (Protects AWS Bandwidth and Database)
      if (file.type.startsWith('image/') && !file.type.includes('gif')) {
        setBlockedMessage('Compressing & optimizing image...');
        setChecking(true);
        payloadFile = await new Promise<File>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_SIZE = 1200; // Limit to 1200px max dimension
              let { width, height } = img;
              if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
              } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
              }
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (blob) resolve(new File([blob], 'optimized.webp', { type: 'image/webp' }));
                else resolve(file);
              }, 'image/webp', 0.75); // Extreme WebP Compression
            };
            img.onerror = () => resolve(file);
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
        setChecking(false);
        setBlockedMessage(null);
      }

      // Safety Filter (Using the optimized, tiny WebP file!)
      if (safetyEnabled && payloadFile.type.startsWith('image/')) {
        setBlockedMessage('Checking image safety...');
        setChecking(true);
        const base64Image = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(payloadFile);
        });
        
        const res = await fetch('/api/moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'checkImage', image: base64Image, mimeType: payloadFile.type })
        });
        const json = await res.json();
        if (json?.data?.flagged === true) {
          setBlockedMessage(`Image blocked by safety filter: ${json.data.reason || 'Content violation'}`);
          setChecking(false);
          return;
        }
        setBlockedMessage(null);
        setChecking(false);
      }

      setBlockedMessage('Encrypting & Uploading...');
      const urlRes = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: myId, fileName: payloadFile.name, fileSize: payloadFile.size, fileMimeType: payloadFile.type })
      });
      const { uploadUrl, fileUrl } = await urlRes.json();
      
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': payloadFile.type },
        body: payloadFile
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      onSendMessage(fileUrl, 'file', replyTo?.id, { fileName: payloadFile.name, fileSize: payloadFile.size, fileMimeType: payloadFile.type, fileUrl }, myColor);
      setBlockedMessage(null);
      onCancelReply?.();
    } catch (err) {
      console.error('File upload failed:', err);
      setBlockedMessage('Failed to secure and upload file.');
      setChecking(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleGlowpadSend = async (base64Image: string) => {
    setShowGlowpad(false);

    // Drawing Moderation Check
    if (safetyEnabled) {
      setBlockedMessage('Checking drawing...');
      setChecking(true);
      try {
        const res = await fetch('/api/moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'checkImage',
            image: base64Image,
            mimeType: 'image/webp' // Glowpad uses webp usually
          })
        });
        const json = await res.json();

        if (json?.data?.flagged === true) {
          setBlockedMessage(`Drawing blocked by safety filter: ${json.data.reason || 'Content violation'}`);
          setChecking(false);
          return;
        }
        setBlockedMessage(null);
      } catch (e) {
        // fail open
      } finally {
        setChecking(false);
      }
    }

    onSendMessage(base64Image, 'glowpad', replyTo?.id, undefined, myColor);
  };

  const handleEmojiSelect = (emoji: string) => {
    setValue(prev => prev + emoji);
    inputRef.current?.focus();
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('inkhaven:preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.safetyFilter === 'boolean') setSafetyEnabled(parsed.safetyFilter);
      }

      const draft = localStorage.getItem(`inkhaven_draft_${myId}`);
      if (draft) {
        setValue(draft);
        localStorage.removeItem(`inkhaven_draft_${myId}`);
      }
    } catch {
      // ignore
    }
    return () => {
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
    };
  }, [myId]);

  // Focus input when replying
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);

    try { onTyping(true); } catch { /* ignore */ }

    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      try { onTyping(false); } catch { /* ignore */ }
    }, 1200);
  };

  // Typing velocity tracker
  const [intensity, setIntensity] = useState(0);
  const keystrokes = useRef<number[]>([]);

  const trackTypingVelocity = () => {
    const now = Date.now();
    keystrokes.current = [...keystrokes.current, now].filter(t => now - t < 2000);
    const cpm = keystrokes.current.length * 30;
    const rawIntensity = Math.min(cpm / 300, 1);

    setIntensity(prev => {
      const target = rawIntensity;
      return target > prev ? target : prev * 0.95;
    });

    if (onIntensityChange) onIntensityChange(intensity);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    trackTypingVelocity();

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      keystrokes.current = []; // Reset on send
      setIntensity(0);
      if (onIntensityChange) onIntensityChange(0);
    }
  };

  // Decay intensity when idle
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (keystrokes.current.length > 0) {
        const valid = keystrokes.current.filter(t => now - t < 2000);
        if (valid.length !== keystrokes.current.length) {
          keystrokes.current = valid;
          const cpm = valid.length * 30;
          const newIntensity = Math.min(cpm / 300, 1);
          setIntensity(newIntensity);
          if (onIntensityChange) onIntensityChange(newIntensity);
        }
      } else if (intensity > 0.01) {
        setIntensity(prev => {
          const next = prev * 0.9;
          if (onIntensityChange) onIntensityChange(next);
          return next;
        });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [intensity, onIntensityChange]);

  const isBusy = checking;

  return (
    <div
      className="relative border-t border-slate-200 dark:border-white/5 bg-slate-950 text-white dark:bg-slate-900/80 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-teal-500/10 backdrop-blur-sm border-2 border-dashed border-teal-500 rounded-t-xl flex items-center justify-center flex-col gap-2"
          >
            <Paperclip className="w-8 h-8 text-teal-400 animate-bounce" />
            <span className="text-sm font-medium text-teal-300">Drop file to upload</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyTo && onCancelReply && (
          <MessageReplyPreview replyTo={replyTo as any} onCancel={onCancelReply} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAudioRecorder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <div className="p-3 bg-black/60 backdrop-blur-3xl border border-white/20 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5">
              <AudioRecorder onRecordingComplete={handleAudioRecordingComplete} />
            </div>
          </motion.div>
        )}
        {showFileUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3"
          >
            <div className="p-3 bg-black/60 backdrop-blur-3xl border border-white/20 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5">
              <FileUpload onFileSelected={handleFileSelected} />
            </div>
          </motion.div>
        )}
        {showGlowpad && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3 pb-2"
          >
            <Glowpad
              onSend={handleGlowpadSend}
              onCancel={() => setShowGlowpad(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="px-3 py-2">
        <div className="flex items-end gap-1.5">
          <div className="flex items-center gap-0.5 pb-0.5">
            <button
              type="button"
              onClick={() => {
                if (!isPremium) return alert('Glowpad Drawings are a Premium feature! Please upgrade to access.');
                setShowGlowpad(!showGlowpad); setShowAudioRecorder(false); setShowFileUpload(false);
              }}
              className={`p-2 rounded-xl transition-colors ${showGlowpad ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60 hover:bg-black/40 backdrop-blur-2xl border border-white/10 dark:hover:bg-slate-950'}`}
              title={isPremium ? "Draw Ephemeral Neon" : "Premium: Draw Ephemeral Neon"}
            >
              <PenTool size={20} className={!isPremium ? "opacity-30" : ""} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPremium) return alert('Voice Notes are a Premium feature! Please upgrade to access.');
                setShowAudioRecorder(!showAudioRecorder); setShowFileUpload(false); setShowGlowpad(false);
              }}
              className={`p-2 rounded-xl transition-colors ${showAudioRecorder ? 'bg-red-500/20 text-red-400' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60 hover:bg-black/40 backdrop-blur-2xl border border-white/10 dark:hover:bg-slate-950'}`}
              title={isPremium ? "Record audio" : "Premium: Record Audio"}
            >
              <Mic size={20} className={!isPremium ? "opacity-30" : ""} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPremium) return alert('File Uploads are a Premium feature! Please upgrade to access.');
                setShowFileUpload(!showFileUpload); setShowAudioRecorder(false); setShowGlowpad(false);
              }}
              className={`p-2 rounded-xl transition-colors ${showFileUpload ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60 hover:bg-black/40 backdrop-blur-2xl border border-white/10 dark:hover:bg-slate-950'}`}
              title={isPremium ? "Upload file" : "Premium: Upload File"}
            >
              <Paperclip size={20} className={!isPremium ? "opacity-30" : ""} />
            </button>
            <EmojiToggle onSelect={handleEmojiSelect} />
          </div>

          <input
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-black/60 backdrop-blur-3xl border border-white/20 dark:bg-slate-950 px-4 py-2.5 text-sm text-gray-100 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
            placeholder={replyTo ? 'Type your reply...' : 'Type a message...'}
          />

          <button
            type="submit"
            disabled={isBusy || !value.trim()}
            className={`
              p-2.5 rounded-xl transition-all
              ${value.trim()
                ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-lg shadow-teal-500/20'
                : 'bg-black/40 backdrop-blur-2xl border border-white/10 dark:bg-slate-950 text-slate-300 dark:text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Send size={18} className={isBusy ? 'animate-pulse' : ''} />
          </button>
        </div>

        <AnimatePresence>
          {blockedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs text-amber-400/80 px-1"
            >
              ⚠️ {blockedMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2 h-1 bg-black/40 backdrop-blur-2xl border border-white/10 dark:bg-slate-950 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-teal-950/300 rounded-full"
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </form>
    </div>
  );
}
