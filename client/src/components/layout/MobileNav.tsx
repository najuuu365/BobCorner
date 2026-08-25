import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, GraduationCap, Gamepad2, BookOpen, Timer, Flower2, Trophy, AudioLines } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Today', path: '/today', icon: CalendarDays },
    { label: 'College', path: '/college', icon: GraduationCap },
    { label: 'Focus', path: '/focus', icon: Timer },
    { label: 'Arcade', path: '/games', icon: Gamepad2 },
    { label: 'Library', path: '/library', icon: BookOpen },
    { label: 'Quran', path: '/quran', icon: AudioLines },
    { label: 'Garden', path: '/garden', icon: Flower2 },
    { label: 'Badges', path: '/achievements', icon: Trophy },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-haven-200 dark:border-slate-800 px-1 py-1.5 flex items-center justify-around overflow-x-auto no-scrollbar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all whitespace-nowrap ${
              isActive
                ? 'text-haven-900 dark:text-amber-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[9px] tracking-tight">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
