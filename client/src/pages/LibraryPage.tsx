import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { BookDetailModal } from '../components/library/BookDetailModal';
import { AddBookModal } from '../components/library/AddBookModal';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Star, 
  Heart, 
  Grid, 
  Layers, 
  Bookmark, 
  Quote as QuoteIcon 
} from 'lucide-react';
import { booksApi } from '../services/booksApi';
import { Book, BookQuote } from '../types';
import { useNavigate } from 'react-router-dom';
import { BookCover } from '../components/library/BookCover';
import { PerformancePanel } from '../components/ui/PerformancePanel';

export const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'shelf'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingGoal, setReadingGoal] = useState(() => Number(localStorage.getItem('haven_reading_goal')) || 300);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [fetchedBooks, fetchedQuotes] = await Promise.all([
        booksApi.getBooks(),
        booksApi.getQuotes(),
      ]);
      setBooks(fetchedBooks);
      setQuotes(fetchedQuotes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBooks = books.filter((b) => {
    const matchesTab = activeTab === 'ALL' ? true : b.status === activeTab;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.genre && b.genre.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const tabItems = [
    { id: 'ALL', label: 'All Books', count: books.length },
    { id: 'READING', label: 'Currently Reading', count: books.filter((b) => b.status === 'READING').length },
    { id: 'WANT_TO_READ', label: 'Want to Read', count: books.filter((b) => b.status === 'WANT_TO_READ').length },
    { id: 'FINISHED', label: 'Finished', count: books.filter((b) => b.status === 'FINISHED').length },
    { id: 'ON_HOLD', label: 'On Hold', count: books.filter((b) => b.status === 'ON_HOLD').length },
  ];
  const pagesRead = books.reduce((total, book) => total + (book.currentPage || 0), 0);
  const goalProgress = Math.min(100, Math.round((pagesRead / Math.max(1, readingGoal)) * 100));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Personal Digital Library <BookOpen className="w-6 h-6 text-amber-600" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your personal bookshelf, reading history, notes, and favorite quotes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-haven-200 dark:border-slate-800 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-amber-600 text-white' : 'text-slate-400'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('shelf')}
              className={`p-2 rounded-lg text-xs font-semibold ${
                viewMode === 'shelf' ? 'bg-amber-600 text-white' : 'text-slate-400'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Book
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, author, genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-haven-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50"><span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">In progress</span><p className="text-2xl font-mono font-bold mt-1">{books.filter((book) => book.status === 'READING').length}</p></Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"><span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Finished</span><p className="text-2xl font-mono font-bold mt-1">{books.filter((book) => book.status === 'FINISHED').length}</p></Card>
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"><span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Pages read</span><p className="text-2xl font-mono font-bold mt-1">{books.reduce((total, book) => total + (book.currentPage || 0), 0)}</p></Card>
        <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"><span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">Favorite books</span><p className="text-2xl font-mono font-bold mt-1">{books.filter((book) => book.favorite).length}</p></Card>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div><h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Reading goal</h3><p className="text-xs text-slate-500">Track pages read across your local bookshelf.</p></div>
          <label className="text-xs text-slate-500 flex items-center gap-2">Pages this goal <input type="number" min="1" value={readingGoal} onChange={(event) => { const value = Math.max(1, Number(event.target.value)); setReadingGoal(value); localStorage.setItem('haven_reading_goal', String(value)); }} className="w-20 rounded-lg border border-haven-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm" /></label>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${goalProgress}%` }} /></div>
        <div className="flex justify-between text-[11px] text-slate-500"><span>{pagesRead} pages read</span><span>{goalProgress}%</span></div>
      </Card>
      <PerformancePanel title="Reading performance report" subtitle="Progress calculated from your local bookshelf." metrics={[
        { label: 'Pages read', value: pagesRead, detail: `of ${readingGoal} goal`, tone: 'sky' },
        { label: 'Finished', value: books.filter((book) => book.status === 'FINISHED').length, detail: 'books completed', tone: 'emerald' },
        { label: 'Reading', value: books.filter((book) => book.status === 'READING').length, detail: 'in progress', tone: 'amber' },
        { label: 'Favorites', value: books.filter((book) => book.favorite).length, detail: 'saved books', tone: 'rose' },
      ]} />

      {/* View Mode 1: Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredBooks.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              onClick={() => {
                setSelectedBook(b);
                setIsDetailOpen(true);
              }}
              className="cursor-pointer space-y-2 group"
            >
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all border border-haven-200/80 dark:border-slate-800 relative bg-haven-100 dark:bg-slate-800">
                <BookCover title={b.title} coverUrl={b.coverUrl} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />

                {b.favorite && (
                  <div className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-md">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}

                {b.filePath && (
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 text-amber-300 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    {b.fileType}
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{b.author}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase tracking-wider">
                    {b.status.replace('_', ' ')}
                  </span>

                  {b.rating && b.rating > 0 ? (
                    <span className="flex items-center text-[11px] font-semibold text-amber-500">
                      ★ {b.rating}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Mode 2: Wooden Shelf View */}
      {viewMode === 'shelf' && (
        <div className="space-y-8 bg-haven-100/60 dark:bg-slate-900/60 p-6 rounded-3xl border border-haven-200 dark:border-slate-800">
          <div className="flex flex-wrap items-end gap-6 border-b-8 border-haven-800 dark:border-amber-900 pb-2 shadow-lg">
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBook(b);
                  setIsDetailOpen(true);
                }}
                className="cursor-pointer group flex flex-col items-center"
              >
                <div className="w-20 h-32 rounded-t-lg overflow-hidden shadow-md group-hover:-translate-y-2 transition-transform duration-200 border-t border-x border-haven-300">
                  <BookCover title={b.title} coverUrl={b.coverUrl} className="w-full h-full" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px] mt-1">
                  {b.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredBooks.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-haven-300 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-200">No books found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or add your first book!</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => setIsAddOpen(true)}>
            Add Book Now
          </Button>
        </div>
      )}

      {/* Quotes Showcase Drawer */}
      {quotes.length > 0 && (
        <div className="pt-6 border-t border-haven-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <QuoteIcon className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">Saved Favorite Quotes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quotes.slice(0, 3).map((q) => (
              <Card key={q.id} className="space-y-2 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60">
                <p className="font-serif italic text-xs text-slate-800 dark:text-slate-200">
                  "{q.quote}"
                </p>
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  — {q.author} {q.sourceBookTitle ? `(${q.sourceBookTitle})` : ''}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={loadData}
      />

      <AddBookModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onRefresh={loadData}
      />
    </div>
  );
};
