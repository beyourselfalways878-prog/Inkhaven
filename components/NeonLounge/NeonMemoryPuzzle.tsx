'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, Zap, Brain, Target, Shield, Infinity as InfinityIcon } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  id: number;
  iconId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [Sparkles, Zap, Brain, Target, Shield, InfinityIcon];

export default function NeonMemoryPuzzle() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const startPuzzle = (diff: Difficulty) => {
    setDifficulty(diff);
    setMoves(0);
    setMatches(0);
    setFlippedIndices([]);
    setIsLocked(false);

    let pairCount = 3; // easy
    if (diff === 'medium') pairCount = 4;
    if (diff === 'hard') pairCount = 6;

    const selectedIcons = ICONS.slice(0, pairCount);
    
    // Ensure iconId is remapped properly after shuffle so pairs match
    const properDeck = [...selectedIcons, ...selectedIcons]
        .map((_, i) => i % pairCount)
        .sort(() => Math.random() - 0.5)
        .map((iconId, id) => ({
            id,
            iconId,
            isFlipped: false,
            isMatched: false
        }));

    setCards(properDeck);
  };

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      const [firstIndex, secondIndex] = newFlippedIndices;
      if (newCards[firstIndex].iconId === newCards[secondIndex].iconId) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setMatches(m => m + 1);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-teal-500/20 backdrop-blur-md">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-6 font-mono tracking-widest uppercase">Synapse Link</h3>
        <p className="text-sm text-slate-400 mb-6">Test your short-term neural retention.</p>
        <div className="flex gap-4">
          <Button onClick={() => startPuzzle('easy')} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/50">3 Pairs</Button>
          <Button onClick={() => startPuzzle('medium')} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-500/50">4 Pairs</Button>
          <Button onClick={() => startPuzzle('hard')} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 border border-rose-500/50">6 Pairs</Button>
        </div>
      </div>
    );
  }

  const isWin = matches === cards.length / 2;
  const gridCols = difficulty === 'easy' ? 'grid-cols-3' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4'; // max 4 cols

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-teal-500/20 backdrop-blur-md w-full max-w-md mx-auto">
      <div className="flex justify-between w-full mb-6 text-sm font-mono uppercase tracking-widest">
        <span className="text-teal-400">Moves: {moves}</span>
        <span className="text-pink-400">Matches: {matches}/{cards.length / 2}</span>
      </div>

      {isWin ? (
        <div className="text-center animate-in zoom-in duration-500 py-12">
          <div className="inline-block p-4 rounded-full bg-teal-500/20 border border-teal-500/50 mb-6 shadow-[0_0_30px_rgba(20,184,166,0.4)]">
             <Brain className="w-12 h-12 text-teal-400" />
          </div>
          <h3 className="text-2xl font-bold text-neon mb-2">Neural Link Established</h3>
          <p className="text-slate-400 mb-8 font-mono">Completed in {moves} sequences.</p>
          <Button onClick={() => setDifficulty(null)} variant="secondary">Run Again</Button>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-3 w-full`}>
          {cards.map((card, idx) => {
            const IconComponent = ICONS[card.iconId];
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 transform preserve-3d cursor-pointer `}
                style={{ perspective: '1000px' }}
              >
                <div 
                   className={`relative w-full h-full rounded-xl transition-transform duration-500 preserve-3d ${isRevealed ? '[transform:rotateY(180deg)]' : ''}`}
                >
                    {/* Front of card (facedown) */}
                    <div className="absolute inset-0 backface-hidden bg-slate-800/80 border border-slate-700 hover:border-teal-500/50 rounded-xl flex items-center justify-center group">
                        <div className="w-4 h-4 rounded-full bg-slate-700 group-hover:bg-teal-500/50 transition-colors duration-300" />
                    </div>

                    {/* Back of card (revealed) */}
                    <div className={`absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-xl flex items-center justify-center
                        ${card.isMatched ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-teal-500/20 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]'}
                    `}>
                        <IconComponent className={`w-8 h-8 ${card.isMatched ? 'text-emerald-400' : 'text-teal-400'}`} />
                    </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
