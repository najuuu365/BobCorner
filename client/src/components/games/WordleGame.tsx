import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RotateCcw, Trophy, Flame, Delete, Check } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

const WORD_LIST = [
  'BOOKS', 'NOVEL', 'PROSE', 'STORY', 'WRITE', 'POEM', 'DREAM',
  'FOLIO', 'PAPER', 'SHELF', 'BOUND', 'TALE', 'GUILD', 'EMBER',
  'CROWN', 'HAVEN', 'CHALK', 'CANVAS', 'REALM', 'FAIRE'
];

export const WordleGame: React.FC = () => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const initGame = useCallback(() => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    initGame();
    gamesApi.getScores().then(({ stats }) => {
      const s = stats.find((st) => st.gameKey === 'wordle');
      if (s) {
        setStreak(s.currentStreak);
        setHighScore(s.bestScore);
      }
    }).catch(() => {});
  }, [initGame]);

  const handleKeyPress = useCallback((key: string) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (currentGuess === targetWord) {
          setWon(true);
          setGameOver(true);
          const newStreak = streak + 1;
          setStreak(newStreak);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          gamesApi.saveScore('wordle', 100 * newStreak, true).catch(() => {});
        } else if (newGuesses.length >= 6) {
          setGameOver(true);
          setStreak(0);
          gamesApi.saveScore('wordle', 0, false).catch(() => {});
        }
      }
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + key);
    }
  }, [currentGuess, gameOver, guesses, targetWord, streak]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE') {
        handleKeyPress(key);
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getLetterStatus = (letter: string, index: number, word: string) => {
    if (word[index] === letter) return 'correct'; // Green
    if (targetWord.includes(letter)) return 'present'; // Yellow
    return 'absent'; // Gray
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Stats header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
            Word Sleuth (Literary Wordle)
          </h2>
          <p className="text-xs text-slate-500">Guess the 5-letter word in 6 tries!</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl">
            <Flame className="w-3.5 h-3.5" /> {streak} Streak
          </span>
        </div>
      </div>

      {/* Wordle Grid (6 rows of 5 letters) */}
      <div className="grid grid-rows-6 gap-2 w-full max-w-xs mx-auto">
        {Array.from({ length: 6 }).map((_, r) => {
          const guess = guesses[r] || (r === guesses.length ? currentGuess : '');
          const isSubmitted = r < guesses.length;

          return (
            <div key={r} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, c) => {
                const char = guess[c] || '';
                let statusClass = 'border-haven-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white';

                if (isSubmitted) {
                  const status = getLetterStatus(char, c, guess);
                  if (status === 'correct') statusClass = 'bg-emerald-600 border-emerald-600 text-white font-bold';
                  else if (status === 'present') statusClass = 'bg-amber-500 border-amber-500 text-white font-bold';
                  else statusClass = 'bg-slate-400 dark:bg-slate-700 border-slate-400 text-white';
                }

                return (
                  <div
                    key={c}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center font-mono text-xl font-bold uppercase transition-all shadow-2xs ${statusClass}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Game Over Message */}
      {gameOver && (
        <Card className="p-4 text-center space-y-2 bg-haven-100 dark:bg-slate-800">
          <p className="font-serif font-bold text-base text-slate-900 dark:text-white">
            {won ? '🎉 Excellent Deduction!' : `Word was: ${targetWord}`}
          </p>
          <Button variant="primary" size="sm" onClick={initGame} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Play Next Word
          </Button>
        </Card>
      )}

      {/* Virtual On-Screen Keyboard */}
      <div className="space-y-1.5 pt-2">
        {keyboardRows.map((row, idx) => (
          <div key={idx} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`h-11 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center ${
                  key.length > 1 ? 'px-3 bg-haven-200 dark:bg-slate-800' : 'w-8 bg-haven-100 dark:bg-slate-800'
                } text-slate-800 dark:text-slate-200 hover:bg-amber-500 hover:text-white`}
              >
                {key === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
