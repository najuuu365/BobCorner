import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { 
  Calendar, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  ChevronRight,
  Flame,
  Award
  ,Plus
} from 'lucide-react';
import { collegeApi } from '../services/collegeApi';
import { booksApi } from '../services/booksApi';
import { challengeApi } from '../services/challengeApi';
import { moodApi } from '../services/moodApi';
import { focusApi } from '../services/focusApi';
import { Task, TimetableEntry, Book, DailyChallenge, MoodCheckIn } from '../types';
import confetti from 'canvas-confetti';
import { BookCover } from '../components/library/BookCover';
import { PerformancePanel } from '../components/ui/PerformancePanel';

export const TodayPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [todayMood, setTodayMood] = useState<MoodCheckIn | null>(null);
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  const [quickTask, setQuickTask] = useState('');

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const loadTodayData = async () => {
    try {
      const todayDayStr = new Date()
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase()
        .slice(0, 3);

      const [allTasks, allTimetable, allBooks, chRes, moodRes, sessions] = await Promise.all([
        collegeApi.getTasks(),
        collegeApi.getTimetable(),
        booksApi.getBooks(),
        challengeApi.getDailyChallenges(),
        moodApi.getTodayMood(),
        focusApi.getSessions(),
      ]);

      setTasks(allTasks);
      setTimetable(allTimetable.filter((t) => t.dayOfWeek.startsWith(todayDayStr)));
      setReadingBook(allBooks.find((b) => b.status === 'READING') || allBooks[0] || null);
      setChallenges(chRes.challenges);
      setTodayMood(moodRes);
      setFocusMinutesToday(sessions
        .filter((session) => session.type === 'FOCUS' && new Date(session.createdAt).toDateString() === new Date().toDateString())
        .reduce((total, session) => total + session.durationMinutes, 0));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  const handleMoodSelect = async (mood: string) => {
    try {
      const res = await moodApi.logMood(mood);
      setTodayMood(res);
      showToast(`Mood check-in recorded: ${mood}`, 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleCompleteChallenge = async (key: string) => {
    try {
      await challengeApi.updateProgress(key, 1);
      showToast('Challenge progress updated!', 'success');
      loadTodayData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDoneForToday = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setIsSummaryOpen(true);
  };

  const handleQuickAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickTask.trim()) return;
    try {
      const task = await collegeApi.createTask({ title: quickTask.trim(), status: 'TODO', priority: 'MEDIUM', dueDate: new Date().toISOString() });
      setTasks((previous) => [...previous, task]);
      setQuickTask('');
      showToast('Task added to today.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add task.', 'error');
    }
  };

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completedTasksToday = tasks.filter((t) => t.status === 'COMPLETED').length;
  const completedChallenges = challenges.filter((c) => c.completed).length;
  const overdueTasks = tasks.filter((task) => task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate).getTime() < Date.now()).length;
  const taskProgress = tasks.length ? Math.round((completedTasksToday / tasks.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-haven-200 dark:border-slate-800 pb-4">
        <div>
          <Badge variant="primary" size="md">
            Daily Focus Hub
          </Badge>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1">
            What are we doing today?
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{todayDateStr}</p>
        </div>

        <Button
          variant="primary"
          onClick={handleDoneForToday}
          icon={<Sparkles className="w-4 h-4 text-amber-300" />}
        >
          I'm Done for Today ✨
        </Button>
      </div>

      {/* Mood Check-In Card */}
      <Card className="space-y-3 bg-gradient-to-r from-amber-50/60 via-white to-pink-50/40 dark:from-slate-900 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mood Check-In
          </span>
          {todayMood && (
            <Badge variant="success" size="sm">
              Logged: {todayMood.mood}
            </Badge>
          )}
        </div>

        <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">
          How are you feeling right now?
        </h3>

        <div className="flex flex-wrap gap-2 pt-1">
          {['Great', 'Good', 'Meh', 'Tired', 'Motivated', 'Surviving'].map((m) => (
            <button
              key={m}
              onClick={() => handleMoodSelect(m)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                todayMood?.mood === m
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 border-haven-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-haven-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Card>

      {/* Daily command center metrics */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today at a glance</span>
            <h2 className="font-serif font-semibold text-lg text-slate-900 dark:text-white mt-1">Small steps still count.</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/focus')} icon={<Clock className="w-4 h-4" />}>Start focus</Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Task progress</span>
            <p className="text-2xl font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1">{taskProgress}%</p>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70">{completedTasksToday} of {tasks.length} complete</p>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
            <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Focus today</span>
            <p className="text-2xl font-mono font-bold text-amber-800 dark:text-amber-200 mt-1">{focusMinutesToday}m</p>
            <p className="text-[11px] text-amber-700/70 dark:text-amber-300/70">deep work logged</p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3">
            <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">Needs attention</span>
            <p className="text-2xl font-mono font-bold text-rose-800 dark:text-rose-200 mt-1">{overdueTasks}</p>
            <p className="text-[11px] text-rose-700/70 dark:text-rose-300/70">overdue task{overdueTasks === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 p-3">
            <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">Daily wins</span>
            <p className="text-2xl font-mono font-bold text-sky-800 dark:text-sky-200 mt-1">{completedChallenges}</p>
            <p className="text-[11px] text-sky-700/70 dark:text-sky-300/70">challenge{completedChallenges === 1 ? '' : 's'} complete</p>
          </div>
        </div>
      </Card>

      

      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Plus className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif font-semibold text-base">Quick add a task</h3>
        </div>
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2">
          <input value={quickTask} onChange={(event) => setQuickTask(event.target.value)} placeholder="What would make today feel lighter?" className="flex-1 bg-white dark:bg-slate-900 border border-haven-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm" />
          <Button type="submit" variant="primary" disabled={!quickTask.trim()}>Add task</Button>
        </form>
      </Card>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Schedule & Tasks */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif font-semibold text-base">Today's Class Schedule</h3>
            </div>

            <div className="space-y-2">
              {timetable.length > 0 ? (
                timetable.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl border flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: `${slot.subject?.color || '#6366f1'}15`,
                      borderColor: `${slot.subject?.color || '#6366f1'}40`,
                    }}
                  >
                    <div>
                      <p className="font-bold" style={{ color: slot.subject?.color }}>
                        {slot.subject?.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    {slot.room && <span className="text-[10px] text-slate-500">Room {slot.room}</span>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No classes scheduled for today.</p>
              )}
            </div>
          </Card>

          {/* Today Tasks */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-serif font-semibold text-base">Tasks Pending</h3>
            </div>

            <div className="space-y-2">
              {tasks.filter((t) => t.status !== 'COMPLETED').slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-haven-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{task.title}</span>
                  <Badge variant="warning" size="sm">{task.priority}</Badge>
                </div>
              ))}
              {tasks.filter((t) => t.status !== 'COMPLETED').length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">All tasks completed for today!</p>
              )}
            </div>
          </Card>
        </div>

        <PerformancePanel title="Today's performance report" subtitle="A live snapshot from your local Prison activity." metrics={[
        { label: 'Completion', value: `${taskProgress}%`, detail: `${completedTasksToday}/${tasks.length} tasks`, tone: 'emerald' },
        { label: 'Focus time', value: `${focusMinutesToday}m`, detail: 'logged today', tone: 'amber' },
        { label: 'Challenges', value: `${completedChallenges}/${challenges.length}`, detail: 'completed', tone: 'violet' },
        { label: 'Attention', value: overdueTasks, detail: 'overdue tasks', tone: 'rose' },
      ]} />

        {/* Daily Challenges & Reading */}
        <div className="space-y-6">
          {/* Daily Challenges */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif font-semibold text-base">Daily Challenges</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {completedChallenges} / {challenges.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {challenges.map((c) => (
                <div
                  key={c.key}
                  className="p-3 bg-haven-50 dark:bg-slate-800 rounded-xl border border-haven-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{c.title}</p>
                    <p className="text-[11px] text-slate-500">{c.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={c.completed ? 'secondary' : 'outline'}
                    disabled={c.completed}
                    onClick={() => handleCompleteChallenge(c.key)}
                  >
                    {c.completed ? '✓ Completed' : 'Progress'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Reading Card */}
          {readingBook && (
            <Card className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-semibold text-base">Current Book Goal</h3>
              </div>

              <div className="flex gap-4 items-center">
                <BookCover title={readingBook.title} coverUrl={readingBook.coverUrl} className="w-14 h-20 rounded-lg shadow-sm border" />
                <div>
                  <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white">
                    {readingBook.title}
                  </h4>
                  <p className="text-xs text-slate-500">by {readingBook.author}</p>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-2">
                    Page {readingBook.currentPage} of {readingBook.totalPages}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* END OF DAY SUMMARY MODAL */}
      <Modal isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} title="✨ End of Day Summary">
        <div className="space-y-5 text-center py-2">
          <div className="text-5xl">🌙</div>
          <h3 className="font-serif font-bold text-2xl text-slate-900 dark:text-white">
            Great Work Today!
          </h3>
          <p className="text-xs text-slate-500">Here is what you accomplished in your personal workspace:</p>

          <div className="grid grid-cols-2 gap-3 text-left">
            <Card className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Tasks Done</span>
              <p className="font-mono text-2xl font-bold text-emerald-700">{completedTasksToday}</p>
            </Card>

            <Card className="p-3 bg-amber-50 dark:bg-amber-950/40 border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Challenges</span>
              <p className="font-mono text-2xl font-bold text-amber-700">{completedChallenges}</p>
            </Card>
          </div>

          <Button variant="primary" className="w-full" onClick={() => setIsSummaryOpen(false)}>
            Close & Rest Well ☕
          </Button>
        </div>
      </Modal>
    </div>
  );
};
