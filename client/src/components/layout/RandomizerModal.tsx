import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Sparkles, BookOpen, Quote, Gamepad2, RefreshCw } from 'lucide-react';
import { booksApi } from '../../services/booksApi';
import { BookCover } from '../library/BookCover';
import { Book, BookQuote } from '../../types';
import { useNavigate } from 'react-router-dom';

interface RandomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RandomizerModal: React.FC<RandomizerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'quote' | 'challenge'>('book');
  const [randomBook, setRandomBook] = useState<Book | null>(null);
  const [randomQuote, setRandomQuote] = useState<BookQuote | null>(null);
  const [challenge, setChallenge] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const challenges = [
    '🏆 Complete a 25-minute Pomodoro focus session without checking your phone!',
    '🎮 Reach the "Chapter" (16) tile in 2048 using the Literary Theme!',
    '📖 Read 15 pages of any book in your digital library today.',
    '🧠 Solve 3 rounds of the Literary Word Sleuth puzzle.',
    '✍️ Write a quick personal note or favorite quote in your digital notebook.',
  ];

  const pickRandom = async (type: 'book' | 'quote' | 'challenge') => {
    setActiveTab(type);
    setLoading(true);
    try {
      if (type === 'book') {
        const books = await booksApi.getBooks();
        if (books.length > 0) {
          const randomIndex = Math.floor(Math.random() * books.length);
          setRandomBook(books[randomIndex]);
        }
      } else if (type === 'quote') {
        const quotes = await booksApi.getQuotes();
        if (quotes.length > 0) {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          setRandomQuote(quotes[randomIndex]);
        }
      } else {
        const randomIndex = Math.floor(Math.random() * challenges.length);
        setChallenge(challenges[randomIndex]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      pickRandom('book');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Random Spark & Recommendation" maxWidth="md">
      <div className="space-y-5">
        <div className="flex gap-2 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => pickRandom('book')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'book' ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Random Book
          </button>
          <button
            onClick={() => pickRandom('quote')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'quote' ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            Random Quote
          </button>
          <button
            onClick={() => pickRandom('challenge')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'challenge' ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Mini Challenge
          </button>
        </div>

        {/* Content Box */}
        <div className="min-h-[160px] flex items-center justify-center p-6 bg-haven-50/60 dark:bg-slate-800/60 rounded-2xl border border-haven-200/80 dark:border-slate-700 text-center">
          {loading ? (
            <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
          ) : activeTab === 'book' && randomBook ? (
            <div className="space-y-3">
              <div className="w-16 h-24 mx-auto rounded-lg overflow-hidden shadow-md">
                <BookCover title={randomBook.title} coverUrl={randomBook.coverUrl} className="w-full h-full" />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-base text-slate-900 dark:text-white">{randomBook.title}</h4>
                <p className="text-xs text-slate-500">{randomBook.author}</p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate('/library');
                }}
              >
                View in Bookshelf
              </Button>
            </div>
          ) : activeTab === 'quote' && randomQuote ? (
            <div className="space-y-2">
              <p className="font-serif italic text-base text-slate-800 dark:text-slate-200">
                "{randomQuote.quote}"
              </p>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">— {randomQuote.author}</p>
            </div>
          ) : activeTab === 'challenge' && challenge ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {challenge}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Click the button below to generate a random spark!</p>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={() => pickRandom(activeTab)} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
