import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RotateCcw, Trophy, Timer, Zap, Brain } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

type Difficulty = 'easy' | 'medium' | 'hard' | 'chaos';
type Rule = 'color' | 'word';

type ColorOption = {
  name: string;
  hex: string;
};

const COLORS: ColorOption[] = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
];

const DIFFICULTY_CONFIG = {
  easy: {
    roundTime: 4.5,
    gameTime: 45,
    colorCount: 4,
  },
  medium: {
    roundTime: 3.5,
    gameTime: 45,
    colorCount: 4,
  },
  hard: {
    roundTime: 2.4,
    gameTime: 40,
    colorCount: 6,
  },
  chaos: {
    roundTime: 1.5,
    gameTime: 30,
    colorCount: 10,
  },
};

const RULE_TEXT: Record<Rule, string> = {
  color: 'FOLLOW THE COLOR',
  word: 'FOLLOW THE WORD',
};

export const ColorTrapGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [rule, setRule] = useState<Rule>('color');

  const [wordColor, setWordColor] = useState<ColorOption>(COLORS[0]);
  const [displayWord, setDisplayWord] = useState<ColorOption>(COLORS[1]);

  const [options, setOptions] = useState<ColorOption[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const [timeLeft, setTimeLeft] = useState(
    DIFFICULTY_CONFIG.medium.gameTime
  );

  const [roundTimeLeft, setRoundTimeLeft] = useState(
    DIFFICULTY_CONFIG.medium.roundTime
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [chaosBackground, setChaosBackground] = useState('');

  const [feedback, setFeedback] = useState<
    'correct' | 'wrong' | 'timeout' | null
  >(null);

  const [message, setMessage] = useState('');

  useEffect(() => {
    gamesApi
      .getScores()
      .then(({ scores, stats }) => {
        const gameScore = scores.find(
          (s) => s.gameKey === 'color_trap'
        );

        if (gameScore) {
          setHighScore(gameScore.highScore);
        }

        const gameStats = stats.find(
          (s) => s.gameKey === 'color_trap'
        );

        if (gameStats?.extraStatsJson) {
          try {
            const parsed = JSON.parse(gameStats.extraStatsJson);

            if (typeof parsed.bestStreak === 'number') {
              setBestStreak(parsed.bestStreak);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const shuffle = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const generateChaosBackground = () => {
  const colors = shuffle(COLORS);

  const color1 = colors[0].hex;
  const color2 = colors[1].hex;
  const color3 = colors[2].hex;

  setChaosBackground(
    `linear-gradient(
      ${Math.floor(Math.random() * 360)}deg,
      ${color1},
      ${color2},
      ${color3}
    )`
  );
};

  const generateRound = () => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const availableColors = shuffle(COLORS).slice(
      0,
      config.colorCount
    );

    let newWordColor =
      availableColors[
        Math.floor(Math.random() * availableColors.length)
      ];

    let newDisplayWord =
      availableColors[
        Math.floor(Math.random() * availableColors.length)
      ];

    while (
      availableColors.length > 1 &&
      newDisplayWord.name === newWordColor.name
    ) {
      newDisplayWord =
        availableColors[
          Math.floor(Math.random() * availableColors.length)
        ];
    }

    let newRule: Rule;

    if (difficulty === 'easy') {
      newRule = Math.random() > 0.3 ? 'color' : 'word';
    } else if (difficulty === 'medium') {
      newRule = Math.random() > 0.5 ? 'color' : 'word';
    } else {
      newRule = Math.random() > 0.5 ? 'color' : 'word';
    }

    setRule(newRule);
setWordColor(newWordColor);
setDisplayWord(newDisplayWord);
setOptions(shuffle(availableColors));

if (difficulty === 'chaos') {
  generateChaosBackground();
}

setRoundTimeLeft(config.roundTime);
setFeedback(null);
setMessage('');
  };

  const startGame = () => {
    const config = DIFFICULTY_CONFIG[difficulty];

    setScore(0);
    setStreak(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);

    setTimeLeft(config.gameTime);
    setRoundTimeLeft(config.roundTime);

    setGameOver(false);
    setIsPlaying(true);

    generateRound();
  };

  const endGame = (
    finalScore = score,
    finalCorrect = correctAnswers,
    finalWrong = wrongAnswers,
    finalBestStreak = Math.max(bestStreak, streak)
  ) => {
    setIsPlaying(false);
    setGameOver(true);

    const accuracy =
      finalCorrect + finalWrong > 0
        ? Math.round(
            (finalCorrect / (finalCorrect + finalWrong)) * 100
          )
        : 0;

    gamesApi
      .saveScore(
        'color_trap',
        finalScore,
        finalScore > 0,
        undefined,
        {
          correctAnswers: finalCorrect,
          wrongAnswers: finalWrong,
          accuracy,
          bestStreak: finalBestStreak,
        }
      )
      .catch(() => {});

    if (finalScore > highScore) {
      setHighScore(finalScore);

      if (finalScore > 0) {
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

    if (timeLeft <= 0) {
      endGame();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 0.1);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    if (!isPlaying) return;

    if (roundTimeLeft <= 0) {
      setWrongAnswers((prev) => prev + 1);
      setStreak(0);

      setFeedback('timeout');
      setMessage('Slowwwww BAHAHA');

      window.setTimeout(() => {
        if (isPlaying) {
          generateRound();
        }
      }, 450);

      return;
    }

    const timer = window.setTimeout(() => {
      setRoundTimeLeft((prev) => prev - 0.1);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isPlaying, roundTimeLeft]);

  const handleAnswer = (option: ColorOption) => {
    if (!isPlaying || feedback) return;

    const correctAnswer =
      rule === 'color' ? wordColor.name : displayWord.name;

    if (option.name === correctAnswer) {
      const newStreak = streak + 1;

      const streakBonus =
        newStreak >= 10
          ? 30
          : newStreak >= 5
          ? 15
          : 0;

      const speedBonus = Math.ceil(roundTimeLeft * 5);

      const points =
        10 +
        streakBonus +
        speedBonus;

      const newScore = score + points;
      const newCorrect = correctAnswers + 1;
      const newBestStreak = Math.max(
        bestStreak,
        newStreak
      );

      setScore(newScore);
      setStreak(newStreak);
      setCorrectAnswers(newCorrect);
      setBestStreak(newBestStreak);

      setFeedback('correct');
      setMessage(`+${points} NICE!`);

      window.setTimeout(() => {
        generateRound();
      }, 300);
    } else {
      const newWrong = wrongAnswers + 1;

      setWrongAnswers(newWrong);
      setStreak(0);

      setFeedback('wrong');
      setMessage('Oooh, would you pass a driving test?');

      window.setTimeout(() => {
        generateRound();
      }, 500);
    }
  };

  const accuracy =
    correctAnswers + wrongAnswers > 0
      ? Math.round(
          (correctAnswers /
            (correctAnswers + wrongAnswers)) *
            100
        )
      : 100;

      

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
            Color Trap 🎭
            <Brain className="w-5 h-5 text-purple-500" />
          </h2>

          <p className="text-sm text-slate-500">
            <span className="line-through">Don't</span> trust your eyes. Follow the rule.
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
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-500'
                } ${
                  isPlaying
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {diff === 'chaos' ? 'ABSOLUTE CHAOS' : diff}
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
            Streak
          </span>

          <p className="font-mono text-xl font-bold text-purple-600">
            {streak}
          </p>
        </Card>

        <Card className="p-3 bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Accuracy
          </span>

          <p className="font-mono text-xl font-bold text-emerald-600">
            {accuracy}%
          </p>
        </Card>

        <Card className="p-3 bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Time
          </span>

          <p className="font-mono text-xl font-bold text-rose-500">
            {Math.ceil(timeLeft)}s
          </p>
        </Card>
      </div>

     <div
  className={`relative min-h-[440px] rounded-3xl overflow-hidden border shadow-xl transition-all duration-300 ${
    difficulty === 'chaos'
      ? 'border-white/40'
      : 'border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-950 dark:via-purple-950/40 dark:to-slate-950'
  }`}
  style={
    difficulty === 'chaos' && chaosBackground
      ? {
          background: chaosBackground,
        }
      : undefined
  }
>
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <motion.div
              animate={{
                rotate: [0, -8, 8, 0],
                scale: [1, 1.08, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="text-7xl mb-5"
            >
              🎭
            </motion.div>

            <h3 className="font-serif font-bold text-3xl text-slate-900 dark:text-white">
              Look twice... or thrice??
            </h3>

            <p className="max-w-sm mt-3 mb-6 text-sm text-slate-500">
              Sometimes follow the color. Sometimes follow the word.
              Your brain has {DIFFICULTY_CONFIG[difficulty].roundTime}s
              to decide.
            </p>

            <Button variant="primary" onClick={startGame}>
              <Zap className="w-4 h-4" />
              Start the Trap
            </Button>

            {highScore > 0 && (
              <div className="mt-5 flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm">
                <Trophy className="w-4 h-4" />
                Best score: {highScore}
              </div>
            )}
          </div>
        )}

        {isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-6 sm:p-10">
            <div className="w-full flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Timer className="w-4 h-4" />
                ROUND: {roundTimeLeft.toFixed(1)}s
              </div>

              <div className="text-slate-400">
                BEST STREAK: {bestStreak}

            <div className="flex items-right gap-2">
                  <Button
                    variant="outline"
                    onClick={() => endGame()}
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
              </div>
            </div>

            <motion.div
              key={`${rule}-${displayWord.name}-${wordColor.name}-${score}`}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="px-5 py-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-black tracking-widest">
                {RULE_TEXT[rule]}
              </div>

              <div
                className="mt-8 text-5xl sm:text-7xl font-black tracking-wider select-none"
                style={{
                  color: wordColor.hex,
                }}
              >
                {displayWord.name}
              </div>

              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className={`mt-6 text-sm font-black ${
                      feedback === 'correct'
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {options.map((option) => (
                <motion.button
                  key={option.name}
                  whileHover={{
                    scale: 1.04,
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  onClick={() => handleAnswer(option)}
                  disabled={!!feedback}
                  className="py-4 rounded-2xl border-2 bg-white dark:bg-slate-900 font-black text-sm tracking-wider shadow-sm transition-all hover:shadow-md disabled:opacity-70"
                  style={{
                    borderColor: option.hex,
                    color: option.hex,
                  }}
                >
                  {option.name}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {gameOver && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
          >
            <div className="text-6xl mb-4">
              {score > 150 ? '🧠' : '🎭'}
            </div>

            <h3 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
              Brain fried?
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              The colors won this round.
            </p>

            <div className="grid grid-cols-3 gap-5 mt-7 mb-7">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Score
                </p>

                <p className="font-mono text-2xl font-bold text-purple-600">
                  {score}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Accuracy
                </p>

                <p className="font-mono text-2xl font-bold text-emerald-600">
                  {accuracy}%
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Best Streak
                </p>

                <p className="font-mono text-2xl font-bold text-amber-500">
                  {bestStreak}
                </p>
              </div>
            </div>

            <Button variant="primary" onClick={startGame}>
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};  