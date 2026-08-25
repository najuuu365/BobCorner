import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Sparkles, RefreshCw, Gamepad2, BookOpen, Timer, Flower2, Calendar } from 'lucide-react';

interface ImBoredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActivitySuggestion {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  path: string;
}

const SUGGESTIONS: ActivitySuggestion[] = [
  {
    title: 'Play Cat Chase Arcade 🐱',
    description: 'Catch the mischievous cat before it escapes or trolls you!',
    icon: <Gamepad2 className="w-6 h-6 text-amber-500" />,
    actionText: 'Go to Games Arcade',
    path: '/games',
  },
  {
    title: 'Read 15 Pages in Library 📖',
    description: 'Immerse yourself in your current reading book and save a favorite quote.',
    icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
    actionText: 'Open Library',
    path: '/library',
  },
  {
    title: 'Water Your Virtual Garden 🌱',
    description: 'Check on your plants and watch your sunflower or monstera reach full bloom!',
    icon: <Flower2 className="w-6 h-6 text-emerald-500" />,
    actionText: 'Visit Garden',
    path: '/garden',
  },
  {
    title: 'Complete a 25-min Focus Session ⏱️',
    description: 'Turn on soft ambient rain audio and knock out a study session.',
    icon: <Timer className="w-6 h-6 text-rose-500" />,
    actionText: 'Start Focus Mode',
    path: '/focus',
  },
  {
    title: 'Check Today’s Daily Planner 📅',
    description: 'Complete your daily tasks and earn rewards for your companion.',
    icon: <Calendar className="w-6 h-6 text-amber-600" />,
    actionText: 'Go to Today Page',
    path: '/today',
  },
];

export const ImBoredModal: React.FC<ImBoredModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentSuggestion, setCurrentSuggestion] = useState<ActivitySuggestion>(SUGGESTIONS[0]);

  const handleReroll = () => {
    const randomIndex = Math.floor(Math.random() * SUGGESTIONS.length);
    setCurrentSuggestion(SUGGESTIONS[randomIndex]);
  };

  React.useEffect(() => {
    if (isOpen) {
      handleReroll();
    }
  }, [isOpen]);

  const handleAction = () => {
    onClose();
    navigate(currentSuggestion.path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎲 What should we do?" maxWidth="md">
      <div className="space-y-6 text-center py-2">
        <div className="p-6 bg-haven-50 dark:bg-slate-800 rounded-2xl border border-haven-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 mx-auto flex items-center justify-center shadow-md">
            {currentSuggestion.icon}
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
            {currentSuggestion.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentSuggestion.description}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleReroll} icon={<RefreshCw className="w-4 h-4" />}>
            Reroll Suggestion
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleAction}>
            {currentSuggestion.actionText} →
          </Button>
        </div>
      </div>
    </Modal>
  );
};
