import React from 'react';

const FAQ = [
  {
    q: 'Do I need an account or personal information to use InkHaven?',
    a: 'Absolutely not. We believe that privacy is a fundamental human right, not a luxury. You can use InkHaven entirely as a guest without ever providing an email address, phone number, or real name. When you connect to our platform, an anonymous "Ink ID" is generated for you locally. If you choose to register an account later, it only serves to backup your preferences and chat history securely across devices. Our primary goal is to ensure you possess a sanctuary where your thoughts and conversations are completely decoupled from your real-world identity.'
  },
  {
    q: 'How does your interest-based matching algorithm actually work?',
    a: 'Unlike traditional platforms that rely on superficial metrics or vast data harvesting, our matching algorithm operates strictly on the topics you explicitly choose. When you select your interests (like "late night contemplation", "gaming", or "music discovery"), our system places you in a dedicated matchmaking queue for those specific vibes. The algorithm prioritizes overlapping tags and attempts to connect you with someone whose immediate mood matches your own. This ensures that the conversations you have are more meaningful, immediate, and free from the friction of finding common ground organically.'
  },
  {
    q: 'What measures are in place to ensure my safety while talking to strangers?',
    a: 'Safety and mental well-being are the core pillars of the InkHaven ecosystem. Because you are anonymous, you are protected by default from targeted harassment bridging into your personal life. Beyond that, we employ a sophisticated AI moderation system that acts as a real-time guardian over the platform. \n\nOur system analyzes behavioral patterns and immediately flags or blocks users who violate our community guidelines regarding hate speech, explicit content, or predatory behavior. Furthermore, every user has instant access to a one-click "Disconnect and Report" button. The moment you feel uncomfortable, you can sever the peer-to-peer connection, and the reported user is instantly sent to our human moderation queue for review.'
  },
  {
    q: 'Are my conversations private? Do you read my messages?',
    a: 'Your conversations are strictly your own. InkHaven operates on a zero-knowledge architecture principle wherever possible. For our 1-on-1 private chats, connections are established using secure WebRTC technology, meaning you are talking directly peer-to-peer with your match. Those messages literally never pass through our database. \n\nFor public rooms and saved chat logs, messages are stored securely using industry-standard AES-256 encryption and are automatically purged from our servers after a strict 24-hour expiration window. We do not sell data, we do not train targeted advertising models on your words, and we do not retain your chat histories.'
  },
  {
    q: 'What languages does InkHaven currently support?',
    a: 'We currently support an expanding roster of languages to foster global connectivity. Right now, matching and interface options are available in English, Spanish, French, Hindi, Bengali, and Telugu. Our goal is to break down geographical barriers, and we are working on integrating real-time translation features that will allow seamless conversation between users who speak completely different languages—maintaining the organic flow of dialogue without misunderstandings.'
  },
  {
    q: 'Is InkHaven completely free, or are there hidden paywalls?',
    a: 'InkHaven is firmly committed to remaining a free sanctuary for everyone who needs it. All core functionality—including peer-to-peer anonymous chatting, interest matching, public rooms, and the feed—will always be 100% free of charge. \n\nWe do offer a premium tier for users who want to support the project\'s server costs. Premium unlocks cosmetic features like custom aura colors, priority queueing during peak server loads, and extended message history saving options (up to 48 hours). However, you will never hit a hard limit on how many people you can talk to as a free user.'
  },
  {
    q: 'How can I contribute to or support the InkHaven project?',
    a: 'InkHaven is managed by a very small, dedicated team of developers who believe in this vision. Running WebRTC signaling servers, real-time databases, and AI moderation costs money. If you believe in our mission of providing a safe, anonymous haven for genuine connection, the best way to support us is by sharing the platform with friends who might need someone to talk to. \n\nAdditionally, you can support us financially by purchasing InkHaven Premium or using the "Buy Me a Coffee" links scattered throughout the site. Your contributions directly pay for our server architecture and allow us to keep the site ad-light and focused on the user experience.'
  }
];

export default function FaqPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-10 min-h-screen">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-bold uppercase tracking-widest mb-2">
          Knowledge Base
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Everything you need to know about InkHaven&apos;s architecture, privacy policies, and community guidelines. 
          We believe in total transparency about how our anonymous sanctuary operates.
        </p>
      </div>

      <div className="space-y-6 mt-12">
        {FAQ.map((item, index) => (
          <div key={index} className="bg-white dark:bg-obsidian-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-snug">
              {item.q}
            </h3>
            <div className="text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
              {item.a.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-8 text-center mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Still have lingering questions?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-6">
          Our moderation and support team is dedicated to keeping this sanctuary safe and transparent. If you have concerns about your privacy or need help setting up your account, reach out to us directly.
        </p>
        <a 
          href="mailto:namamicreations@zenithcryptoai.in" 
          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-500/30"
        >
          Contact Support Team
        </a>
      </div>
    </main>
  );
}
