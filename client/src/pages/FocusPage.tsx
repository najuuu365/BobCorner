import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Flame, Waves, Coffee } from 'lucide-react';
import { focusApi } from '../services/focusApi';
import { FocusSession } from '../types';
import { PerformancePanel } from '../components/ui/PerformancePanel';

const TIMER_STATE_KEY = 'haven_focus_timer';
type TimerState = {
  mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  durationMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
};

const readTimerState = (): TimerState | null => {
  try {
    const saved = localStorage.getItem(TIMER_STATE_KEY);
    return saved ? JSON.parse(saved) as TimerState : null;
  } catch {
    return null;
  }
};

export const FocusPage: React.FC = () => {
  const { showToast } = useToast();

  const savedTimer = readTimerState();
  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>(savedTimer?.mode ?? 'FOCUS');
  const [durationMinutes, setDurationMinutes] = useState(savedTimer?.durationMinutes ?? 25);
  const [secondsLeft, setSecondsLeft] = useState(savedTimer?.secondsLeft ?? 25 * 60);
  const [isRunning, setIsRunning] = useState(savedTimer?.isRunning ?? false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [sessionNote, setSessionNote] = useState('');
  const [dailyGoal, setDailyGoal] = useState(() => Number(localStorage.getItem('haven_focus_goal')) || 60);
  const [hudMessage, setHudMessage] = useState('Choose a session and begin when you are ready.');

  // Ambient sound synthesis using Web Audio API
  const [soundType, setSoundType] = useState<'none' | 'rain' | 'waves' | 'cafe'>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<any>(null);

  useEffect(() => {
    focusApi.getSessions().then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({ mode, durationMinutes, secondsLeft, isRunning } satisfies TimerState));
  }, [mode, durationMinutes, secondsLeft, isRunning]);

  // Timer logic
  useEffect(() => {
  let interval: ReturnType<typeof setInterval> | null = null;

  if (isRunning && secondsLeft > 0) {
    if (mode === 'FOCUS') {
      notifyNori(
        'focused',
        'I will stay focused with you. Let’s do this.'
      );
    }

    interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
  }

  if (secondsLeft === 0 && isRunning) {
    setIsRunning(false);

    if (mode === 'FOCUS') {
      notifyNori(
        'celebrating',
        'Session complete! We did it!! 🎉'
      );
    }

    handleCompleteSession();
  }

  return () => {
    if (interval) {
      clearInterval(interval);
    }
  };
}, [isRunning, secondsLeft, mode]);
const notifyNori = (
  activity: 'focused' | 'happy' | 'celebrating' | 'idle',
  message?: string
) => {
  window.dispatchEvent(
    new CustomEvent('nori-action', {
      detail: {
        activity,
        message,
      },
    })
  );
};

  const handleCompleteSession = async (remainingSeconds = 0) => {
    const completedMinutes = Math.max(1, Math.round((durationMinutes * 60 - remainingSeconds) / 60));
    try {
      await focusApi.logSession(completedMinutes, mode, sessionNote.trim() || undefined);
      setSessionNote('');
      showToast(`🎉 Focus session logged: ${completedMinutes} minutes.`, 'success');
      const updated = await focusApi.getSessions();
      setSessions(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const completeEarly = async () => {
  if (!isRunning || mode !== 'FOCUS') return;

  setIsRunning(false);

  notifyNori(
    'celebrating',
    'You finished early?! That absolutely deserves a celebration!! 🎉'
  );

  await handleCompleteSession(secondsLeft);

  setSecondsLeft(durationMinutes * 60);

  setHudMessage(
    'Session saved early. A small win still counts.'
  );
};

  const exportFocusCsv = () => {
    const rows = [['Date', 'Type', 'Minutes', 'Notes'], ...sessions.map((session) => [new Date(session.createdAt).toISOString(), session.type, String(session.durationMinutes), session.notes || ''])];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'haven-focus-sessions.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const switchMode = (newMode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK', mins: number) => {
    setIsRunning(false);
    setMode(newMode);
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  // Web Audio Ambient Synthesizer
  const toggleSound = (type: 'none' | 'rain' | 'waves' | 'cafe') => {
    if (soundType === type) {
      stopAmbientSound();
      setSoundType('none');
      return;
    }

    stopAmbientSound();
    setSoundType(type);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : type === 'waves' ? 'bandpass' : 'lowpass';
      filter.frequency.value = type === 'rain' ? 800 : type === 'waves' ? 400 : 1200;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      soundNodeRef.current = whiteNoise;
    } catch (err) {
      console.error('Audio Synth failed:', err);
    }
  };

  const stopAmbientSound = () => {
    if (soundNodeRef.current) {
      try {
        soundNodeRef.current.stop();
      } catch (e) {}
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const totalSeconds = durationMinutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalFocusMinutesToday = sessions
    .filter((s) => s.type === 'FOCUS' && new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const goalPercent = Math.min(100, Math.round((totalFocusMinutesToday / Math.max(1, dailyGoal)) * 100));
  const weeklyFocus = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const minutes = sessions
      .filter((session) => session.type === 'FOCUS' && new Date(session.createdAt).toDateString() === day.toDateString())
      .reduce((sum, session) => sum + session.durationMinutes, 0);
    return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), minutes };
  });
  const weeklyMax = Math.max(...weeklyFocus.map((day) => day.minutes), 1);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 flex flex-col items-center justify-center min-h-[85vh]">
      {/* Header */}
      <div className="text-center space-y-2 max-w-md">
        <Badge variant="primary" size="md">
          Calm Workspace
        </Badge>
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
          Focus & Pomodoro Timer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Minimize distractions, immerse yourself in study, and track your deep work sessions.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap justify-center gap-2 p-1 bg-white dark:bg-slate-900 border border-haven-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <button
          onClick={() => switchMode('FOCUS', 25)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === 'FOCUS' && durationMinutes === 25 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => switchMode('FOCUS', 50)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === 'FOCUS' && durationMinutes === 50 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          50m Deep Focus
        </button>
        <button
          onClick={() => switchMode('SHORT_BREAK', 5)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === 'SHORT_BREAK' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          5m Break
        </button>
        <button
          onClick={() => switchMode('LONG_BREAK', 15)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            mode === 'LONG_BREAK' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          15m Rest
        </button>
      </div>

      {/* Radial Progress Timer Ring */}
      <div className="relative flex items-center justify-center my-4">
        <svg className="w-72 h-72 transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="120"
            className="stroke-haven-200 dark:stroke-slate-800 fill-none"
            strokeWidth="12"
          />
          <motion.circle
            cx="144"
            cy="144"
            r="120"
            className={`${
              mode === 'FOCUS'
                ? 'stroke-amber-600 dark:stroke-amber-400'
                : mode === 'SHORT_BREAK'
                ? 'stroke-emerald-600'
                : 'stroke-indigo-600'
            } fill-none`}
            strokeWidth="12"
            strokeDasharray="753.98"
            strokeDashoffset={753.98 - (753.98 * progressPercent) / 100}
            strokeLinecap="round"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        <div className="absolute text-center space-y-1">
          <span className="font-mono text-5xl font-bold tracking-tight text-slate-900 dark:text-white block">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
            {mode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          size="lg"
          variant={isRunning ? 'outline' : 'primary'}
          onClick={() => {
  setIsRunning((running) => {
    const nextRunning = !running;

    if (mode === 'FOCUS') {
      if (nextRunning) {
        notifyNori(
          'focused',
          'Focus mode activated. I am watching over this session.'
        );
      } else {
        notifyNori(
          'idle',
          'Taking a little pause.'
        );
      }
    }

    return nextRunning;
  });
}}  
          icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        >
          {isRunning ? 'Pause Session' : 'Start Session'}
        </Button>

        <Button size="lg" variant="outline" onClick={completeEarly} disabled={!isRunning || mode !== 'FOCUS'}>Complete early</Button>

        <Button
          size="lg"
          variant="ghost"
          onClick={() => {
            setIsRunning(false);
            setSecondsLeft(durationMinutes * 60);
          }}
          icon={<RotateCcw className="w-5 h-5" />}
        >
          Reset
        </Button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">{hudMessage}</p>

      <Card className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between gap-3"><div><span className="text-xs uppercase font-bold tracking-wider text-slate-400">Daily focus goal</span><p className="font-serif font-semibold text-slate-900 dark:text-white mt-1">{totalFocusMinutesToday} of {dailyGoal} minutes</p></div><input aria-label="Daily focus goal in minutes" type="number" min="1" value={dailyGoal} onChange={(event) => { const value = Math.max(1, Number(event.target.value)); setDailyGoal(value); localStorage.setItem('haven_focus_goal', String(value)); }} className="w-20 rounded-lg border border-haven-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm" /></div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${goalPercent}%` }} /></div>
        <textarea value={sessionNote} onChange={(event) => setSessionNote(event.target.value)} rows={2} placeholder="Add a note for the session you are about to finish..." className="w-full rounded-xl border border-haven-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs" />
      </Card>

      <Card className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between gap-2"><div><h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Focus analytics</h3><p className="text-xs text-slate-500">Last seven days, in minutes.</p></div><Button size="sm" variant="outline" onClick={exportFocusCsv}>Export CSV</Button></div>
        <div className="h-24 flex items-end gap-2 border-b border-haven-200 dark:border-slate-700">{weeklyFocus.map((day) => <div key={day.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1"><div className="w-full max-w-8 rounded-t bg-amber-500" style={{ height: `${Math.max(day.minutes ? 8 : 2, (day.minutes / weeklyMax) * 64)}px` }} /><span className="text-[10px] text-slate-400">{day.label}</span></div>)}</div>
      </Card>

      {/* Ambient Sound Synthesizer Controls */}
      <Card className="w-full max-w-md space-y-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Synthesized Ambient Sound generator
        </span>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => toggleSound('none')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              soundType === 'none'
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold'
                : 'border-haven-200 dark:border-slate-800 hover:bg-haven-50'
            }`}
          >
            <VolumeX className="w-4 h-4" />
            Mute
          </button>
          <button
            onClick={() => toggleSound('rain')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              soundType === 'rain'
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold'
                : 'border-haven-200 dark:border-slate-800 hover:bg-haven-50'
            }`}
          >
            <Waves className="w-4 h-4 text-sky-500" />
            Soft Rain
          </button>
          <button
            onClick={() => toggleSound('waves')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              soundType === 'waves'
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold'
                : 'border-haven-200 dark:border-slate-800 hover:bg-haven-50'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            Fireplace
          </button>
          <button
            onClick={() => toggleSound('cafe')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
              soundType === 'cafe'
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold'
                : 'border-haven-200 dark:border-slate-800 hover:bg-haven-50'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-700" />
            Café Ambient
          </button>
        </div>
      </Card>

      {/* Focus Daily Stats Footer */}
      <PerformancePanel title="Focus performance report" subtitle="Measured from completed local sessions." metrics={[
        { label: 'Today', value: `${totalFocusMinutesToday}m`, detail: `goal ${dailyGoal}m`, tone: 'amber' },
        { label: 'Sessions', value: sessions.length, detail: 'completed', tone: 'emerald' },
        { label: 'Seven days', value: `${weeklyFocus.reduce((total, day) => total + day.minutes, 0)}m`, detail: 'focused time', tone: 'sky' },
        { label: 'Goal', value: `${goalPercent}%`, detail: 'today achieved', tone: 'violet' },
      ]} />
      <Card className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Seven-day focus rhythm</h3>
          <span className="text-[10px] uppercase font-bold text-slate-400">minutes</span>
        </div>
        <div className="h-28 flex items-end justify-between gap-2 border-b border-haven-200 dark:border-slate-700 px-1">
          {weeklyFocus.map((day) => (
            <div key={day.label} className="h-full flex-1 flex flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-mono text-slate-500">{day.minutes || ''}</span>
              <div className="w-full max-w-7 rounded-t-md bg-amber-500/80" style={{ height: `${Math.max(day.minutes ? 8 : 2, (day.minutes / weeklyMax) * 78)}px` }} />
              <span className="text-[10px] text-slate-400">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {sessions.length > 0 && <Card className="w-full max-w-md space-y-3"><div className="flex items-center justify-between"><h3 className="font-serif font-semibold text-base text-slate-900 dark:text-white">Recent sessions</h3><span className="text-[10px] uppercase font-bold text-slate-400">{sessions.length} logged</span></div><div className="max-h-40 overflow-y-auto space-y-2">{sessions.slice(-6).reverse().map((session) => <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg bg-haven-50 dark:bg-slate-800 px-3 py-2 text-xs"><span className="font-semibold">{session.durationMinutes}m {session.type.replace('_', ' ').toLowerCase()}</span><span className="text-slate-400 truncate">{session.notes || new Date(session.createdAt).toLocaleDateString()}</span></div>)}</div></Card>}

      <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Focus Minutes Today: <strong className="text-slate-900 dark:text-white">{totalFocusMinutesToday} mins</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-500" />
          Completed Sessions: <strong className="text-slate-900 dark:text-white">{sessions.length}</strong>
        </span>
      </div>
    </div>
  );
};
