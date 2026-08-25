import React from 'react';
import { Card } from './Card';

interface LineChartProps {
  title: string;
  subtitle: string;
  labels: string[];
  series: { name: string; values: number[]; color: string }[];
}

export const LineChart: React.FC<LineChartProps> = ({ title, subtitle, labels, series }) => {
  const width = 640;
  const height = 190;
  const padding = { top: 18, right: 18, bottom: 28, left: 24 };
  const max = Math.max(1, ...series.flatMap((item) => item.values));
  const x = (index: number) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(1, labels.length - 1);
  const y = (value: number) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);

  return <Card className="space-y-3"><div><h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">{title}</h3><p className="text-xs text-slate-500 mt-0.5">{subtitle}</p></div><div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px] h-48" role="img" aria-label={title}><line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="currentColor" className="text-slate-200 dark:text-slate-700" />{series.map((item) => <g key={item.name}><polyline fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')} />{item.values.map((value, index) => <circle key={`${item.name}-${index}`} cx={x(index)} cy={y(value)} r="3.5" fill={item.color} />)}</g>)}{labels.map((label, index) => <text key={label} x={x(index)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">{label}</text>)}</svg></div><div className="flex flex-wrap gap-4 text-[10px] text-slate-500">{series.map((item) => <span key={item.name} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>)}</div></Card>;
};
