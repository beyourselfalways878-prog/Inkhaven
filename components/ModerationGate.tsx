"use client";

import React, { useEffect } from 'react';

export type ModerationMode = 'safe' | 'adult';

interface ModerationGateProps {
    children: React.ReactNode;
}

const STORAGE_KEY = 'inkhaven:moderation_mode';
const CONSENT_KEY = 'inkhaven:moderation_consent';

export function getModerationMode(): ModerationMode {
    if (typeof window === 'undefined') return 'safe';
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'adult' ? 'adult' : 'safe';
}

export function hasGivenConsent(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function setModerationMode(mode: ModerationMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, mode);
    localStorage.setItem(CONSENT_KEY, 'true');
    // Also set a cookie so the server middleware can verify consent
    document.cookie = `inkhaven_moderation=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

/**
 * ModerationGate — silently initializes safe mode on first visit.
 * The old blocking popup has been replaced with an inline chat toggle.
 * See: components/Chat/ModerationToggle.tsx
 */
export default function ModerationGate({ children }: ModerationGateProps) {
    useEffect(() => {
        // Silently set 'safe' mode on first visit — no popup needed
        if (!hasGivenConsent()) {
            setModerationMode('safe');
        }
    }, []);

    return <>{children}</>;
}
