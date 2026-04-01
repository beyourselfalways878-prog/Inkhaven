'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import { Shield, Target, Lock, Zap, Palette, Mic } from 'lucide-react';
import ChatNowModal from '../components/ChatNowModal';



const GlowingCard = ({ children, className = '', gradient }: { children: React.ReactNode; className?: string; gradient: string }) => (
  <div className={`relative group ${className}`}>
    <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-60 transition duration-700`} />
    <div className="hyper-glass p-6 h-full flex flex-col hover:-translate-y-1 transition-transform duration-500">
      {children}
    </div>
  </div>
);

const AnimatedCounter = ({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const FeatureIcon = ({ gradient, children }: { gradient: string; children: React.ReactNode }) => (
  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl shadow-lg`}>
    {children}
  </div>
);

export default function Page() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [stats, setStats] = useState({ onlineNow: 0, chatsToday: 0, activeRooms: 0, totalUsers: 0 });
  const [chatNowOpen, setChatNowOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setStats({
            onlineNow:   json.data.onlineNow   ?? 0,
            chatsToday:  json.data.chatsToday  ?? 0,
            activeRooms: json.data.activeRooms ?? 0,
            totalUsers:  json.data.totalUsers  ?? 0,
          });
        }
      }
    } catch {
      // Keep defaults on error
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);


  const testimonials = [
    { text: "I feel like I can finally be myself without judgment.", author: "Ink_7f2a", mood: "🌙" },
    { text: "The matching algorithm is incredibly accurate. Found my vibe instantly.", author: "Anonymous", mood: "✨" },
    { text: "Finally a chat app that respects privacy AND looks gorgeous.", author: "Ink_9k3m", mood: "💜" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-slate-950 animate-chameleon">
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay w-full h-full" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full blur-3xl opacity-40 animate-float-fast" style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%)" }} />
        <div className="absolute top-[20%] right-[-10%] w-80 h-80 rounded-full blur-3xl opacity-40 animate-float-medium" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(20, 184, 166, 0.3) 100%)" }} />
        <div className="absolute bottom-[10%] left-[20%] w-72 h-72 rounded-full blur-3xl opacity-40 animate-float-slow" style={{ background: "linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(244, 63, 94, 0.3) 100%)" }} />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-pink-500/10 border border-teal-200/50 border-teal-800/50 mb-8 animate-pulse-slow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              AI-Guarded • Real-Time • Zero-Trust Privacy
            </span>
          </div>

          {/* Main Headline with Gradient */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="block text-white">Where Anonymity</span>
            <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent animate-gradient">
              Meets Connection
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            A premium space for authentic conversations. No names, no profiles, just <span className="text-teal-400 font-bold">real human connection</span> — protected by AI moderation and designed for your peace of mind.
          </p>

          {/* CTA Buttons — Primary: instant chat, Secondary: full onboarding */}
          <div className="flex flex-col items-center gap-4 mb-12">
            {/* Primary: Zero-friction instant entry */}
            <button
              onClick={() => setChatNowOpen(true)}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 hover:via-cyan-500 hover:to-emerald-500 text-white px-10 py-5 text-xl font-bold rounded-2xl shadow-2xl shadow-teal-500/20 hover:shadow-[0_0_50px_rgba(20,184,166,0.5)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Zap className="w-6 h-6 group-hover:animate-bounce" />
              Chat Now Instantly
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg animate-bounce">
                FREE
              </span>
            </button>

            {/* Secondary row: onboarding + rooms */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <Button asChild variant="secondary" size="lg" className="px-6 py-3 rounded-xl transition-all hover:-translate-y-1 text-sm font-bold text-white uppercase tracking-widest">
                <Link href="/onboarding">
                  <span className="mr-2 text-teal-400">✨</span> Set Up My Profile
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="px-6 py-3 rounded-xl transition-all hover:-translate-y-1 text-sm font-bold text-white uppercase tracking-widest">
                <Link href="/rooms">
                  <span className="mr-2 text-cyan-400">🏠</span> Browse Rooms
                </Link>
              </Button>
            </div>
          </div>

          {/* Live Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="px-6">
              <div className="text-3xl font-bold text-teal-400 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse inline-block mr-1" />
                <AnimatedCounter end={stats.onlineNow} suffix="" />
              </div>
              <div className="text-sm text-slate-500">Online Now</div>
            </div>
            <div className="px-6 border-l border-r border-white/5">
              <div className="text-3xl font-bold text-white">
                <AnimatedCounter end={stats.chatsToday} suffix="+" />
              </div>
              <div className="text-sm text-slate-500">Chats Today</div>
            </div>
            <div className="px-6">
              <div className="text-3xl font-bold text-white">
                <AnimatedCounter end={stats.activeRooms} suffix="" />
              </div>
              <div className="text-sm text-slate-500">Live Rooms</div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">InkHaven</span>?
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            We&apos;ve reimagined anonymous chat from the ground up.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <GlowingCard gradient="from-teal-500 to-cyan-500">
            <FeatureIcon gradient="from-teal-500 to-cyan-500"><Shield className="w-7 h-7" /></FeatureIcon>
            <h3 className="text-xl font-semibold mt-5 mb-3 text-white">AI-Powered Safety</h3>
            <p className="text-slate-400">Real-time content moderation protects every conversation. Harmful content is caught before it reaches you.</p>
          </GlowingCard>

          <GlowingCard gradient="from-emerald-500 to-teal-500">
            <FeatureIcon gradient="from-emerald-500 to-teal-500"><Target className="w-7 h-7" /></FeatureIcon>
            <h3 className="text-xl font-semibold mt-5 mb-3 text-white">Smart Matching</h3>
            <p className="text-slate-400">Our AI learns from your conversations to find people who match your vibe and interests.</p>
          </GlowingCard>

          <GlowingCard gradient="from-cyan-500 to-blue-500">
            <FeatureIcon gradient="from-cyan-500 to-blue-500"><Lock className="w-7 h-7" /></FeatureIcon>
            <h3 className="text-xl font-semibold mt-5 mb-3 text-white">Zero-Knowledge Privacy</h3>
            <p className="text-slate-400">No emails, no phone numbers, no real names. Your identity stays completely private.</p>
          </GlowingCard>

          <GlowingCard gradient="from-teal-600 to-emerald-600">
            <FeatureIcon gradient="from-teal-600 to-emerald-600"><Zap className="w-7 h-7" /></FeatureIcon>
            <h3 className="text-xl font-semibold mt-5 mb-3 text-white">Real-Time Everything</h3>
            <p className="text-slate-400">Instant messages, live typing indicators, and presence status. It feels like being in the same room.</p>
          </GlowingCard>

          <GlowingCard gradient="from-cyan-400 to-teal-400">
            <FeatureIcon gradient="from-cyan-400 to-teal-400"><Palette className="w-7 h-7" /></FeatureIcon>
            <h3 className="text-xl font-semibold mt-5 mb-3 text-white">Premium Design</h3>
            <p className="text-slate-400">A beautiful, calming interface that makes chatting a pleasure. Dark mode included.</p>
          </GlowingCard>

          <GlowingCard gradient="from-emerald-400 to-cyan-400">
            <FeatureIcon gradient="from-emerald-400 to-cyan-400"><Mic className="w-7 h-7" /></FeatureIcon>
            <h3 className="text-xl font-semibold mt-5 mb-3 text-white">Voice Messages</h3>
            <p className="text-slate-400">Send voice notes when typing isn&apos;t enough. Express yourself naturally.</p>
          </GlowingCard>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 rounded-3xl p-1">
            <div className="bg-slate-950 animate-chameleon text-white rounded-[22px] p-8 md:p-12">
              <div className="text-center">
                <div className="text-5xl mb-6">{testimonials[activeTestimonial].mood}</div>
                <p className="text-2xl md:text-3xl font-medium text-white mb-6 transition-all duration-500">
                  &quot;{testimonials[activeTestimonial].text}&quot;
                </p>
                <p className="text-slate-400">— {testimonials[activeTestimonial].author}</p>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial
                        ? 'w-8 bg-gradient-to-r from-teal-400 to-cyan-500'
                        : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="hyper-glass p-12 overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-emerald-500/5 blur-3xl -z-10" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to experience <span className="bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">real connection</span>?
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
              Join thousands of users who have found their space for authentic, anonymous conversations in the ultimate Zenith sanctuary.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-10 py-6 text-lg rounded-full shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] transition-all transform hover:scale-105">
              <Link href="/onboarding">
                Enter The Sanctuary <span className="ml-2">→</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer removed - using global footer */}

      {/* Chat Now Modal */}
      <ChatNowModal isOpen={chatNowOpen} onClose={() => setChatNowOpen(false)} />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(5deg); }
          66% { transform: translateY(10px) rotate(-3deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
