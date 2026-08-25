  import React, { useState } from 'react';
  import { Modal } from '../ui/Modal';
  import { Button } from '../ui/Button';
  import { Badge } from '../ui/Badge';
  import { BookOpen, Star, Heart, FileText, Quote as QuoteIcon, Plus, Trash2 } from 'lucide-react';
  import { Book, BookNote } from '../../types';
  import { booksApi } from '../../services/booksApi';
  import { useToast } from '../../context/ToastContext';
  import { BookCover } from './BookCover';
  import { useNavigate } from 'react-router-dom';

  interface BookDetailModalProps {
    book: Book | null;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
  }

  export const BookDetailModal: React.FC<BookDetailModalProps> = ({
    book,
    isOpen,
    onClose,
    onRefresh,
  }) => {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'quotes'>('info');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newQuoteText, setNewQuoteText] = useState('');

    if (!book) return null;

    const handleStatusChange = async (status: any) => {
      try {
        await booksApi.updateBook(book.id, { status });
        showToast('Reading status updated', 'success');
        onRefresh();
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    };

    const handleRatingChange = async (rating: number) => {
      try {
        await booksApi.updateBook(book.id, { rating });
        showToast(`Rating set to ${rating} stars`, 'success');
        onRefresh();
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    };

    const handleToggleFavorite = async () => {
      try {
        await booksApi.updateBook(book.id, { favorite: !book.favorite });
        onRefresh();
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    };

    const handleAddNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newNoteContent) return;
      try {
        await booksApi.addNote(book.id, { content: newNoteContent, pageNumber: book.currentPage });
        showToast('Personal note added', 'success');
        setNewNoteContent('');
        onRefresh();
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    };

    const handleAddQuote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newQuoteText) return;
      try {
        await booksApi.addQuote({
          bookId: book.id,
          quote: newQuoteText,
          author: book.author,
          sourceBookTitle: book.title,
          pageNumber: book.currentPage,
          isFavorite: true,
        });
        showToast('Favorite quote saved', 'success');
        setNewQuoteText('');
        onRefresh();
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    };

    const handleDeleteBook = async () => {
      if (confirm('Are you sure you want to remove this book from your library?')) {
        try {
          await booksApi.deleteBook(book.id);
          showToast('Book removed from library', 'info');
          onClose();
          onRefresh();
        } catch (e: any) {
          showToast(e.message, 'error');
        }
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
        <div className="space-y-6">
          {/* Book Header */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-28 h-40 rounded-xl overflow-hidden shadow-lg shrink-0 border border-haven-300 dark:border-slate-700">
              <BookCover title={book.title} coverUrl={book.coverUrl} className="w-full h-full" />
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="primary">{book.genre || 'Classic'}</Badge>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1.5 rounded-full transition-colors ${
                    book.favorite ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${book.favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-white leading-tight">
                {book.title}
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">by {book.author}</p>

              {/* Rating Stars */}
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => handleRatingChange(star)}>
                    <Star
                      className={`w-4 h-4 ${
                        star <= (book.rating || 0)
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Status Picker */}
              <div className="pt-2 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-400">Status:</span>
                {(['WANT_TO_READ', 'READING', 'FINISHED', 'ON_HOLD'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                      book.status === st
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-haven-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-haven-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button to Open Reader */}
          {book.filePath && (
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between">
              <span className="text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" /> Attached File: <strong>{book.fileType}</strong>
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate(`/reader/${book.id}`);
                }}
              >
                Open In Book Reader →
              </Button>
            </div>
          )}

          {/* Tabs for Details, Notes, and Quotes */}
          <div className="flex gap-2 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'info' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'notes' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Personal Notes ({book.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'quotes' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Saved Quotes ({book.quotes?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>{book.description || 'No description added for this book yet.'}</p>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-haven-100 dark:border-slate-800">
                <span>Total Pages: {book.totalPages || 100}</span>
                <span>Current Page: {book.currentPage || 0}</span>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a personal note or thought..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-haven-50 dark:bg-slate-800 border border-haven-300 dark:border-slate-700 rounded-xl"
                />
                <Button size="sm" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Note
                </Button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {book.notes?.map((n) => (
                  <div key={n.id} className="p-3 bg-haven-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                    <p className="text-slate-800 dark:text-slate-200">{n.content}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {(!book.notes || book.notes.length === 0) && (
                  <p className="text-center py-4 text-xs text-slate-400">No notes written for this book yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddQuote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Save a favorite quote..."
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-haven-50 dark:bg-slate-800 border border-haven-300 dark:border-slate-700 rounded-xl"
                />
                <Button size="sm" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
                  Save Quote
                </Button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {book.quotes?.map((q) => (
                  <div key={q.id} className="p-3 bg-amber-500/10 rounded-xl text-xs space-y-1 italic border border-amber-500/20">
                    <p className="text-slate-800 dark:text-slate-200">"{q.quote}"</p>
                  </div>
                ))}
                {(!book.quotes || book.quotes.length === 0) && (
                  <p className="text-center py-4 text-xs text-slate-400">No saved quotes for this book yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-haven-100 dark:border-slate-800">
            <button onClick={handleDeleteBook} className="text-xs text-rose-500 hover:underline flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Remove Book
            </button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  };
