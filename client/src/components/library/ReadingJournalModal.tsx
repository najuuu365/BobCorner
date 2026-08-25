import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { BookOpen, Star, Plus, Trash2, Heart } from 'lucide-react';
import { Book, ReadingJournalEntry } from '../../types';
import { journalApi } from '../../services/journalApi';
import { useToast } from '../../context/ToastContext';

interface ReadingJournalModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingJournalModal: React.FC<ReadingJournalModalProps> = ({ book, isOpen, onClose }) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<ReadingJournalEntry[]>([]);
  const [thoughts, setThoughts] = useState('');
  const [favoriteCharacter, setFavoriteCharacter] = useState('');
  const [promptAnswer, setPromptAnswer] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const loadEntries = async () => {
    try {
      const all = await journalApi.getEntries();
      if (book) {
        setEntries(all.filter((e) => e.bookId === book.id));
      } else {
        setEntries(all);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen, book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !thoughts) return;

    setLoading(true);
    try {
      await journalApi.createEntry({
        bookId: book.id,
        thoughts,
        favoriteCharacter: favoriteCharacter || undefined,
        rating,
        promptAnswersJson: promptAnswer ? JSON.stringify({ surprise: promptAnswer }) : undefined,
      });
      showToast('Journal entry saved!', 'success');
      setThoughts('');
      setFavoriteCharacter('');
      setPromptAnswer('');
      loadEntries();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reading Journal — ${book.title}`} maxWidth="xl">
      <div className="space-y-6">
        {/* Create Entry Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-haven-50 dark:bg-slate-800 rounded-2xl border border-haven-200 dark:border-slate-700 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            New Journal Reflection
          </span>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              What are your thoughts on this reading session?
            </label>
            <textarea
              rows={3}
              placeholder="Reflect on key themes, chapter developments, or emotions..."
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Favorite Character So Far"
              placeholder="e.g. Elizabeth Bennet"
              value={favoriteCharacter}
              onChange={(e) => setFavoriteCharacter(e.target.value)}
            />

            <Input
              label="What Surprised You?"
              placeholder="Plot twists, vivid imagery..."
              value={promptAnswer}
              onChange={(e) => setPromptAnswer(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 font-semibold mr-1">Session Rating:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>

            <Button size="sm" variant="primary" type="submit" disabled={loading}>
              Save Reflection
            </Button>
          </div>
        </form>

        {/* Existing Journal Entries List */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          <h4 className="font-serif font-semibold text-sm text-slate-900 dark:text-white">
            Past Journal Entries ({entries.length})
          </h4>

          {entries.map((entry) => (
            <div key={entry.id} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-haven-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                {entry.rating ? <span>★ {entry.rating} / 5</span> : null}
              </div>

              <p className="font-serif text-slate-800 dark:text-slate-200">{entry.thoughts}</p>

              {entry.favoriteCharacter && (
                <Badge variant="primary" size="sm">
                  Fav Character: {entry.favoriteCharacter}
                </Badge>
              )}
            </div>
          ))}

          {entries.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No journal entries written for this book yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
