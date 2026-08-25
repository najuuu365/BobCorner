import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Compass, Sprout, BookOpen } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const STEPS = [
  { icon: <Compass className="w-8 h-8 text-amber-600" />, title: 'Welcome to Haven', text: 'A quiet corner for your tasks, focus sessions, reading, games, and small daily wins.' },
  { icon: <Sprout className="w-8 h-8 text-emerald-600" />, title: 'Grow at your pace', text: 'Complete tasks, focus, tend your garden, and earn XP without pressure or noisy streak chasing.' },
  { icon: <BookOpen className="w-8 h-8 text-sky-600" />, title: 'Make it yours', text: 'Add books, choose a theme, personalize Nori, and keep your local data backed up from Profile.' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const finish = () => {
    localStorage.setItem('haven_onboarding_done', 'true');
    onComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={finish} title="A small welcome">
      <div className="text-center space-y-5 py-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">{current.icon}</div>
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">{current.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{current.text}</p>
        </div>
        <div className="flex justify-center gap-1.5">{STEPS.map((item, index) => <span key={item.title} className={`w-2 h-2 rounded-full ${index === step ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>
        <div className="flex justify-between items-center gap-3">
          <Button variant="ghost" size="sm" onClick={finish}>Skip</Button>
          <Button variant="primary" size="sm" onClick={() => step === STEPS.length - 1 ? finish() : setStep(step + 1)}>{step === STEPS.length - 1 ? 'Enter Haven' : 'Next'}</Button>
        </div>
      </div>
    </Modal>
  );
};
