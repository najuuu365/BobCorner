import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white dark:bg-slate-900 border border-haven-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all duration-200',
          hoverEffect && 'hover:shadow-md hover:-translate-y-0.5 hover:border-haven-300 dark:hover:border-slate-700',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
