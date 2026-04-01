"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../../components/ui/toast';
import { Settings, User, SlidersHorizontal, Shield, Volume2, Eye, Keyboard, Info, LogIn, LogOut, EyeOff, Palette } from 'lucide-react';
import { useSessionStore } from '../../stores/useSessionStore';
import { supabase } from '../../lib/supabase';
import AuthModal from '../../components/Profile/AuthModal';

export default function SettingsPage() {
  const toast = useToast();
  const [preferences, setPreferences] = useState({
    readReceipts: true,
    typingPrivacy: true,
    safetyFilter: true,
    soundEffects: false,
  });

  const [showAuth, setShowAuth] = useState(false);
  const clearSession = useSessionStore((s) => s.clearSession);
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const [isRealUser, setIsRealUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [savingDiscover, setSavingDiscover] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsRealUser(!!data.session?.user?.email);
    });

    // Check if push is already enabled in this browser
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.pushManager.getSubscription().then(sub => {
            if (sub) setPushEnabled(true);
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('inkhaven:preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences((prev) => ({ ...prev, ...parsed }));
        if (parsed.discoverable !== undefined) setDiscoverable(parsed.discoverable);
      } catch (_err) {
        // ignore
      }
    }
  }, []);

  const toggleDiscoverable = async () => {
    setSavingDiscover(true);
    const next = !discoverable;
    setDiscoverable(next);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;
      if (token && session.userId) {
        await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: next ? 'join' : 'leave' }),
        });
      }
      const stored = localStorage.getItem('inkhaven:preferences');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem('inkhaven:preferences', JSON.stringify({ ...parsed, discoverable: next }));
      toast.success(`Discoverability ${next ? 'enabled — you appear in Discover' : 'disabled — you are invisible'}`);
    } catch {
      toast.error('Failed to update discoverability');
      setDiscoverable(!next);
    } finally {
      setSavingDiscover(false);
    }
  };

  const update = (key: keyof typeof preferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('inkhaven:preferences', JSON.stringify(next));
      toast.success(`${key === 'readReceipts' ? 'Read receipts' : key === 'typingPrivacy' ? 'Typing privacy' : key === 'safetyFilter' ? 'Safety filter' : 'Sound effects'} ${next[key] ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  const togglePushNotifications = async () => {
    setPushLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error('Push notifications are not supported by your browser.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;

      if (pushEnabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        setPushEnabled(false);
        toast.success('Push notifications disabled for this device.');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Notification permission denied.');
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        // Send to backend
        const { data: sd } = await supabase.auth.getSession();
        const token = sd?.session?.access_token;
        if (!token) {
            toast.error('You must be logged in to enable push notifications');
            return;
        }

        const res = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(sub)
        });

        if (!res.ok) throw new Error('Failed to save subscription');

        setPushEnabled(true);
        toast.success('Push notifications enabled!');
      }
    } catch (err: any) {
        console.error('Push toggle error:', err);
        toast.error('Error toggling notifications. Make sure you are not in Incognito mode.');
    } finally {
      setPushLoading(false);
    }
  };

  const settingsMeta = [
    { key: 'readReceipts', title: 'Read receipts', desc: 'Let partners see when you read.', icon: Eye },
    { key: 'typingPrivacy', title: 'Typing privacy', desc: 'Delay typing indicators for calm pacing.', icon: Keyboard },
    { key: 'safetyFilter', title: 'Safety filter', desc: 'Auto-block unsafe content in real time.', icon: Shield },
    { key: 'soundEffects', title: 'Sound effects', desc: 'Subtle audio cues during chat.', icon: Volume2 },
  ] as const;

  const PREMIUM_COLORS = [
    { name: 'Default', value: '' },
    { name: 'Neon Green', value: '#39ff14' },
    { name: 'Cyber Pink', value: '#ff007f' },
    { name: 'Plasma Blue', value: '#00ffff' },
    { name: 'Solar Gold', value: '#ffcf00' },
  ];

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-teal-400" />
            <h2 className="text-3xl font-semibold text-white text-white">Settings</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500 text-slate-400">
            Customize your InkHaven experience.
          </p>

          <div className="mt-6 space-y-3">
            <Link href="/profile" className="block rounded-xl border border-slate-200 border-white/5 bg-slate-950/60 backdrop-blur-3xl border border-white/20 bg-slate-900 text-white/[0.03] px-4 py-3 hover:bg-slate-950/40 backdrop-blur-2xl border border-white/10 hover:bg-slate-900 text-white/[0.06] transition group">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-teal-400 group-hover:text-teal-300 transition" />
                <div>
                  <div className="font-semibold text-white text-white text-sm">Profile</div>
                  <div className="text-xs text-slate-400 text-slate-500">Manage your identity and interests</div>
                </div>
              </div>
            </Link>
            <Link href="/onboarding/preferences" className="block rounded-xl border border-slate-200 border-white/5 bg-slate-950/60 backdrop-blur-3xl border border-white/20 bg-slate-900 text-white/[0.03] px-4 py-3 hover:bg-slate-950/40 backdrop-blur-2xl border border-white/10 hover:bg-slate-900 text-white/[0.06] transition group">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition" />
                <div>
                  <div className="font-semibold text-white text-white text-sm">Preferences</div>
                  <div className="text-xs text-slate-400 text-slate-500">Privacy and experience controls</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 border-white/5 space-y-3">
            {isRealUser ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  clearSession();
                  window.location.href = '/';
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 hover:bg-red-500/20 transition group"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">Sign Out</span>
              </button>
            ) : (
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-center">
                <p className="text-xs text-teal-200/60 mb-3">You are currently using a temporary anonymous session. Register to save your settings and chats.</p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-white hover:bg-teal-500 transition group shadow-lg shadow-teal-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-semibold">Register / Sign In</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="glass p-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-6">Privacy & Experience</h3>

            {settingsMeta.map((item) => {
              const Icon = item.icon;
              const isOn = preferences[item.key];
              return (
                <button
                  key={item.key}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-950/60 backdrop-blur-3xl border border-white/20 bg-slate-900 text-white/[0.03] px-4 py-3 text-left hover:bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/[0.06] transition"
                  onClick={() => update(item.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isOn ? 'text-teal-400' : 'text-slate-300 text-white/20'} transition`} />
                      <div>
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="text-xs text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    <span className={`h-6 w-10 rounded-full ${isOn ? 'bg-teal-500' : 'bg-slate-200 bg-slate-900 text-white/10'} relative transition`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-slate-900 text-white shadow transition-all ${isOn ? 'right-0.5' : 'left-0.5'}`} />
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Custom Username Color (Premium) */}
            <div className="pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-500 text-white/80 uppercase tracking-wider text-xs flex justify-between items-center">
                  <span>Aesthetics</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded uppercase tracking-widest border border-amber-500/30">Premium</span>
              </h3>
            </div>
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-950/60 backdrop-blur-3xl border border-white/20 bg-slate-900 text-white/[0.03] px-4 py-3 transition">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-semibold text-white">Custom Username Color</div>
                  <div className="text-xs text-slate-400">Stand out in the chat rooms</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                 {PREMIUM_COLORS.map(color => (
                     <button
                        key={color.name}
                        onClick={() => {
                            if (!session.isPremium) return toast.info('Custom colors are a Premium feature!');
                            setSession({...session, usernameColor: color.value});
                            toast.success(`Username color set to ${color.name}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${session.usernameColor === color.value ? 'ring-2 ring-teal-500 scale-105' : 'hover:bg-slate-200 hover:bg-slate-900 text-white/10'}`}
                        style={{
                            borderColor: color.value || 'rgba(150,150,150,0.2)',
                            color: color.value || 'inherit',
                            backgroundColor: session.usernameColor === color.value ? (color.value ? `${color.value}15` : 'rgba(150,150,150,0.1)') : 'transparent'
                        }}
                     >
                         {color.name}
                     </button>
                 ))}
                 {!session.isPremium && (
                     <div className="w-full mt-2 text-xs text-amber-500/80 italic">Unlock these colors by upgrading to Premium.</div>
                 )}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-500 text-white/80 uppercase tracking-wider text-xs">Notifications</h3>
            </div>
            <button
              onClick={togglePushNotifications}
              disabled={pushLoading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-950/60 backdrop-blur-3xl border border-white/20 bg-slate-900 text-white/[0.03] px-4 py-3 text-left hover:bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/[0.06] transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 text-xs shadow-inner shadow-teal-500/20">🔔</div>
                  <div>
                    <div className="text-sm font-semibold text-white">Push Notifications</div>
                    <div className="text-xs text-slate-400">Get alerted when someone Resonates with you</div>
                  </div>
                </div>
                <span className={`h-6 w-10 rounded-full ${pushEnabled ? 'bg-teal-500' : 'bg-slate-200 bg-slate-900 text-white/10'} relative transition`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-slate-900 text-white shadow transition-all ${pushEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </span>
              </div>
            </button>

            {/* Discoverability */}
            <div className="pt-4 pb-2">
              <h3 className="text-sm font-semibold text-slate-500 text-white/80 uppercase tracking-wider text-xs">Discover Grid</h3>
            </div>
            <button
              onClick={toggleDiscoverable}
              disabled={savingDiscover}
              className="w-full rounded-2xl border border-slate-200 bg-slate-950/60 backdrop-blur-3xl border border-white/20 bg-slate-900 text-white/[0.03] px-4 py-3 text-left hover:bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/[0.06] transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {discoverable
                    ? <Eye className="w-4 h-4 text-cyan-400" />
                    : <EyeOff className="w-4 h-4 text-slate-300 text-white/20" />}
                  <div>
                    <div className="text-sm font-semibold text-white">Appear in Discover</div>
                    <div className="text-xs text-slate-400">Let others find and Resonate with you</div>
                  </div>
                </div>
                <span className={`h-6 w-10 rounded-full ${discoverable ? 'bg-cyan-500' : 'bg-slate-200 bg-slate-900 text-white/10'} relative transition`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-slate-900 text-white shadow transition-all ${discoverable ? 'right-0.5' : 'left-0.5'}`} />
                </span>
              </div>
            </button>

            <button
              className="w-full rounded-2xl border border-white/5 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 px-4 py-3 text-left hover:from-teal-500/20 hover:to-cyan-500/20 transition group"
              onClick={() => toast.info('Aura intensity is now adaptive to your typing speed!')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 animate-pulse flex items-center justify-center text-xs">✨</div>
                  <div>
                    <div className="text-sm font-semibold text-white">Resonant Aura</div>
                    <div className="text-xs text-slate-400">Dynamic background reacts to your vibe</div>
                  </div>
                </div>
                <div className="text-xs text-teal-300 font-medium bg-teal-500/10 px-2 py-1 rounded-full border border-teal-500/20">Active</div>
              </div>
            </button>

            <div className="pt-6 pb-2">
              <h3 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider text-xs">Danger Zone</h3>
            </div>

            {deleteConfirm ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                <p className="text-sm text-red-400 font-medium">This is permanent and cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        const { data: sessionData } = await supabase.auth.getSession();
                        const token = sessionData?.session?.access_token;
                        const res = await fetch('/api/auth/delete-account', {
                          method: 'POST',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        if (!res.ok) throw new Error('Failed to delete account');
                        toast.success('Account deleted.');
                        await supabase.auth.signOut();
                        clearSession();
                        window.location.href = '/';
                      } catch {
                        toast.error('Failed to delete account. Please try again.');
                        setIsDeleting(false);
                        setDeleteConfirm(false);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 transition"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, delete permanently'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-950/40 backdrop-blur-2xl border border-white/10 bg-slate-900 text-white/5 text-slate-600 text-white/60 text-sm font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                disabled={isDeleting}
                className="w-full rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-left hover:bg-red-500/10 transition group disabled:opacity-50"
                onClick={() => setDeleteConfirm(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">⚠️</div>
                  <div>
                    <div className="text-sm font-semibold text-red-400">Delete Account</div>
                    <div className="text-xs text-red-400/40">Permanently erase all data</div>
                  </div>
                </div>
              </button>
            )}


            <div className="mt-6 pt-6 border-t border-slate-200 border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-400 text-white/30" />
                <h4 className="text-sm font-semibold text-white text-white">About InkHaven</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-400 text-slate-500">
                <p>Version 1.0.0</p>
                <p>Built with privacy and safety in mind.</p>
                <div className="mt-4 flex gap-3">
                  <Link href="/faq" className="text-teal-400 hover:text-teal-300 transition">FAQ</Link>
                  <Link href="/about" className="text-teal-400 hover:text-teal-300 transition">About</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
