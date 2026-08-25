import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Search, BookOpen, GraduationCap, Gamepad2, Timer, User, ArrowRight } from 'lucide-react';
import { booksApi } from '../../services/booksApi';
import { collegeApi } from '../../services/collegeApi';
import { Book, Task, Subject } from '../../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      booksApi.getBooks().then(setBooks).catch(() => {});
      collegeApi.getTasks().then(setTasks).catch(() => {});
      collegeApi.getSubjects().then(setSubjects).catch(() => {});
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const navShortcuts = [
    { label: 'Go to Personal Dashboard', path: '/', icon: HomeIcon },
    { label: 'Go to College Productivity Hub', path: '/college', icon: GraduationCap },
    { label: 'Go to Focus Room', path: '/focus', icon: Timer },
    { label: 'Go to Game Arcade', path: '/games', icon: Gamepad2 },
    { label: 'Go to Book Library', path: '/library', icon: BookOpen },
    { label: 'Go to Profile Settings', path: '/profile', icon: User },
  ];

  const filteredBooks = query ? books.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase())) : [];
  const filteredTasks = query ? tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())) : [];
  const filteredSubjects = query ? subjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase())) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search books, tasks, subjects, or navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-haven-50 dark:bg-slate-800 border border-haven-300 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Dynamic Search Results */}
        {query ? (
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {filteredBooks.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 px-2">Books</p>
                {filteredBooks.map(book => (
                  <button
                    key={book.id}
                    onClick={() => handleSelect(book.filePath ? `/reader/${book.id}` : '/library')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-haven-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{book.title}</p>
                        <p className="text-xs text-slate-500">{book.author}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {filteredTasks.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 px-2">Tasks</p>
                {filteredTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect('/college')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-haven-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                      <p className="text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                    </div>
                    <span className="text-xs text-slate-400">{task.status}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredSubjects.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 px-2">Subjects</p>
                {filteredSubjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect('/college')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-haven-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                    <span className="text-xs text-slate-400">{s.code}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredBooks.length === 0 && filteredTasks.length === 0 && filteredSubjects.length === 0 && (
              <p className="text-center py-6 text-sm text-slate-400">No matching items found for "{query}".</p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Quick Navigation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-haven-50/80 dark:bg-slate-800/50 hover:bg-haven-100 dark:hover:bg-slate-800 border border-haven-200/60 dark:border-slate-700/60 text-left transition-all"
                  >
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

function HomeIcon(props: any) {
  return <GraduationCap {...props} />;
}
