import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  CalendarDays,
  GraduationCap, 
  Gamepad2, 
  BookOpen, 
  Timer, 
  Flower2,
  Trophy,
  User as UserIcon, 
  Compass, 
  Search,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  HelpCircle,
  Heart
  ,AudioLines
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  onOpenSearch: () => void;
  onOpenRandomizer: () => void;
  onOpenBored: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSearch, onOpenRandomizer, onOpenBored }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Today Planner', path: '/today', icon: CalendarDays },
    { label: 'College Hub', path: '/college', icon: GraduationCap },
    { label: 'Focus Space', path: '/focus', icon: Timer },
    { label: 'Game Arcade', path: '/games', icon: Gamepad2 },
    { label: 'Digital Library', path: '/library', icon: BookOpen },
    { label: 'Quran Listener', path: '/quran', icon: AudioLines },
    { label: 'Virtual Garden', path: '/garden', icon: Flower2 },
    { label: 'Achievements', path: '/achievements', icon: Trophy },
    { label: 'Profile & Settings', path: '/profile', icon: UserIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-haven-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-screen sticky top-0 z-30 select-none">
      {/* Brand */}
      <div className="p-6 pb-4 border-b border-haven-100 dark:border-slate-800/80 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-haven-700 to-amber-600 dark:from-amber-600 dark:to-amber-400 flex items-center justify-center text-amber-50 shadow-md group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-tight text-slate-900 dark:text-white block leading-tight">
              Bobbb's prison
            </span>
            <span className="text-[10px] uppercase font-semibold text-haven-600 dark:text-amber-400 tracking-wider">
              {theme === 'soft' ? 'Soft Mode 🌸' : 'Personal Corner'}
            </span>
          </div>
        </NavLink>

        <button
          onClick={toggleTheme}
          title="Toggle Theme (Light / Dark / Sepia / Soft)"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-haven-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'sepia' ? <Coffee className="w-4 h-4" /> : theme === 'soft' ? <Heart className="w-4 h-4 text-pink-500" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search & I'm Bored buttons */}
      <div className="px-4 py-3 space-y-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-haven-50 dark:bg-slate-800/60 rounded-xl border border-haven-200/60 dark:border-slate-700/60 hover:bg-haven-100 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Quick Search...
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-haven-200 dark:border-slate-700 rounded shadow-2xs font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onOpenBored}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-800 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>I'm bored... 🎲</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-haven-100 dark:bg-slate-800 text-haven-900 dark:text-amber-400 font-semibold shadow-2xs border border-haven-200/50 dark:border-slate-700/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-haven-50/80 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-haven-700 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Randomizer Widget Button */}
        <div className="pt-2">
          <button
            onClick={onOpenRandomizer}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Random Spark</span>
          </button>
        </div>
      </nav>

      {/* User Profile Mini Footer */}
      {user && (
        <div className="p-3 border-t border-haven-100 dark:border-slate-800/80">
          <NavLink to="/profile" className="flex items-center gap-2.5 group">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-haven-300 dark:border-slate-700 group-hover:ring-2 group-hover:ring-amber-500/50 transition-all"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  );
};
