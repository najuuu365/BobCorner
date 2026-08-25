import { storage } from './database';

export interface HavenProgress {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

const progressKey = () => `${localStorage.getItem('haven_user_id') ?? 'anonymous'}:progress`;

export async function getProgress(): Promise<HavenProgress> {
  return (await storage.get<HavenProgress>(progressKey())) ?? { xp: 0, level: 1, currentStreak: 0, longestStreak: 0 };
}

export async function awardXp(amount: number): Promise<HavenProgress> {
  const progress = await getProgress();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const currentStreak = progress.lastActiveDate === yesterday
    ? progress.currentStreak + 1
    : progress.lastActiveDate === today ? progress.currentStreak : 1;
  const reward = Math.max(0, amount);
  const updated = {
    ...progress,
    xp: progress.xp + reward,
    level: Math.max(1, Math.floor((progress.xp + reward) / 100) + 1),
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastActiveDate: today,
  };
  return storage.set(progressKey(), updated);
}
