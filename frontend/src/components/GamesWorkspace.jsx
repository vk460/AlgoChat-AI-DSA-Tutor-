import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Bug, Zap, Sword, Construction, ArrowLeft, Trophy } from 'lucide-react';

const GAMES = [
  { id: 'debug', title: 'Bug Hunter', icon: Bug, description: 'Find the one logical bug hidden in the code.', color: '#ef4444' },
  { id: 'trace', title: 'Trace Master', icon: Zap, description: 'What will be the final output of this program?', color: '#3b82f6' },
  { id: 'complexity', title: 'Big O Battle', icon: Zap, description: 'Identify time and space complexity instantly.', color: '#8b5cf6' },
  { id: 'battle', title: 'Concept Battle', icon: Sword, description: 'True/False speed round for DSA concepts.', color: '#f59e0b' },
  { id: 'build', title: 'Algo Builder', icon: Construction, description: 'Arrange code blocks to solve the problem.', color: '#10b981' }
];

const GamesWorkspace = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const startGame = async (gameId) => {
    setSelectedGame(gameId);
    // Mock challenge generation
    setCurrentChallenge({
      code: "def binary_search(arr, x):\n  low = 0\n  high = len(arr)\n  while low <= high:\n    mid = (high + low) // 2\n    if arr[mid] < x:\n      low = mid + 1\n    elif arr[mid] > x:\n      high = mid - 1\n    else:\n      return mid\n  return -1",
      question: "Which line has a potential index error?",
      options: ["low = 0", "high = len(arr)", "low <= high", "return mid"],
      correct: 1
    });
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center text-center mb-4">
        <h2 className="text-3xl font-display font-bold neon-text">Algo Games Hub</h2>
        <p className="text-muted-foreground">Level up your DSA skills through play.</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div 
            key="hub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {GAMES.map((game) => (
              <motion.div 
                key={game.id}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => startGame(game.id)}
                className="glass-panel p-8 flex flex-col items-center text-center cursor-pointer group hover:border-primary/50 transition-all"
              >
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 group-hover:scale-110 transition-transform">
                  <game.icon size={48} color={game.color} />
                </div>
                <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{game.description}</p>
                <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-sm font-semibold transition-colors">
                  Play Now
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="challenge"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel-strong p-8 max-w-4xl mx-auto w-full"
          >
            <button className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors" onClick={() => setSelectedGame(null)}>
              <ArrowLeft size={18} /> Back to Hub
            </button>
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{GAMES.find(g => g.id === selectedGame).title}</h2>
              <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30 text-sm font-bold">
                <Trophy size={14} /> Level 1
              </div>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-white/10 mb-8 font-mono text-sm leading-relaxed overflow-x-auto">
              <pre className="text-blue-300"><code>{currentChallenge?.code}</code></pre>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">{currentChallenge?.question}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentChallenge?.options.map((opt, i) => (
                  <button 
                    key={i} 
                    className={`p-4 rounded-xl text-left border transition-all ${
                      feedback === i 
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
                    }`}
                    onClick={() => setFeedback(i)}
                  >
                    <span className="inline-block w-6 h-6 rounded-md bg-white/5 flex items-center justify-center mr-3 text-xs">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {feedback !== null && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                  {feedback === currentChallenge.correct ? 
                    <p className="text-success font-bold text-lg mb-4 flex items-center gap-2">✨ Brilliant! +50 XP Awarded</p> : 
                    <p className="text-destructive font-bold text-lg mb-4">❌ Not quite. Look closer at the loop condition!</p>
                  }
                  <button className="px-8 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg" onClick={() => setFeedback(null)}>
                    Next Challenge
                  </button>
               </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamesWorkspace;
