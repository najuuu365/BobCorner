import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trophy, HelpCircle, CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

interface Puzzle {
  id: number;
  type: 'emoji' | 'quote';
  clue: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

const PUZZLES: Puzzle[] = [
  {
    id: 1,
    type: 'emoji',
    clue: '🦁 🧙‍♀️ 🚪 ❄️ 👑',
    question: 'Which legendary fantasy novel is represented by these emojis?',
    options: ['The Lion, the Witch and the Wardrobe', 'Harry Potter', 'The Hobbit', 'Alice in Wonderland'],
    answer: 'The Lion, the Witch and the Wardrobe',
    explanation: 'Written by C.S. Lewis in 1950, set in the magical land of Narnia through a wardrobe.',
  },
  {
    id: 2,
    type: 'quote',
    clue: 'Pride & Prejudice — Jane Austen',
    question: 'Complete the quote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a _____."',
    options: ['wife', 'house', 'title', 'estate'],
    answer: 'wife',
    explanation: 'One of the most famous opening lines in English literature.',
  },
  {
    id: 3,
    type: 'emoji',
    clue: '🐳 🌊 🚢 ⚓ 🏴‍☠️',
    question: 'Guess the classic sea novel about Captain Ahab:',
    options: ['Treasure Island', 'Moby-Dick', 'Twenty Thousand Leagues Under the Sea', 'Robinson Crusoe'],
    answer: 'Moby-Dick',
    explanation: 'Herman Melville’s 1851 epic about the obsession with the great white whale.',
  },
  {
    id: 4,
    type: 'quote',
    clue: 'The Great Gatsby — F. Scott Fitzgerald',
    question: 'Complete the quote: "So we beat on, boats against the _____, borne back ceaselessly into the past."',
    options: ['current', 'wind', 'tide', 'storm'],
    answer: 'current',
    explanation: 'The haunting final line of F. Scott Fitzgerald’s classic novel.',
  },
];

export const WordSleuth: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    gamesApi.getScores().then(({ scores }) => {
      const g = scores.find((s: any) => s.gameKey === 'word_sleuth');
      if (g) setHighScore(g.highScore);
    }).catch(() => {});
  }, []);

  const currentPuzzle = PUZZLES[currentIndex];

  const handleGuess = (option: string) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === currentPuzzle.answer;
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 100 + streak * 20;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

      if (newScore > highScore) {
        setHighScore(newScore);
        gamesApi.saveScore('word_sleuth', newScore).catch(() => {});
      }
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setCurrentIndex((prev) => (prev + 1) % PUZZLES.length);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setStreak(0);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            Literary Word Sleuth <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500">Test your book knowledge & quotes!</p>
        </div>

        <Badge variant="primary" size="md">
          🔥 Streak: {streak}
        </Badge>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{score}</p>
        </Card>
        <Card className="p-3 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" /> High Score
          </span>
          <p className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400">{highScore}</p>
        </Card>
      </div>

      {/* Main Puzzle Card */}
      <Card className="space-y-4">
        <div className="p-4 bg-amber-500/10 rounded-xl text-center border border-amber-500/20">
          <span className="text-3xl tracking-widest block py-2">{currentPuzzle.clue}</span>
        </div>

        <h3 className="font-serif font-semibold text-sm text-slate-900 dark:text-white text-center">
          {currentPuzzle.question}
        </h3>

        {/* Options */}
        <div className="space-y-2 pt-2">
          {currentPuzzle.options.map((opt) => {
            const isSelected = selectedOption === opt;
            const isAnswer = opt === currentPuzzle.answer;

            let btnStyle = 'border-haven-200 dark:border-slate-800 hover:bg-haven-100/80';
            if (selectedOption !== null) {
              if (isAnswer) btnStyle = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
              else if (isSelected) btnStyle = 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200';
            }

            return (
              <button
                key={opt}
                onClick={() => handleGuess(opt)}
                disabled={selectedOption !== null}
                className={`w-full p-3 rounded-xl border text-sm text-left font-medium transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {selectedOption !== null && isAnswer && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                {selectedOption !== null && isSelected && !isAnswer && <XCircle className="w-4 h-4 text-rose-600" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {selectedOption !== null && (
          <div className="pt-3 border-t border-haven-100 dark:border-slate-800 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-haven-50 dark:bg-slate-800 p-3 rounded-xl">
              💡 <strong>Did you know?</strong> {currentPuzzle.explanation}
            </p>

            <Button variant="primary" className="w-full" onClick={handleNext}>
              Next Puzzle →
            </Button>
          </div>
        )}
      </Card>

      <div className="text-right">
        <button onClick={handleRestart} className="text-xs text-slate-400 hover:underline inline-flex items-center gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> Restart Game
        </button>
      </div>
    </div>
  );
};
