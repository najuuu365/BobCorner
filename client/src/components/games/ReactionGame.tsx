import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Zap, RotateCcw, Trophy, Clock } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

type GameState = 'idle' | 'waiting' | 'ready' | 'too_early' | 'finished';

export const ReactionGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const startTest = () => {
    setGameState('waiting');
    const delay = 2000 + Math.random() * 3000; // 2 to 5 seconds

    timerRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      clearTimeout(timerRef.current);
      setGameState('too_early');
    } else if (gameState === 'ready') {
      const elapsed = Date.now() - startTimeRef.current;
      setReactionTime(elapsed);
      setGameState('finished');
      const newHistory = [...history, elapsed];
      setHistory(newHistory);

      if (!bestTime || elapsed < bestTime) {
        setBestTime(elapsed);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      // Save reaction score (higher is better for 2048/score model, so convert ms to score: e.g., 10000 - elapsed)
      const scoreValue = Math.max(1, 1000 - elapsed);
      gamesApi.saveScore('reaction', scoreValue, true, undefined, { reactionTimeMs: elapsed }).catch(() => {});
    }
  };

  const averageTime = history.length > 0 ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : null;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
          Reaction Time Test <Zap className="w-4 h-4 text-amber-500" />
        </h2>
        <p className="text-xs text-slate-500">Test your reflex speed in milliseconds!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Best Speed</span>
          <p className="font-mono text-2xl font-bold text-amber-600">{bestTime ? `${bestTime} ms` : '—'}</p>
        </Card>
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Average Speed</span>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{averageTime ? `${averageTime} ms` : '—'}</p>
        </Card>
      </div>

      {/* Main Interactive Trigger Canvas Box */}
      <div
        onClick={gameState === 'idle' || gameState === 'too_early' || gameState === 'finished' ? startTest : handleClick}
        className={`w-full aspect-video rounded-2xl cursor-pointer flex flex-col items-center justify-center p-6 text-center select-none shadow-xl border transition-all ${
          gameState === 'idle'
            ? 'bg-amber-600 border-amber-700 text-white'
            : gameState === 'waiting'
            ? 'bg-rose-600 border-rose-700 text-white'
            : gameState === 'ready'
            ? 'bg-emerald-500 border-emerald-600 text-white font-bold animate-pulse'
            : gameState === 'too_early'
            ? 'bg-amber-700 border-amber-800 text-white'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {gameState === 'idle' && (
          <>
            <Zap className="w-10 h-10 mb-2" />
            <h3 className="font-serif font-bold text-xl">Click to Start</h3>
            <p className="text-xs opacity-80 mt-1">When the box turns green, click as fast as you can!</p>
          </>
        )}

        {gameState === 'waiting' && (
          <>
            <Clock className="w-10 h-10 mb-2 animate-spin" />
            <h3 className="font-serif font-bold text-xl">Wait for Green...</h3>
          </>
        )}

        {gameState === 'ready' && (
          <>
            <Zap className="w-12 h-12 mb-2 scale-125" />
            <h3 className="font-serif font-extrabold text-3xl uppercase tracking-wider">CLICK NOW!</h3>
          </>
        )}

        {gameState === 'too_early' && (
          <>
            <h3 className="font-serif font-bold text-xl">Too Soon! 😅</h3>
            <p className="text-xs opacity-80 mt-1">You clicked before it turned green. Click to retry.</p>
          </>
        )}

        {gameState === 'finished' && (
          <>
            <span className="font-mono text-5xl font-bold text-amber-400">{reactionTime} ms</span>
            <p className="text-xs opacity-80 mt-2">Click to test your reaction speed again.</p>
          </>
        )}
      </div>
    </div>
  );
};
