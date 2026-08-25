import React from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  title: string;
  coverUrl?: string;
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({ title, coverUrl, className = '' }) => {
  if (coverUrl) {
    return <img src={coverUrl} alt={title} className={`object-cover ${className}`} />;
  }

  return <div role="img" aria-label={`${title} cover placeholder`} className={`flex flex-col items-center justify-center gap-2 bg-haven-100 dark:bg-slate-800 p-3 text-center ${className}`}><BookOpen className="w-10 h-10 text-amber-600/70" /><span className="font-serif font-semibold text-xs text-slate-700 dark:text-slate-300 line-clamp-3">{title}</span></div>;
};
