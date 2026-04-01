'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const IQ_QUESTIONS: Record<Difficulty, Question[]> = {
  easy: [
    { id: 1, question: "What is the next number in the sequence? 2, 4, 6, 8, ...", options: ["9", "10", "11", "12"], correctAnswer: 1 },
    { id: 2, question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?", options: ["Yes", "No", "Cannot be determined"], correctAnswer: 0 },
    { id: 3, question: "Which word does not belong?", options: ["Apple", "Banana", "Carrot", "Cherry"], correctAnswer: 2 },
  ],
  medium: [
    { id: 4, question: "What is the next number? 1, 1, 2, 3, 5, 8, ...", options: ["11", "12", "13", "14"], correctAnswer: 2 },
    { id: 5, question: "Book is to Reading as Fork is to...", options: ["Steak", "Eating", "Kitchen", "Silverware"], correctAnswer: 1 },
    { id: 6, question: "If you rearrange the letters 'CIFAIPC', you would have the name of a(n)...", options: ["City", "Animal", "Ocean", "River"], correctAnswer: 2 }, // Pacific
  ],
  hard: [
    { id: 7, question: "Which number replaces the question mark? 2, 3, 5, 9, 17, ?", options: ["31", "33", "34", "35"], correctAnswer: 1 }, // diffs: 1, 2, 4, 8, 16 -> 17+16=33
    { id: 8, question: "Mary, who is sixteen years old, is four times as old as her brother. How old will Mary be when she is twice as old as her brother?", options: ["20", "24", "28", "32"], correctAnswer: 1 }, // brother is 4. diff is 12. 24 and 12.
    { id: 9, question: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?", options: ["$0.01", "$0.05", "$0.10", "$1.00"], correctAnswer: 1 },
  ]
};

export default function IQTest() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const startTest = (diff: Difficulty) => {
    setDifficulty(diff);
    setCurrentQuestionIdx(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setShowResult(false);
  };

  const handleAnswer = (optionIdx: number) => {
    if (showResult) return;
    
    setSelectedOption(optionIdx);
    setShowResult(true);

    const questions = IQ_QUESTIONS[difficulty!];
    const isCorrect = optionIdx === questions[currentQuestionIdx].correctAnswer;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(idx => idx + 1);
        setSelectedOption(null);
        setShowResult(false);
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  const reset = () => {
    setDifficulty(null);
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 rounded-2xl border border-teal-500/20 backdrop-blur-md">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-6 font-mono tracking-widest uppercase">Select Intelligence Level</h3>
        <div className="flex gap-4">
          <Button onClick={() => startTest('easy')} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/50">Initiate Level 1</Button>
          <Button onClick={() => startTest('medium')} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-500/50">Initiate Level 2</Button>
          <Button onClick={() => startTest('hard')} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 border border-rose-500/50">Initiate Level 3</Button>
        </div>
      </div>
    );
  }

  const questions = IQ_QUESTIONS[difficulty];

  if (isFinished) {
    const percentage = (score / questions.length) * 100;
    let rank = 'Novice';
    if (percentage === 100) rank = 'S-Tier Intellect';
    else if (percentage > 60) rank = 'Advanced Cognitive';

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-teal-500/20 backdrop-blur-md animate-in zoom-in-95 duration-500 w-full max-w-md mx-auto text-center">
        <h3 className="text-3xl font-bold text-neon mb-2">Test Complete</h3>
        <p className="text-teal-400 font-mono text-xl mb-6">Score: {score} / {questions.length}</p>
        
        <div className="relative mb-8 p-6 rounded-full border border-dashed border-teal-500/50">
           <div className="absolute inset-[-20%] rounded-full border border-teal-500/20 animate-[spin_8s_linear_infinite]" />
           <p className="text-2xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">{rank}</p>
        </div>

        <Button onClick={reset} variant="secondary" className="w-full">
          Retake Assessment
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="flex flex-col p-6 bg-slate-900/50 rounded-2xl border border-teal-500/20 backdrop-blur-md w-full max-w-md mx-auto">
       <div className="flex justify-between items-center mb-6">
         <span className="text-xs font-mono text-teal-400 uppercase tracking-widest">Question {currentQuestionIdx + 1}/{questions.length}</span>
         <span className="text-xs font-mono text-slate-500 uppercase">Class: {difficulty}</span>
       </div>

       <h4 className="text-xl font-medium text-white mb-8">{currentQ.question}</h4>

       <div className="space-y-3">
         {currentQ.options.map((opt, idx) => {
           let stateClass = "bg-slate-800/50 border-slate-700 hover:border-teal-500/50 text-slate-300";
           
           if (showResult) {
             if (idx === currentQ.correctAnswer) {
               stateClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"; // Correct
             } else if (idx === selectedOption) {
               stateClass = "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]"; // Incorrect guess
             } else {
               stateClass = "bg-slate-800/30 border-slate-800 text-slate-500 opacity-50"; // Neutral unselected
             }
           } else if (idx === selectedOption) {
             stateClass = "bg-teal-500/20 border-teal-500 text-white"; // Just selected, before result shows (instant)
           }

           return (
             <button 
               key={idx}
               onClick={() => handleAnswer(idx)}
               disabled={showResult}
               className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 ${stateClass}`}
             >
               <span className="font-mono mr-3 opacity-50">{String.fromCharCode(65 + idx)}.</span>
               {opt}
             </button>
           );
         })}
       </div>
    </div>
  );
}
