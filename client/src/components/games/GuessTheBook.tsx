import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trophy, HelpCircle, CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

interface TriviaQuestion {
  id: number;
  clueType: 'Plot' | 'Character' | 'Setting';
  clueText: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    clueType: 'Plot',
    clueText: 'A mysterious millionaire throws extravagant parties on Long Island, hoping to reunite with his lost love Daisy Buchanan.',
    question: 'Name this famous 1925 American novel:',
    options: ['The Great Gatsby', 'To Kill a Mockingbird', 'The Catcher in the Rye', 'Of Mice and Men'],
    answer: 'The Great Gatsby',
    explanation: 'F. Scott Fitzgerald’s magnum opus exploring wealth, love, and illusion in the Jazz Age.',
  },
  {
    id: 2,
    clueType: 'Character',
    clueText: 'Elizabeth Bennet, a quick-witted young woman, initially despises the proud and aristocratic Mr. Darcy.',
    question: 'Which Regency masterpiece features these characters?',
    options: ['Sense and Sensibility', 'Pride and Prejudice', 'Jane Eyre', 'Wuthering Heights'],
    answer: 'Pride and Prejudice',
    explanation: 'Written by Jane Austen, published in 1813.',
  },
  {
    id: 3,
    clueType: 'Setting',
    clueText: 'A dystopian state called Oceania ruled by Big Brother, where Thought Police monitor every move.',
    question: 'Identify the classic dystopian novel:',
    options: ['Brave New World', 'Fahrenheit 451', '1984', 'The Handmaid’s Tale'],
    answer: '1984',
    explanation: 'George Orwell’s chilling warning against totalitarianism.',
  },
];

export const GuessTheBook: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    gamesApi.getScores().then(({ stats }) => {
      const s = stats.find((st) => st.gameKey === 'guess_book');
      if (s) setHighScore(s.bestScore);
    }).catch(() => {});
  }, []);

  const q = TRIVIA_QUESTIONS[currentIndex];

  const handleSelect = (opt: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);

    const isCorrect = opt === q.answer;
    if (isCorrect) {
      const newScore = score + 150;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

      if (newScore > highScore) {
        setHighScore(newScore);
        gamesApi.saveScore('guess_book', newScore, true).catch(() => {});
      }
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setCurrentIndex((prev) => (prev + 1) % TRIVIA_QUESTIONS.length);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            Guess the Book <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500">Read the clues and identify the classic book!</p>
        </div>

        <Badge variant="primary">🔥 Streak: {streak}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{score}</p>
        </Card>
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" /> High Score
          </span>
          <p className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400">{highScore}</p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-1">
          <Badge size="sm" variant="info">Clue Category: {q.clueType}</Badge>
          <p className="font-serif text-sm text-slate-800 dark:text-slate-200 pt-2 leading-relaxed italic">
            "{q.clueText}"
          </p>
        </div>

        <p className="text-sm font-semibold text-slate-900 dark:text-white">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === q.answer;

            let style = 'border-haven-200 dark:border-slate-800 hover:bg-haven-100/80';
            if (selectedOption !== null) {
              if (isCorrect) style = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
              else if (isSelected) style = 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200';
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={selectedOption !== null}
                className={`w-full p-3 rounded-xl border text-sm text-left font-medium transition-all flex items-center justify-between ${style}`}
              >
                <span>{opt}</span>
                {selectedOption !== null && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                {selectedOption !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <div className="pt-3 border-t border-haven-100 dark:border-slate-800 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-haven-50 dark:bg-slate-800 p-3 rounded-xl">
              💡 {q.explanation}
            </p>
            <Button variant="primary" className="w-full" onClick={handleNext}>
              Next Book Clue →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
