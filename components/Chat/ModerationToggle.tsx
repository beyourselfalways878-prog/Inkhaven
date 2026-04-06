"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff } from 'lucide-react';
import { useToast } from '../ui/toast';
import {
  getModerationMode,
  setModerationMode,
  type ModerationMode,
} from '../ModerationGate';

interface ModerationToggleProps {
  /** Called when the mode changes, so parent (MessageInput) can update safetyEnabled */
  // eslint-disable-next-line no-unused-vars
  onModeChange?: (_isSafe: boolean) => void;
}

export default function ModerationToggle({ onModeChange }: ModerationToggleProps) {
  const [mode, setMode] = useState<ModerationMode>('safe');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  useEffect(() => {
    const current = getModerationMode();
    setMode(current);
    onModeChange?.(current === 'safe');
  }, [onModeChange]);

  const handleToggle = () => {
    if (mode === 'safe') {
      // Switching to 18+ — show a brief inline confirm
      setShowConfirm(true);
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
      confirmTimeout.current = setTimeout(() => setShowConfirm(false), 5000);
    } else {
      // Switching back to safe — instant
      applyMode('safe');
    }
  };

  const applyMode = (newMode: ModerationMode) => {
    const isChanging = mode !== newMode;
    setMode(newMode);
    setModerationMode(newMode);
    setShowConfirm(false);
    onModeChange?.(newMode === 'safe');
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    
    if (isChanging) {
      if (newMode === 'adult') {
        toast.warning('Switched to 18+ Mode. Your next match will be from the unrestricted pool.');
      } else {
        toast.success('Switched to Safe Mode. Next match will be from the moderated pool.');
      }
    }
  };

  const isSafe = mode === 'safe';

  return (
    <div className="relative flex items-center">
      {/* Main toggle button */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <motion.button
          type="button"
          onClick={handleToggle}
          aria-label={isSafe ? 'Safe Chat active — click to switch to 18+ mode' : '18+ Chat active — click to switch to Safe mode'}
          title={isSafe ? 'Safe Chat' : '18+ Chat'}
          className={`
            relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all
            border backdrop-blur-sm select-none overflow-hidden
            ${isSafe
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated icon swap */}
          <AnimatePresence mode="wait">
            {isSafe ? (
              <motion.span
                key="safe-icon"
                initial={{ opacity: 0, rotate: -30, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center"
              >
                <Shield size={13} />
              </motion.span>
            ) : (
              <motion.span
                key="adult-icon"
                initial={{ opacity: 0, rotate: 30, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -30, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center"
              >
                <ShieldOff size={13} />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Label */}
          <AnimatePresence mode="wait">
            <motion.span
              key={isSafe ? 'safe-label' : 'adult-label'}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="hidden sm:inline whitespace-nowrap overflow-hidden"
            >
              {isSafe ? 'Safe' : '18+'}
            </motion.span>
          </AnimatePresence>

          {/* Live glow pulse when 18+ is active */}
          {!isSafe && (
            <motion.span
              className="absolute inset-0 rounded-xl bg-amber-500/5"
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !showConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            >
              <div className={`
                px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shadow-2xl border
                backdrop-blur-xl
                ${isSafe
                  ? 'bg-slate-900/95 border-emerald-500/20 text-emerald-300'
                  : 'bg-slate-900/95 border-amber-500/20 text-amber-300'
                }
              `}>
                {isSafe
                  ? '🛡️ Safe Mode — Strict AI moderation on'
                  : '🔞 18+ Mode — Low moderation, adult content allowed'
                }
                {/* Arrow */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent
                  ${isSafe ? 'border-t-emerald-500/20' : 'border-t-amber-500/20'}
                `} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inline 18+ confirm bubble */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-64"
          >
            <div className="bg-slate-900/98 border border-amber-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl">
              <p className="text-xs text-amber-300 font-semibold mb-1">
                🔞 Switch to 18+ Mode?
              </p>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Confirm you are 18+ and legally permitted to view adult content. Moderation will be reduced.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyMode('adult')}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                >
                  Yes, I&apos;m 18+
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-5 -mt-px border-4 border-transparent border-t-amber-500/30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
