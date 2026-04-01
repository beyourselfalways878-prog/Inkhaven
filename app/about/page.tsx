import { BuyMeACoffee } from '../../components/BuyMeACoffee';

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-12 bg-slate-950 text-white min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">About <span className="text-teal-400">InkHaven</span></h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          A high-precision anonymous sanctuary for human resonance. Built for safety, designed for privacy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 group hover:border-teal-500/30 transition-all">
          <h2 className="text-2xl font-bold mb-4 text-teal-400 uppercase tracking-widest text-sm">Our Mission</h2>
          <p className="text-slate-300 leading-relaxed">
            To create a safe space for anonymous conversations where people can be themselves without judgment.
            We believe in fostering genuine connections through smart matching and zero-retention privacy protocols.
          </p>
        </div>

        <div className="glass-panel p-8 group hover:border-cyan-500/30 transition-all">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400 uppercase tracking-widest text-sm">Aura-Matching</h2>
          <ul className="text-slate-300 space-y-3">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Advanced Vibe Algorithms</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> P2P Encrypted Handshakes</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Identity-Free Discovery</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Multi-Layer Moderation</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Zero-Knowledge Architecture</li>
          </ul>
        </div>
      </div>

      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-white uppercase tracking-widest text-sm">The Zenith Standard</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="font-bold mb-2 text-white">Anonymity First</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No phone numbers, no emails required for core chat. Pure, filtered connection.
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-bold mb-2 text-white">Encrypted Tunnel</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your messages travel through a secure P2P mesh, invisible to even our servers.
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-bold mb-2 text-white">Human Resonance</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We focus on the frequency of the conversation, not the profile data behind it.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-3xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"></div>
        <h2 className="text-3xl font-bold mb-8 text-white">A Message from the Creator</h2>
        <div className="max-w-2xl mx-auto space-y-6 text-slate-300 italic text-lg leading-relaxed">
          <p>
            &quot;InkHaven was born from a simple belief: in a world of noise, we all deserve a quiet corner to just <em>be</em>.&quot;
          </p>
          <p>
            &quot;I built this sanctuary not as a product, but as a promise—a promise that your voice matters, your privacy is sacred, and your connection with others can be genuine without the weight of an identity.&quot;
          </p>
          <div className="mt-8 not-italic">
            <div className="font-bold text-teal-400 uppercase tracking-[0.2em] mb-1">Twinkle Tiwari</div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">Architect of The Haven</div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
           <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">Support The Sanctuary</p>
           <BuyMeACoffee />
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-slate-500 text-sm">
          Have questions? Check out our <a href="/faq" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/30 transition-all">FAQ</a> or <a href="mailto:namamicreations@zenithcryptoai.in" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/30 transition-all">contact us</a>.
        </p>
      </div>
    </main>
  )
}
