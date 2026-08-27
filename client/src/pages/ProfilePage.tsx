import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { User, LogOut, Sun, Moon, Coffee, Heart, Download, Upload, Bell, RotateCcw } from 'lucide-react';
import { exportHavenData, importHavenData, resetHavenData } from '../services/storage/backup';
import { collegeApi } from '../services/collegeApi';
import { focusApi } from '../services/focusApi';
import { booksApi } from '../services/booksApi';
import { gamesApi } from '../services/gamesApi';
import { gardenApi } from '../services/gardenApi';
import { getProgress, HavenProgress } from '../services/storage/progress';
import { PerformancePanel } from '../components/ui/PerformancePanel';
import { ActivityEvent, getActivity } from '../services/storage/activity';
import { journalApi } from '../services/journalApi';

interface ProfileStats {
  completedTasks: number;
  focusMinutes: number;
  booksFinished: number;
  gamesPlayed: number;
  plants: number;
  progress: HavenProgress;
}

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [notifications, setNotifications] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const importInput = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<ProfileStats>({ completedTasks: 0, focusMinutes: 0, booksFinished: 0, gamesPlayed: 0, plants: 0, progress: { xp: 0, level: 1, currentStreak: 0, longestStreak: 0 } });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [journalEntries, setJournalEntries] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [tasks, sessions, books, games, garden, progress, activityEvents, journal] = await Promise.all([
          collegeApi.getTasks(),
          focusApi.getSessions(),
          booksApi.getBooks(),
          gamesApi.getScores(),
          gardenApi.getGardenState(),
          getProgress(),
          getActivity(),
          journalApi.getEntries(),
        ]);
        setActivity(activityEvents);
        setJournalEntries(journal.length);
        setStats({
          completedTasks: tasks.filter((task) => task.status === 'COMPLETED').length,
          focusMinutes: sessions.filter((session) => session.type === 'FOCUS').reduce((total, session) => total + session.durationMinutes, 0),
          booksFinished: books.filter((book) => book.status === 'FINISHED').length,
          gamesPlayed: games.stats.reduce((total, stat) => total + stat.gamesPlayed, 0),
          plants: garden.plants.length,
          progress,
        });
      } catch {
        // Profile remains usable when a new local store is still initializing.
      }
    };
    loadStats();
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, bio, avatarUrl });
      showToast('Profile updated successfully!', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const backup = await exportHavenData();
    const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Progress-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Your Data backup is ready.', 'success');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !window.confirm('Restore this backup? Current local data will be replaced.')) return;
    setRestoring(true);
    try {
      await importHavenData(file);
      showToast('Backup restored. Reloading Prison...', 'success');
      window.location.reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to restore backup.', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Delete all prison data from this browser? This cannot be undone.')) return;
    await resetHavenData();
    window.location.reload();
  };

  const handleNotifications = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported here.', 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotifications(enabled);
    localStorage.setItem('haven_notifications', String(enabled));
    if (enabled) new Notification('Prison is ready', { body: 'Your quiet workspace will be here when you need it.' });
    showToast(enabled ? 'Prison reminders enabled.' : 'Prison reminders remain disabled.', enabled ? 'success' : 'info');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-haven-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
            Settings & Personal Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize your profile, preferences, and aesthetic theme settings.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
          Reset Jail Cell
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-4 text-center">
          <div className="relative w-24 h-24 mx-auto">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
              alt={user?.name}
              className="w-full h-full rounded-full object-cover border-4 border-haven-200 dark:border-slate-700 shadow-md"
            />
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-haven-50 dark:bg-slate-800 p-3 rounded-xl">
            "{user?.bio || 'Building a cozy personal space.'}"
          </p>

          <Button variant="danger" size="sm" className="w-full" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Personal progress</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A quiet record of what you have built here.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3"><span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Tasks done</span><p className="text-xl font-mono font-bold mt-1">{stats.completedTasks}</p></div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3"><span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Focus min</span><p className="text-xl font-mono font-bold mt-1">{stats.focusMinutes}</p></div>
              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3"><span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Books done</span><p className="text-xl font-mono font-bold mt-1">{stats.booksFinished}</p></div>
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3"><span className="text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300">Games played</span><p className="text-xl font-mono font-bold mt-1">{stats.gamesPlayed}</p></div>
              <div className="bg-lime-50 dark:bg-lime-950/30 rounded-xl p-3"><span className="text-[10px] uppercase font-bold text-lime-700 dark:text-lime-300">Plants</span><p className="text-xl font-mono font-bold mt-1">{stats.plants}</p></div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-haven-100 dark:border-slate-800 pt-3">
              <span>Level <strong className="text-amber-700 dark:text-amber-300">{stats.progress.level}</strong></span>
              <span><strong className="text-amber-700 dark:text-amber-300">{stats.progress.xp} XP</strong> earned</span>
              <span>Current streak <strong className="text-rose-700 dark:text-rose-300">{stats.progress.currentStreak} days</strong></span>
              <span>Best streak <strong className="text-rose-700 dark:text-rose-300">{stats.progress.longestStreak} days</strong></span>
            </div>
          </Card>

          

          <Card className="space-y-3">
            <div><h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Activity timeline</h3><p className="text-xs text-slate-500 mt-1">Your recent Haven actions, stored locally for the long term.</p></div>
            {activity.length === 0 ? <p className="text-xs text-slate-400">Your timeline will appear as you use Haven.</p> : <div className="space-y-2 max-h-56 overflow-y-auto">{activity.slice(0, 12).map((event) => <div key={event.id} className="flex items-start justify-between gap-3 rounded-lg bg-haven-50 dark:bg-slate-800 px-3 py-2"><div><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{event.title}</p>{event.detail && <p className="text-[10px] text-slate-500">{event.detail}</p>}</div><time className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(event.createdAt).toLocaleDateString()}</time></div>)}</div>}
          </Card>

          <Card className="space-y-4">
            <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">
              Edit Account Information
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Avatar Image URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Bio / Personal Status
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-haven-300 dark:border-slate-700 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Theme Selector including Soft Mode 🌸 */}
          <Card className="space-y-4">
            <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white flex items-center justify-between">
              <span>Application Aesthetic & Theme</span>
              {theme === 'soft' && <Badge variant="primary">Soft Mode 🌸 Active</Badge>}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-amber-100 border-amber-500 text-amber-900 font-semibold'
                    : 'border-haven-200 dark:border-slate-800'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-600" />
                Warm Light
              </button>

              <button
                onClick={() => setTheme('soft')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  theme === 'soft'
                    ? 'bg-pink-100 border-pink-500 text-pink-900 font-semibold shadow-2xs'
                    : 'border-haven-200 dark:border-slate-800'
                }`}
              >
                <Heart className="w-5 h-5 text-pink-500 fill-current" />
                Soft Mode 🌸
              </button>

              <button
                onClick={() => setTheme('sepia')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  theme === 'sepia'
                    ? 'bg-amber-100 border-amber-500 text-amber-900 font-semibold'
                    : 'border-haven-200 dark:border-slate-800'
                }`}
              >
                <Coffee className="w-5 h-5 text-amber-800" />
                Warm Sepia
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-amber-100 dark:bg-slate-800 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold'
                    : 'border-haven-200 dark:border-slate-800'
                }`}
              >
                <Moon className="w-5 h-5 text-slate-400" />
                Deep Dark
              </button>
            </div>
          </Card>

          <PerformancePanel title="Final performance report" subtitle="Your complete local Jail snapshot." metrics={[
            { label: 'Level', value: stats.progress.level, detail: `${stats.progress.xp} XP`, tone: 'amber' },
            { label: 'Streak', value: `${stats.progress.currentStreak}d`, detail: `best ${stats.progress.longestStreak}d`, tone: 'rose' },
            { label: 'Focus', value: `${stats.focusMinutes}m`, detail: 'total minutes', tone: 'sky' },
            { label: 'Completed', value: stats.completedTasks + stats.booksFinished, detail: 'tasks and books', tone: 'emerald' },
            { label: 'Journal', value: journalEntries, detail: 'reading reflections', tone: 'violet' },
          ]} />
          <Card className="space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Your Prison data</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep a portable copy of your local profile, library, garden, games, and progress.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={handleExport} icon={<Download className="w-4 h-4" />}>Export backup</Button>
              <Button variant="secondary" size="sm" onClick={() => importInput.current?.click()} disabled={restoring} icon={<Upload className="w-4 h-4" />}>{restoring ? 'Restoring...' : 'Import backup'}</Button>
              <Button variant="danger" size="sm" onClick={handleReset}>Reset Jail</Button>
              <input ref={importInput} type="file" accept="application/json" onChange={handleImport} className="hidden" />
            </div>
            <button onClick={handleNotifications} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300">
              <Bell className={`w-4 h-4 ${notifications ? 'text-amber-600' : 'text-slate-400'}`} />
              {notifications ? 'Browser reminders enabled' : 'Enable browser reminders'}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
