'use client';

import { useRef, useState } from 'react';
import { ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  roomSlug: string;
  // eslint-disable-next-line no-unused-vars
  onUploadComplete?: (url: string) => void;
}

export default function RoomImageUpload({ roomSlug, onUploadComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) { setError('Images only'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB'); return; }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomSlug', roomSlug);

      const res = await fetch('/api/rooms/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Upload failed');
      }

      const { data } = await res.json();
      onUploadComplete?.(data.url);
      setPreview(null);
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Share image"
        className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all disabled:opacity-40"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
      </button>

      {/* Upload preview overlay */}
      {preview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl max-w-xs w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Uploading image...</p>
              <Loader2 size={16} className="animate-spin text-indigo-500" />
            </div>
            <img src={preview} alt="Preview" className="w-full rounded-xl object-cover max-h-48" />
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom-4">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
    </>
  );
}
