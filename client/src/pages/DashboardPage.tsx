import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  GraduationCap, 
  Gamepad2, 
  Quote as QuoteIcon, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { collegeApi } from '../services/collegeApi';
import { booksApi } from '../services/booksApi';
import { BookCover } from '../components/library/BookCover';
import { Task, Assignment, Book, BookQuote } from '../types';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<BookQuote | null>(null);

  // Focus Timer state for mini widget
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Time & Greeting
  const [timeString, setTimeString] = useState('');
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      const hour = now.getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Data Fetching
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [fetchedTasks, fetchedAssignments, fetchedBooks, fetchedQuotes] = await Promise.all([
          collegeApi.getTasks(),
          collegeApi.getAssignments(),
          booksApi.getBooks(),
          booksApi.getQuotes(),
        ]);

        setTasks(fetchedTasks);
        setAssignments(fetchedAssignments);
        setBooks(fetchedBooks);
        setQuotes(fetchedQuotes);

        if (fetchedQuotes.length > 0) {
          setCurrentQuote(fetchedQuotes[Math.floor(Math.random() * fetchedQuotes.length)]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, []);

  const currentlyReading = books.find((b) => b.status === 'READING') || books[0];
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED').slice(0, 4);
  const upcomingAssignments = assignments.filter((a) => a.status === 'PENDING').slice(0, 3);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-haven-200/60 dark:border-slate-800"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {greeting}, {user?.name.split(' ')[0] || 'Friend'} <span className="text-2xl">☕</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back to your personal sanctuary. What would you like to focus on today?
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-haven-200 dark:border-slate-800 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{todayFormatted}</p>
            <p className="text-[10px] text-slate-500 font-mono">{timeString}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Modular Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1 & 2: Main Hub Highlights */}
        <div className="md:col-span-2 space-y-6">
          {/* Currently Reading Hero Card */}
          {currentlyReading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card hoverEffect className="relative overflow-hidden bg-gradient-to-r from-haven-100/80 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30">
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className="w-24 h-36 rounded-xl overflow-hidden shadow-lg shrink-0 border border-haven-300 dark:border-slate-700">
                    <BookCover title={currentlyReading.title} coverUrl={currentlyReading.coverUrl} className="w-full h-full" />
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        Currently Reading
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">{currentlyReading.genre}</span>
                    </div>

                    <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white truncate">
                      {currentlyReading.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      by {currentlyReading.author}
                    </p>

                    {/* Reading Progress */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Reading Progress</span>
                        <span>
                          {currentlyReading.currentPage} / {currentlyReading.totalPages} pages (
                          {Math.round(((currentlyReading.currentPage || 0) / (currentlyReading.totalPages || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-haven-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((currentlyReading.currentPage || 0) / (currentlyReading.totalPages || 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(currentlyReading.filePath ? `/reader/${currentlyReading.id}` : '/library')}
                        icon={<BookOpen className="w-3.5 h-3.5" />}
                      >
                        Continue Reading
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/library')}
                      >
                        View Library
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Academic Priorities Widget: Tasks & Assignments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Upcoming Tasks */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">
                    Priority Tasks
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/college')}
                  className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
                >
                  All Tasks <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {pendingTasks.length > 0 ? (
                  pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-haven-50/80 dark:bg-slate-800/60 rounded-xl border border-haven-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {task.title}
                        </p>
                        {task.subject && (
                          <span
                            className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded"
                            style={{ backgroundColor: `${task.subject.color}20`, color: task.subject.color }}
                          >
                            {task.subject.code || task.subject.name}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No pending tasks right now. Great job!</p>
                )}
              </div>
            </Card>

            {/* Assignments Deadlines */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">
                    Assignment Deadlines
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/college')}
                  className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
                >
                  View Hub <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-haven-50/80 dark:bg-slate-800/60 rounded-xl border border-haven-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {a.title}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Due: {new Date(a.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="info" size="sm">
                        {a.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No upcoming assignment deadlines.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Games Arcade Strip */}
          <Card className="bg-gradient-to-r from-slate-900 to-haven-950 text-white space-y-4 border-none shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-semibold text-lg text-white">
                  Mini Game Arcade
                </h3>
              </div>
              <Button size="sm" variant="ghost" className="text-amber-300 hover:text-white" onClick={() => navigate('/games')}>
                Open Arcade <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => navigate('/games')}
                className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Literary 2048
                </span>
                <p className="text-sm font-medium text-slate-200">
                  Merge Page → Chapter → Novel → Grand Library!
                </p>
              </div>

              <div
                onClick={() => navigate('/games')}
                className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Word Sleuth
                </span>
                <p className="text-sm font-medium text-slate-200">
                  Decode famous book quotes & emoji clues.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Column 3: Sidebar Widgets */}
        <div className="space-y-6">
          {/* Pomodoro Focus Mini Widget */}
          <Card className="space-y-4 text-center bg-gradient-to-b from-white via-haven-50/50 to-white dark:from-slate-900 dark:to-slate-900">
            <div className="flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">
                  Focus Timer
                </h3>
              </div>
              <button
                onClick={() => navigate('/focus')}
                className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline"
              >
                Full Mode
              </button>
            </div>

            <div className="py-4">
              <span className="font-mono text-4xl font-bold tracking-tight text-slate-900 dark:text-white block">
                {formatTimer(timerSeconds)}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mt-1">
                25 Min Pomodoro Session
              </span>
            </div>

            <div className="flex justify-center gap-2">
              <Button
                variant={isTimerRunning ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                icon={isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {isTimerRunning ? 'Pause' : 'Start Focus'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            </div>
          </Card>

          {/* Daily Thought / Book Quote Card */}
          {currentQuote && (
            <Card className="space-y-3 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 relative">
              <QuoteIcon className="w-6 h-6 text-amber-600/30 dark:text-amber-400/30 absolute top-4 right-4" />
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Thought for Today</span>
              </div>

              <p className="font-serif italic text-sm text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
                "{currentQuote.quote}"
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">— {currentQuote.author}</span>
                {quotes.length > 1 && (
                  <button
                    onClick={() => {
                      const next = quotes[Math.floor(Math.random() * quotes.length)];
                      setCurrentQuote(next);
                    }}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium"
                  >
                    Next Quote
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Useful Quick Actions Card */}
          <Card className="space-y-3">
            <h4 className="font-serif font-semibold text-sm text-slate-900 dark:text-white">
              Quick Shortcuts
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/college')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-haven-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
              >
                <span>➕ Add new task or assignment</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/library')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-haven-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
              >
                <span>📚 Add a new book or upload EPUB/PDF</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/college')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-haven-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
              >
                <span>🧮 Check GPA & semester records</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
