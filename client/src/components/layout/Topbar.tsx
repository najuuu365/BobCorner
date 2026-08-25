import React from 'react';
import { Search, Sparkles, Sun, Moon, Coffee, Heart, Compass, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenRandomizer: () => void;
  onOpenBored: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSearch, onOpenRandomizer, onOpenBored }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-haven-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
          <Compass className="w-4 h-4" />
        </div>
        <span className="font-serif font-bold text-lg text-slate-900 dark:text-white">Haven</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenBored}
          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold"
          title="I'm bored..."
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenRandomizer}
          className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg"
          title="Random Spark"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenSearch}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-haven-100 dark:hover:bg-slate-800 rounded-lg"
          title="Quick Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-haven-100 dark:hover:bg-slate-800 rounded-lg"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'sepia' ? <Coffee className="w-4 h-4" /> : theme === 'soft' ? <Heart className="w-4 h-4 text-pink-500" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
