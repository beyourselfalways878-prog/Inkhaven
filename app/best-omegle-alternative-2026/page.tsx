import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Zap, 
  MessagesSquare, 
  Users, 
  Lock, 
  EyeOff, 
  Globe, 
  HeartHandshake
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Omegle Alternative 2026 (That Actually Works) | InkHaven',
  description: 'Looking for the best Omegle alternative in 2026? InkHaven is a highly-moderated, zero-registration anonymous chat site offering instant, text-only connections.',
  keywords: 'best omegle alternative 2026 working, omegle replacement random chat 2026, omegle like website text only free',
};

export default function OmegleAlternativePage() {
  return (
    <main className="min-h-[100dvh] pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 -z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-slate-950 to-slate-950 -z-10" />
        
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-bold uppercase tracking-widest">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
            100% Working in 2026
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">
            The Best Omegle Alternative <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              For Meaningful Connection
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Miss the golden days of random internet chat but hate the bots and explicit content? 
            Welcome to InkHaven. No registration, no app downloads, and no camera required. 
            Just instant, text-only conversations with strangers who actually want to talk.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/chat" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)]"
            >
              Start Anonymous Chat
            </Link>
            <Link 
              href="/discover" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-colors"
            >
              Browse Public Rooms
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-500 pt-8">
            <span className="flex items-center gap-2"><Lock size={16} /> 100% Anonymous</span>
            <span className="flex items-center gap-2"><EyeOff size={16} /> No Sign-up Needed</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} /> AI Moderated</span>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Crucial for AdSense Content Depth */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Why Most Alternative Sites Fail</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Since Omegle shut down, hundreds of clones have appeared. Most of them are filled with bots, 
              slow connections, and unmoderated explicit content. Here is how we fixed the formula.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Aggressive AI Moderation</h3>
              <p className="text-slate-400 leading-relaxed">
                We utilize real-time AI to filter out bots, spam, and inappropriate behavior before you even see it. 
                Our community is clean, making it safe for genuine conversations.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Lighting Fast Text-Only</h3>
              <p className="text-slate-400 leading-relaxed">
                By focusing purely on text communication instead of resource-heavy video, our matchmaking is instantaneous. 
                Zero buffering, zero black screens, just instant connection.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Zero Data Harvesting</h3>
              <p className="text-slate-400 leading-relaxed">
                We do not ask for your email. We do not require a login. We do not store your chat logs. 
                Everything operates on ephemeral WebRTC connections that vanish the moment you disconnect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-24 max-w-5xl mx-auto px-6 space-y-24">
        {/* Row 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-teal-500 font-bold uppercase tracking-widest text-sm">
              <Users size={16} /> Global Community
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Talk to strangers worldwide, instantly.</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Finding someone to talk to shouldn&apos;t require filling out a massive profile or swiping through pictures. 
              Our algorithm connects you with another human being in milliseconds. Whether you want to discuss philosophy, 
              get advice, or just share a joke, someone is always online.
            </p>
          </div>
          <div className="h-[400px] bg-slate-100 rounded-3xl border border-slate-200 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10" />
             <Globe size={120} className="text-teal-500/20" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="h-[400px] bg-slate-100 rounded-3xl border border-slate-200 relative overflow-hidden flex items-center justify-center order-2 md:order-1">
             <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 to-slate-800/10" />
             <HeartHandshake size={120} className="text-slate-400/20" />
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <div className="inline-flex items-center gap-2 text-slate-900 font-bold uppercase tracking-widest text-sm">
              <MessagesSquare size={16} /> Text-First Philosophy
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Why no video? Because personality matters more.</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Video chat alternatives often devolve into visually explicit or superficial environments. 
              By aggressively limiting our platform to text-only, we force users to connect on a deeper, 
              intellectual level. It also ensures the site works perfectly on any device, even on slow 3G connections.
            </p>
          </div>
        </div>
      </section>

      {/* Comprehensive FAQ Section for High SEO Value */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-600">Common questions about using InkHaven as your primary Omegle alternative.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Is InkHaven truly free?</h3>
              <p className="text-slate-600 leading-relaxed">
                Yes, completely free. We do not have premium tiers, &quot;coins,&quot; or locked features. 
                Our core mission is to provide an accessible and safe environment for anonymous communication for everyone.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Do I need an app?</h3>
              <p className="text-slate-600 leading-relaxed">
                No app download is required. InkHaven is a Progressive Web App (PWA), meaning it runs beautifully 
                directly inside your mobile or desktop browser with native-like performance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-3">How is this different from other alternatives in 2026?</h3>
              <p className="text-slate-600 leading-relaxed">
                Unlike most clones that prioritize video capabilities (which quickly become unmoderated), 
                we focus on a text-only, heavily moderated experience. This prevents the &quot;stranger danger&quot; 
                aspects associated with webcam sites and fosters actual conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center space-y-8">
        <h2 className="text-4xl font-black text-slate-900">Ready to meet someone new?</h2>
        <p className="text-xl text-slate-600">Join thousands of concurrent users instantly.</p>
        <Link 
          href="/chat" 
          className="inline-flex items-center justify-center px-12 py-5 bg-slate-950 text-white rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-xl"
        >
          Enter the Haven
        </Link>
      </section>
    </main>
  );
}
