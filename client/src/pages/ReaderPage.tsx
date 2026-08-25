import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { EpubReader } from '../components/reader/EpubReader';
import { PdfReader } from '../components/reader/PdfReader';
import { ArrowLeft, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { booksApi } from '../services/booksApi';
import { Book } from '../types';

export const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('reader-hud-hidden', !hudVisible);
    return () => document.body.classList.remove('reader-hud-hidden');
  }, [hudVisible]);

  useEffect(() => {
    if (bookId) {
      booksApi
        .getBookById(bookId)
        .then((b) => {
          setBook(b);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [bookId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-slate-400">
        Loading Book Reader...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <p className="text-slate-400 text-sm">Book not found in library.</p>
        <Button variant="primary" onClick={() => navigate('/library')}>
          Return to Bookshelf
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[92vh] flex flex-col p-2 sm:p-4 max-w-7xl mx-auto space-y-3">
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-haven-200 dark:border-slate-800 shadow-xs ${!hudVisible ? 'hidden' : ''}`}>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/library')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Library
          </Button>

          <div className="border-l border-haven-200 dark:border-slate-800 pl-3">
            <h2 className="font-serif font-bold text-sm text-slate-900 dark:text-white truncate max-w-md">
              {book.title}
            </h2>
            <p className="text-[10px] text-slate-400">by {book.author}</p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          title="Toggle Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Reader Engine Viewport */}
      <div className="flex-1 min-h-0">
        {book.filePath && book.fileType === 'EPUB' ? (
          <EpubReader
            url={book.filePath}
            bookId={book.id}
            initialCfi={book.currentCfi || undefined}
            onHudVisibilityChange={setHudVisible}
          />
        ) : book.filePath && book.fileType === 'PDF' ? (
          <PdfReader
            url={book.filePath}
            bookId={book.id}
            initialPage={book.currentPage || 1}
            onHudVisibilityChange={setHudVisible}
          />
        ) : (
          /* Reader Fallback / Demo Preview Reader */
          <div className="h-full bg-white dark:bg-slate-900 rounded-2xl p-8 border border-haven-200 dark:border-slate-800 overflow-y-auto space-y-6 shadow-xl max-w-3xl mx-auto">
            <div className="text-center border-b pb-6 border-haven-100 dark:border-slate-800 space-y-2">
              <span className="text-xs uppercase tracking-widest font-mono text-amber-600 font-bold">
                {book.genre || 'Classic Book'}
              </span>
              <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-white">
                {book.title}
              </h1>
              <p className="text-sm font-medium text-slate-500">by {book.author}</p>
            </div>

            <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 space-y-4 font-serif leading-relaxed">
              <p className="first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-amber-700">
                {book.description ||
                  'The sun had begun its slow descent beyond the rolling hills, casting warm golden light through the tall leaded windows of the quiet sanctuary.'}
              </p>

              <p>
                Reading in a quiet space brings clarity to the mind. Keep exploring your personal library, taking thoughtful notes, and saving memorable passages as you journey through every chapter.
              </p>
            </div>

            <div className="p-4 bg-haven-50 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-500 border border-haven-200 dark:border-slate-700">
              💡 Tip: Upload an <strong>EPUB</strong> or <strong>PDF</strong> file when editing this book in your digital library to unlock full interactive page rendering!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
