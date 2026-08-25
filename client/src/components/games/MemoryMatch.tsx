import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RotateCcw, Clock, Trophy, Sparkles } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

const ALL_ICONS = ['📚', '📖', '📜', '🎨', '☕', '🕯️', '👑', '🌟', '🔮', '🏰', '🌱', '🔑'];

interface CardItem {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatch: React.FC = () => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [bestMoves, setBestMoves] = useState(0);

  const pairsCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;

  const initGame = useCallback(() => {
    const selectedIcons = ALL_ICONS.slice(0, pairsCount);
    const deck = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({
        id,
        icon,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setWon(false);
  }, [pairsCount]);

  useEffect(() => {
    initGame();
    gamesApi.getScores().then(({ stats }) => {
      const s = stats.find((st) => st.gameKey === 'memory');
      if (s) setBestMoves(s.bestScore);
    }).catch(() => {});
  }, [initGame]);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !won) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, won]);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

    if (!isTimerRunning) setIsTimerRunning(true);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (newCards[firstIdx].icon === newCards[secondIdx].icon) {
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);

        // Check if all matched
        if (newCards.every((c) => c.isMatched)) {
          setWon(true);
          setIsTimerRunning(false);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          const finalScore = Math.max(1, 500 - moves * 10 - timerSeconds);
          gamesApi.saveScore('memory', finalScore, true).catch(() => {});
        }
      } else {
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header & Difficulty selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            Memory Match <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500">Flip cards and match pairs!</p>
        </div>

        <div className="flex gap-1 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all ${
                difficulty === diff ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Moves</span>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{moves}</p>
        </Card>
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> Time
          </span>
          <p className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400">{timerSeconds}s</p>
        </Card>
      </div>

      {/* Card Grid */}
      <div
        className={`grid gap-3 p-3 bg-slate-900 rounded-2xl border border-slate-800 ${
          difficulty === 'hard' ? 'grid-cols-4' : 'grid-cols-4'
        }`}
      >
        {cards.map((card, idx) => (
          <motion.div
            key={card.id}
            onClick={() => handleCardClick(idx)}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center text-2xl select-none transition-all duration-300 border ${
              card.isFlipped || card.isMatched
                ? 'bg-amber-100 dark:bg-slate-800 border-amber-400 shadow-md'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {card.isFlipped || card.isMatched ? card.icon : '❓'}
          </motion.div>
        ))}
      </div>

      {won && (
        <Card className="p-4 text-center space-y-2 bg-emerald-500/10 border-emerald-500/30">
          <h3 className="font-serif font-bold text-lg text-emerald-900 dark:text-emerald-300">
            🎉 All Pairs Matched!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Completed in <strong>{moves} moves</strong> and <strong>{timerSeconds} seconds</strong>.
          </p>
          <Button variant="primary" size="sm" onClick={initGame} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Play Again
          </Button>
        </Card>
      )}

      <div className="text-right">
        <button onClick={initGame} className="text-xs text-slate-400 hover:underline flex items-center gap-1 ml-auto">
          <RotateCcw className="w-3.5 h-3.5" /> Reset Board
        </button>
      </div>
    </div>
  );
};
