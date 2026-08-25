import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from './Card';

export interface PerformanceMetric {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';
}

interface PerformancePanelProps {
  title: string;
  subtitle?: string;
  metrics: PerformanceMetric[];
}

const tones = {
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200',
  sky: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200',
  rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200',
  violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200',
};

export const PerformancePanel: React.FC<PerformancePanelProps> = ({ title, subtitle, metrics }) => (
  <Card className="space-y-3">
    <div className="flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-amber-600" />
      <div><h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">{title}</h3>{subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}</div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {metrics.map((metric) => <div key={metric.label} className={`rounded-xl p-3 ${tones[metric.tone || 'amber']}`}><span className="text-[10px] uppercase font-bold opacity-75">{metric.label}</span><p className="text-xl font-mono font-bold mt-1">{metric.value}</p>{metric.detail && <p className="text-[10px] opacity-70 mt-0.5">{metric.detail}</p>}</div>)}
    </div>
  </Card>
);
