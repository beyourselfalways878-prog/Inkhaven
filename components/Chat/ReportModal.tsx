'use client';

import { useState } from 'react';
import { Flag, X, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/toast';

interface Props {
  targetInkId: string;
  roomSlug: string;
  onClose: () => void;
}

const REASONS = [
  { id: 'spam',       label: 'Spam or flooding' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate',       label: 'Hate speech' },
  { id: 'explicit',   label: 'Sexual or explicit content' },
  { id: 'violence',   label: 'Threats or violence' },
  { id: 'other',      label: 'Something else' },
];

export default function ReportModal({ targetInkId, roomSlug, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);

    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;

      await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetInkId, roomSlug, reason, details }),
      });

      setDone(true);
      toast.success('Report submitted. Our team will review it shortly.');
      setTimeout(onClose, 2000);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-slate-950 animate-chameleon text-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-bold text-gray-100 dark:text-white mb-1">Report Received</h3>
            <p className="text-sm text-slate-500 dark:text-white/50">Thank you for keeping InkHaven safe.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Flag size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 dark:text-white text-sm">Report User</h3>
                  <p className="text-xs text-slate-400 dark:text-white/40 font-mono">{targetInkId}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Reason pills */}
            <p className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-3">What&apos;s the issue?</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${
                    reason === r.id
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 300))}
              placeholder="Additional context (optional)..."
              rows={2}
              className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 dark:bg-slate-950 animate-chameleon border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-all resize-none mb-4"
            />

            <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-4">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400/80">Reports are anonymous. Abuse of the report system may result in a ban.</p>
            </div>

            <button
              onClick={submit}
              disabled={!reason || submitting}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
              Submit Report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
