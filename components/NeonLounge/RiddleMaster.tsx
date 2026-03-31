'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Lightbulb, Fingerprint } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Riddle {
  question: string;
  answer: string;
}

const RIDDLES: Record<Difficulty, Riddle[]> = {
  easy: [
    { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "An Echo" },
    { question: "What has to be broken before you can use it?", answer: "An Egg" },
    { question: "I’m tall when I’m young, and I’m short when I’m old. What am I?", answer: "A Candle" }
  ],
  medium: [
    { question: "The more of this there is, the less you see. What is it?", answer: "Darkness" },
    { question: "What has keys but can't open locks?", answer: "A Piano" },
    { question: "I have branches, but no fruit, trunk or leaves. What am I?", answer: "A Bank" }
  ],
  hard: [
    { question: "I am taken from a mine and shut in a wooden case, from which I am never released, and yet I am used by almost every person. What am I?", answer: "Pencil Lead" },
    { question: "What disappears as soon as you say its name?", answer: "Silence" },
    { question: "Forward I am heavy, backward I am not. What am I?", answer: "The word 'TON'" }
  ]
};

export default function RiddleMaster() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const startRiddles = (diff: Difficulty) => {
    setDifficulty(diff);
    // Pick a random starting riddle for variety
    const rIdx = Math.floor(Math.random() * RIDDLES[diff].length);
    setRiddleIndex(rIdx);
    setShowAnswer(false);
  };

  const nextRiddle = () => {
    if (!difficulty) return;
    const len = RIDDLES[difficulty].length;
    setRiddleIndex((prev) => (prev + 1) % len);
    setShowAnswer(false);
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-amber-500/20 backdrop-blur-md">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-6 font-mono tracking-widest uppercase">The Oracle</h3>
        <p className="text-sm text-slate-400 mb-6 text-center">Decipher the cryptic sequences.</p>
        <div className="flex gap-4">
          <Button onClick={() => startRiddles('easy')} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/50">Initiate Level 1</Button>
          <Button onClick={() => startRiddles('medium')} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-500/50">Initiate Level 2</Button>
          <Button onClick={() => startRiddles('hard')} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 border border-rose-500/50">Initiate Level 3</Button>
        </div>
      </div>
    );
  }

  const currentRiddle = RIDDLES[difficulty][riddleIndex];

  return (
    <div className="flex flex-col items-center p-8 bg-slate-900/50 rounded-2xl border border-amber-500/20 backdrop-blur-md w-full max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
        <Lightbulb className="w-6 h-6 text-amber-400 shadow-amber-400" />
      </div>

      <div className="min-h-[120px] flex items-center justify-center mb-8">
        <p className="text-xl font-medium text-white text-center leading-relaxed">
          &quot;{currentRiddle.question}&quot;
        </p>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mb-8" />

      {showAnswer ? (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
           <p className="text-sm font-mono text-amber-500/50 uppercase tracking-widest mb-2">Decrypted Response</p>
           <p className="text-2xl font-bold text-amber-400 mb-8">{currentRiddle.answer}</p>
           
           <div className="flex gap-4 w-full">
               <Button onClick={() => setDifficulty(null)} variant="secondary" className="flex-1">Change Class</Button>
               <Button onClick={nextRiddle} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">Next Sequence</Button>
           </div>
        </div>
      ) : (
        <Button 
           onClick={() => setShowAnswer(true)} 
           className="w-full py-6 bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-400 group relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Fingerprint className="w-5 h-5 mr-3 opacity-50" />
            Reveal Truth
        </Button>
      )}
    </div>
  );
}
