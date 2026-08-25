import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { QuickSearchModal } from './QuickSearchModal';
import { RandomizerModal } from './RandomizerModal';
import { ImBoredModal } from './ImBoredModal';
import { OnboardingModal } from './OnboardingModal';
import { Mascot } from '../companion/Mascot';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

export const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
  const [isBoredOpen, setIsBoredOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => localStorage.getItem('haven_onboarding_done') !== 'true');

  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && localStorage.getItem('haven_onboarding_done') !== 'true') setIsOnboardingOpen(true);
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'L') {
        e.preventDefault();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        showToast('🎉 Secret Easter Egg Unlocked! "Literary Celebration Mode"', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  return (
    <div className="min-h-screen bg-haven-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300 relative">
      <Sidebar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenRandomizer={() => setIsRandomizerOpen(true)}
        onOpenBored={() => setIsBoredOpen(true)}
      />

      <Topbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenRandomizer={() => setIsRandomizerOpen(true)}
        onOpenBored={() => setIsBoredOpen(true)}
      />

      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <Outlet />
      </main>

      <MobileNav />

      {/* Floating Digital Companion Mascot */}
      <Mascot />

      {/* Global Modals */}
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <RandomizerModal isOpen={isRandomizerOpen} onClose={() => setIsRandomizerOpen(false)} />
      <ImBoredModal isOpen={isBoredOpen} onClose={() => setIsBoredOpen(false)} />
      <OnboardingModal isOpen={isOnboardingOpen && Boolean(user)} onComplete={() => setIsOnboardingOpen(false)} />
    </div>
  );
};
