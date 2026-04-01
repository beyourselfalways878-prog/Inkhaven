'use client';

import React, { useState } from 'react';
import IQTest from './IQTest';
import NeonMemoryPuzzle from './NeonMemoryPuzzle';
import RiddleMaster from './RiddleMaster';
import { Brain, Lightbulb, Puzzle } from 'lucide-react';

type GameMode = 'hub' | 'iq' | 'memory' | 'riddles';

export default function MinigameHub() {
  const [activeGame, setActiveGame] = useState<GameMode>('hub');

  if (activeGame === 'hub') {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="grid grid-cols-1 gap-4 w-full">
          {/* Memory Game */}
          <button 
            onClick={() => setActiveGame('memory')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all group backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30 group-hover:shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all">
              <Puzzle className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
            </div>
             <div className="text-left">
                <h4 className="font-bold text-neon tracking-wide uppercase font-mono">Synapse Link</h4>
                <p className="text-xs text-slate-400">Visual Memory Protocol</p>
             </div>
          </button>

          {/* Riddles */}
          <button 
            onClick={() => setActiveGame('riddles')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all">
              <Lightbulb className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
             <div className="text-left">
                <h4 className="font-bold text-neon tracking-wide uppercase font-mono">The Oracle</h4>
                <p className="text-xs text-slate-400">Cryptic Logic Sequences</p>
             </div>
          </button>

          {/* IQ Test */}
          <button 
            onClick={() => setActiveGame('iq')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all group backdrop-blur-md"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30 group-hover:shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all">
              <Brain className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
            </div>
             <div className="text-left">
                <h4 className="font-bold text-neon tracking-wide uppercase font-mono">Cognitive Test</h4>
                <p className="text-xs text-slate-400">Pattern Recognition</p>
             </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setActiveGame('hub')}
          className="text-sm font-mono text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          ← Return to Hub
        </button>
      </div>
      
      {activeGame === 'iq' && <IQTest />}
      {activeGame === 'memory' && <NeonMemoryPuzzle />}
      {activeGame === 'riddles' && <RiddleMaster />}
    </div>
  );
}
