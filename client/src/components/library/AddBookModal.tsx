import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, BookOpen } from 'lucide-react';
import { booksApi } from '../../services/booksApi';
import { useToast } from '../../context/ToastContext';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Classic Fiction');
  const [status, setStatus] = useState<'WANT_TO_READ' | 'READING' | 'FINISHED' | 'ON_HOLD'>('WANT_TO_READ');
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
      showToast('Book title and author are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);
      formData.append('genre', genre);
      formData.append('status', status);

      if (file) {
        formData.append('bookFile', file);
      }
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }

      await booksApi.createBook(formData);
      showToast('Book added to library!', 'success');
      onClose();
      onRefresh();

      // Reset form
      setTitle('');
      setAuthor('');
      setDescription('');
      setFile(null);
      setCoverFile(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to add book', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Book to Bookshelf">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Book Title"
          placeholder="e.g. Alice's Adventures in Wonderland"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Author"
          placeholder="e.g. Lewis Carroll"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
            >
              <option value="Classic Fiction">Classic Fiction</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Philosophy">Philosophy</option>
              <option value="Self Improvement">Self Improvement</option>
              <option value="Poetry">Poetry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Reading Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
            >
              <option value="WANT_TO_READ">Want to Read</option>
              <option value="READING">Currently Reading</option>
              <option value="FINISHED">Finished</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Cover Image (Optional)
          </label>
          <div className="border-2 border-dashed border-haven-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-haven-50/50 cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="hidden"
              id="cover-upload"
            />
            <label htmlFor="cover-upload" className="cursor-pointer space-y-1 block">
              <BookOpen className="w-6 h-6 text-amber-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {coverFile ? coverFile.name : 'Click to select a cover image'}
              </p>
              <p className="text-[10px] text-slate-400">PNG, JPG, JPEG, or WEBP. Stored only in this browser.</p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Book File (EPUB or PDF)
          </label>
          <div className="border-2 border-dashed border-haven-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-haven-50/50 cursor-pointer">
            <input
              type="file"
              accept=".epub,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-1 block">
              <Upload className="w-6 h-6 text-amber-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {file ? file.name : 'Click to select EPUB or PDF file'}
              </p>
              <p className="text-[10px] text-slate-400">Supported formats: .epub, .pdf (Up to 50MB)</p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Brief book summary..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Book'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
