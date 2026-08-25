import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RotateCcw, Trophy, Sparkles, Timer } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

type Difficulty = 'easy' | 'medium' | 'hard' | 'chaos';

const TROLL_MESSAGES = [
  'too slow.',
  'nice try.',
  'that was the floor.',
  'you almost had me.',
  'skill issue.',
  'maybe next time.',
  'cat: 1, human: 0.',
  '😼',
];

const DIFFICULTY_CONFIG = {
  easy: {
    points: 10,
    moveInterval: 2200,
    catSize: 'w-20 h-20 text-5xl',
    duration: 30,
  },
  medium: {
    points: 25,
    moveInterval: 1400,
    catSize: 'w-16 h-16 text-4xl',
    duration: 30,
  },
  hard: {
    points: 50,
    moveInterval: 900,
    catSize: 'w-12 h-12 text-3xl',
    duration: 30,
  },
  chaos: {
    points: 100,
    moveInterval: 600,
    catSize: 'w-10 h-10 text-2xl',
    duration: 30,
  },
};

export const CatChaseGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [catPos, setCatPos] = useState({ x: 40, y: 40 });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [caught, setCaught] = useState(0);
  const [misses, setMisses] = useState(0);

  const [totalCatClicks, setTotalCatClicks] = useState(0);
  const [totalMisses, setTotalMisses] = useState(0);

  const [timeLeft, setTimeLeft] = useState(30);

  const [trollMessage, setTrollMessage] = useState<string | null>(null);

  const [catState, setCatState] =
    useState<'idle' | 'happy' | 'smug'>('idle');

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [shakeArena, setShakeArena] = useState(false);

  const moveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    gamesApi
      .getScores()
      .then(({ scores, stats }) => {
        const gameScore = scores.find(
          (s) => s.gameKey === 'cat_chase'
        );

        if (gameScore) {
          setHighScore(gameScore.highScore);
        }

        const gameStats = stats.find(
          (s) => s.gameKey === 'cat_chase'
        );

        if (gameStats?.extraStatsJson) {
          try {
            const parsed = JSON.parse(gameStats.extraStatsJson);

            if (typeof parsed.catClicks === 'number') {
              setTotalCatClicks(parsed.catClicks);
            }

            if (typeof parsed.misses === 'number') {
              setTotalMisses(parsed.misses);
            }
          } catch {
            // Ignore malformed persisted stats
          }
        }
      })
      .catch(() => {});
  }, []);

  const moveCatRandomly = () => {
    const maxX = 82;
    const maxY = 78;

    setCatPos({
      x: Math.floor(Math.random() * maxX) + 2,
      y: Math.floor(Math.random() * maxY) + 2,
    });

    setCatState('idle');
  };

  const startGame = () => {
    if (moveTimerRef.current) {
      clearInterval(moveTimerRef.current);
    }

    setScore(0);
    setCaught(0);
    setMisses(0);
    setTimeLeft(DIFFICULTY_CONFIG[difficulty].duration);

    setGameOver(false);
    setIsPlaying(true);

    setCatState('idle');
    setTrollMessage(null);

    moveCatRandomly();
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);

    if (moveTimerRef.current) {
      clearInterval(moveTimerRef.current);
      moveTimerRef.current = null;
    }

    const won = score > 0;

    gamesApi
      .saveScore(
        'cat_chase',
        score,
        won,
        undefined,
        {
          catClicks: totalCatClicks + caught,
          misses: totalMisses + misses,
        }
      )
      .catch(() => {});

    setTotalCatClicks((prev) => prev + caught);
    setTotalMisses((prev) => prev + misses);

    if (score > highScore) {
      setHighScore(score);

      if (score > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.65 },
        });
      }
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs =
      DIFFICULTY_CONFIG[difficulty].moveInterval;

    moveTimerRef.current = setInterval(() => {
      moveCatRandomly();
    }, intervalMs);

    return () => {
      if (moveTimerRef.current) {
        clearInterval(moveTimerRef.current);
      }
    };
  }, [isPlaying, difficulty]);

  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 0) {
      endGame();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, timeLeft]);

  const handleCatClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (!isPlaying) return;

    const points = DIFFICULTY_CONFIG[difficulty].points;

    setScore((prev) => prev + points);
    setCaught((prev) => prev + 1);

    setCatState('happy');
    setTrollMessage(null);

    moveCatRandomly();
  };

  const handleMissClick = () => {
    if (!isPlaying) return;

    setMisses((prev) => prev + 1);

    setCatState('smug');

    const message =
      TROLL_MESSAGES[
        Math.floor(Math.random() * TROLL_MESSAGES.length)
      ];

    setTrollMessage(message);

    setShakeArena(true);

    window.setTimeout(() => {
      setShakeArena(false);
      setTrollMessage(null);
      moveCatRandomly();
    }, 500);
  };

  

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
            Cat Chase 🐱
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>

          <p className="text-sm text-slate-500">
            Catch the mischievous cat before time runs out.
          </p>
        </div>

        <div className="flex gap-1 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(
            (diff) => (
              <button
                key={diff}
                disabled={isPlaying}
                onClick={() => setDifficulty(diff)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                  difficulty === diff
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                } ${
                  isPlaying
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {diff}
              </button>
            )
          )}
        </div>

      </div>

      <div className="grid grid-cols-4 gap-2 text-center">

        <Card className="p-3 bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Score
          </span>

          <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
            {score}
          </p>
        </Card>

        <Card className="p-3 bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Caught
          </span>

          <p className="font-mono text-xl font-bold text-emerald-600">
            {caught}
          </p>
        </Card>

        <Card className="p-3 bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Misses
          </span>

          <p className="font-mono text-xl font-bold text-rose-500">
            {misses}
          </p>
        </Card>

        <Card className="p-3 bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Time
          </span>

          <p className="font-mono text-xl font-bold text-amber-600">
            {timeLeft}s
          </p>
        </Card>

      </div>

      <motion.div
        animate={
          shakeArena
            ? {
                x: [-8, 8, -6, 6, 0],
              }
            : {
                x: 0,
              }
        }
        transition={{ duration: 0.3 }}
        onClick={handleMissClick}
        className="relative w-full h-[420px] sm:h-[500px] rounded-3xl overflow-hidden cursor-crosshair select-none border-2 border-dashed border-slate-700 dark:border-slate-700 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl"
      >

        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-bold text-slate-300 pointer-events-none">
          <Timer className="w-4 h-4 text-amber-400" />

          <span>
            {isPlaying
              ? 'CATCH THE CAT!'
              : gameOver
              ? 'ROUND COMPLETE'
              : 'READY?'}
          </span>
        </div>

        <div className="absolute top-4 right-4 text-xs font-bold text-amber-400 pointer-events-none">
          {difficulty.toUpperCase()}
        </div>

        <AnimatePresence mode="wait">

          {!isPlaying && !gameOver && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
                className="text-7xl mb-4"
              >
                🐱
              </motion.div>

              <h3 className="font-serif font-bold text-3xl text-white">
                Ready to chase?
              </h3>

              <p className="mt-2 mb-6 max-w-xs text-sm text-slate-400">
                Catch the cat as many times as you can in 30 seconds.
                Don't embarrass yourself.
              </p>

              <Button variant="primary" onClick={startGame}>
                Start Chasing
              </Button>

              {highScore > 0 && (
                <div className="mt-5 flex items-center gap-2 text-amber-400 text-sm">
                  <Trophy className="w-4 h-4" />
                  Best score: {highScore}
                </div>
              )}
            </motion.div>
          )}

          {isPlaying && (
            <motion.button
              key="cat"
              type="button"
              animate={{
                left: `${catPos.x}%`,
                top: `${catPos.y}%`,
                scale:
                  catState === 'happy'
                    ? [1, 1.35, 1]
                    : 1,
              }}
              transition={{
                type: 'spring',
                damping: 15,
                stiffness: 200,
              }}
              onClick={handleCatClick}
              className={`absolute z-10 cursor-pointer flex items-center justify-center ${
                DIFFICULTY_CONFIG[difficulty].catSize
              }`}
              aria-label="Catch the cat"
            >

              <AnimatePresence>
                {trollMessage && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -5,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      y: -32,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="absolute -top-8 whitespace-nowrap bg-white text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-300"
                  >
                    {trollMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="transition-transform hover:scale-125">
                {catState === 'happy'
                  ? '😸'
                  : catState === 'smug'
                  ? '😼'
                  : '🐱'}
              </span>

            </motion.button>
          )}

          {gameOver && (
            <motion.div
              key="game-over"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center bg-slate-950/80 p-6"
            >

              <div className="text-6xl mb-4">
                {score > 0 ? '😸' : '😼'}
              </div>

              <h3 className="font-serif text-3xl font-bold text-white">
                Time's up!
              </h3>

              <p className="mt-2 text-slate-400">
                The cat escaped... for now.
              </p>

              <div className="flex gap-6 mt-6 mb-7">

                <div>
                  <p className="text-xs uppercase text-slate-500">
                    Score
                  </p>

                  <p className="font-mono text-2xl font-bold text-amber-400">
                    {score}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-500">
                    Caught
                  </p>

                  <p className="font-mono text-2xl font-bold text-emerald-400">
                    {caught}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-500">
                    Missed
                  </p>

                  <p className="font-mono text-2xl font-bold text-rose-400">
                    {misses}
                  </p>
                </div>

              </div>

              <Button variant="primary" onClick={startGame}>
                <RotateCcw className="w-4 h-4" />
                Chase Again
              </Button>

            </motion.div>
          )}

        </AnimatePresence>

      </motion.div>
<div className="flex justify-between items-center text-xs text-slate-400">
  <span>Cat Speed: {difficulty.toUpperCase()}</span>

  {isPlaying && (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={endGame}
      >
        Stop
      </Button>

      <Button
        variant="outline"
        onClick={startGame}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Restart
      </Button>
    </div>
  )}
</div>

    </div>
  );
};