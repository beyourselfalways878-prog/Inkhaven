'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Send, Trash2 } from 'lucide-react';
import { useToast } from '../ui/toast';
import { supabase } from '../../lib/supabase';

interface VoiceRecorderProps {
  roomId: string;
  // eslint-disable-next-line no-unused-vars
  onAudioUploaded: (audioUrl: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ roomId, onAudioUploaded, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= 120) { // Auto stop at 2 mins
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Mic access error:', err);
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDuration(0);
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const formData = new FormData();
      formData.append('audio', audioBlob, `voice_note_${Date.now()}.webm`);
      formData.append('roomId', roomId);

      const res = await fetch('/api/rooms/audio', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const { url } = await res.json();
      onAudioUploaded(url);
      cancelRecording(); // reset state
    } catch (e) {
      toast.error('Failed to send voice note.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (audioUrl && !isRecording) {
    return (
      <div className="absolute inset-x-0 bottom-full mb-3 mx-4 p-3 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-3 z-20">
        <audio src={audioUrl} controls className="h-8 flex-1 outline-none" style={{ filter: 'invert(1)' }} />
        <button
          onClick={cancelRecording}
          disabled={isUploading}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={uploadAudio}
          disabled={isUploading}
          className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow transition disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isRecording && (
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20 whitespace-nowrap animate-pulse">
            <div className="w-2 h-2 rounded-full bg-slate-950 text-white animate-ping" />
            <span className="text-xs font-bold font-mono">{formatTime(duration)}</span>
        </div>
      )}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`p-2 rounded-xl transition-all ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'text-slate-400 dark:text-white/40 hover:bg-black/40 backdrop-blur-2xl border border-white/10 dark:hover:bg-slate-950 text-white/10 hover:text-teal-500 disabled:opacity-50'
        }`}
        title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
      >
        {isRecording ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
      </button>
    </div>
  );
}
