import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Trophy, Lock, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { achievementApi } from '../services/achievementApi';
import { Achievement } from '../types';

export const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Productivity' | 'Focus' | 'Reading' | 'Games' | 'Garden' | 'Exploration' | 'Streaks'>('ALL');

  const loadAchievements = async () => {
    try {
      const list = await achievementApi.getAchievements();
      setAchievements(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const filtered = achievements.filter((a) =>
    categoryFilter === 'ALL' ? true : a.category === categoryFilter
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Achievements & Collectibles <Trophy className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unlock playful milestones as you study, read, play games, and grow your sanctuary.
          </p>
        </div>

        <Badge variant="primary" size="md" className="self-start sm:self-auto py-1.5 px-4 font-mono font-bold text-sm">
          🏆 Unlocked: {unlockedCount} / {achievements.length}
        </Badge>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
        {(['ALL', 'Productivity', 'Focus', 'Reading', 'Games', 'Garden', 'Exploration', 'Streaks'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map((a) => (
          <motion.div key={a.key} whileHover={{ y: -2 }}>
            <Card
              className={`space-y-3 relative overflow-hidden transition-all ${
                a.unlocked
                  ? 'border-amber-400/70 bg-gradient-to-tr from-amber-50/60 via-white to-amber-100/30 dark:from-slate-900 dark:to-slate-900'
                  : 'opacity-60 bg-haven-50/50 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
                  {a.unlocked ? (a.icon || '🏆') : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <Badge variant={a.unlocked ? 'success' : 'default'} size="sm">
                  {a.category}
                </Badge>
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {a.description}
                </p>
              </div>

              <div className="pt-2 border-t border-haven-100 dark:border-slate-800 flex justify-between items-center text-[10px]">
                {a.rewardItem && (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    Reward: {a.rewardItem}
                  </span>
                )}
                {a.unlocked && a.unlockedAt && (
                  <span className="text-slate-400 font-mono">
                    Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                  </span>
                )}
                {a.target && !a.unlocked && <span className="text-slate-400">Progress: {a.progress || 0} / {a.target}</span>}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
