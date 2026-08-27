import React, { useState, useEffect } from 'react';
import { Game2048 } from '../components/games/Game2048';
import { WordleGame } from '../components/games/WordleGame';
import { MemoryMatch } from '../components/games/MemoryMatch';
import { GuessTheBook } from '../components/games/GuessTheBook';
import { ReactionGame } from '../components/games/ReactionGame';
import { SnakeGame } from '../components/games/SnakeGame';
import { CatChaseGame } from '../components/games/CatChaseGame';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ColorTrapGame } from '../components/games/ColorTrapGame';
import { IdleTycoonGame } from '../components/games/IdleTycoonGame';
import { 
  Gamepad2, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  Trophy, 
  Sparkles, 
  Brain, 
  Cat, 
  Grid, 
  ArrowLeft,
  Flame
} from 'lucide-react';
import { gamesApi } from '../services/gamesApi';
import { GameScore, GameStatistic } from '../types';
import { PerformancePanel } from '../components/ui/PerformancePanel';

type GameKey = 'hub' | '2048' | 'wordle' | 'memory' | 'guess_book' | 'reaction' | 'snake' | 'cat_chase' | 'color_trap' | 'idle_tycoon';

export const GamesPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameKey>('hub');
  const [scores, setScores] = useState<GameScore[]>([]);
  const [stats, setStats] = useState<GameStatistic[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PUZZLE' | 'QUICK' | 'BOOK' | 'HIGH_SCORE'>('ALL');

  const loadScores = async () => {
    try {
      const res = await gamesApi.getScores();
      setScores(res.scores);
      setStats(res.stats);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadScores();
  }, [activeGame]);

  const gamesList = [
    {
      key: 'cat_chase',
      title: 'Cat Chase ',
      category: 'QUICK',
      icon: '🐱',
      description: 'Put the cat in a chokehold',
      badge: 'New & Playful',
    },
    {
      key: '2048',
      title: 'Nerd 2048',
      category: 'PUZZLE',
      icon: '📚',
      description: 'Combine tiles from Page → Chapter → x → y, wasn\'t 2048 nerdy enough?',
      badge: 'Classic Favorite',
    },
    // {
    //   key: 'wordle',
    //   title: 'Word Sleuth',
    //   category: 'BOOK',
    //   icon: '🔤',
    //   description: '5-letter literary word guessing puzzle with 6 attempts.',
    //   badge: 'Word Game',
    // },
    {
      key: 'memory',
      title: 'Memory Match',
      category: 'PUZZLE',
      icon: '🃏',
      description: 'Only the smartest genuisest can match more than 3 pairs',
      badge: 'Memory',
    },
    // {
    //   key: 'guess_book',
    //   title: 'Guess the Book',
    //   category: 'BOOK',
    //   icon: '📖',
    //   description: 'Read plot, character, and setting clues to identify classic books.',
    //   badge: 'Trivia',
    // },
    {
      key: 'reaction',
      title: 'Reaction Test',
      category: 'QUICK',
      icon: '⚡',
      description: 'Can you beat a goldenfish?',
      badge: 'Reflexes',
    },
    {
      key: 'snake',
      title: 'Modern Snake',
      category: 'HIGH_SCORE',
      icon: '🐍',
      description: 'Play as my classmates!',
      badge: 'Arcade',
    },
    {
      key: 'color_trap',
      title: 'Color Trap',
      category: 'HIGH_SCORE',
      icon: '🎨',
      description: 'Seizure Warning',
      badge: 'Reflexes',

    },
    {
      key: 'idle_tycoon',
      title: 'Bobbb Business.',
      category: 'HIGH_SCORE',
      icon: '🏭',
      description: 'Gettin bread homie',
      badge: 'Idle Tycoon',
    },
  ];

  const filteredGames = gamesList.filter((g) =>
    categoryFilter === 'ALL' ? true : g.category === categoryFilter
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            Mini Game Arcade Hub <Gamepad2 className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enjoy 7 polished games for playful relaxation and brain warmups.
          </p>
        </div>

        {activeGame !== 'hub' && (
          <Button
            variant="outline"
            onClick={() => setActiveGame('hub')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Game Hub
          </Button>
        )}
      </div>

      {/* VIEW 1: GAME HUB ARCADE LAUNCHER */}
      {activeGame === 'hub' && (
        <div className="space-y-8">
          {/* Featured Game Hero Card */}
          <Card className="bg-gradient-to-r from-amber-600 via-haven-800 to-slate-900 text-white p-6 rounded-3xl border-none shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <Badge variant="primary" className="bg-amber-400 text-slate-950 font-bold">
                Featured Arcade Game
              </Badge>
              <h2 className="text-3xl font-serif font-bold">Cat Chase Arcade 🐱</h2>
              <p className="text-xs text-amber-100 max-w-lg leading-relaxed">
                
              </p>
              <Button variant="secondary" onClick={() => setActiveGame('cat_chase')} icon={<Sparkles className="w-4 h-4 text-amber-600" />}>
                Play Cat Chase Now
              </Button>
            </div>

            <div className="text-6xl p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              😼
            </div>
          </Card>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            {(['ALL', 'PUZZLE', 'QUICK', 'BOOK', 'HIGH_SCORE'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? `All ${gamesList.length} Games` : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Games Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredGames.map((g) => {
              const gameScoreObj = scores.find((s) => s.gameKey === g.key);
              return (
                <Card
                  key={g.key}
                  hoverEffect
                  onClick={() => setActiveGame(g.key as GameKey)}
                  className="cursor-pointer space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{g.icon}</span>
                      <Badge variant="primary">{g.badge}</Badge>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                        {g.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {g.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-haven-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Best: {gameScoreObj ? gameScoreObj.highScore : 0}
                    </span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Play Game →</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <PerformancePanel title="Arcade performance report" subtitle="Your persistent play history across every game." metrics={[
            { label: 'Games played', value: stats.reduce((total, stat) => total + stat.gamesPlayed, 0), detail: 'all time', tone: 'violet' },
            { label: 'Wins', value: stats.reduce((total, stat) => total + stat.gamesWon, 0), detail: 'recorded', tone: 'emerald' },
            { label: 'Best score', value: scores.reduce((best, score) => Math.max(best, score.highScore), 0), detail: 'personal best', tone: 'amber' },
            { label: 'Games tracked', value: stats.length, detail: 'with statistics', tone: 'sky' },
          ]} />
        </div>
      )}

      {/* VIEW 2: ACTIVE GAME PLAY AREA */}
      {activeGame !== 'hub' && (
        <div className="py-2">
          {activeGame === '2048' && <Game2048 />}
          {activeGame === 'wordle' && <WordleGame />}
          {activeGame === 'memory' && <MemoryMatch />}
          {activeGame === 'guess_book' && <GuessTheBook />}
          {activeGame === 'reaction' && <ReactionGame />}
          {activeGame === 'snake' && <SnakeGame />}
          {activeGame === 'cat_chase' && <CatChaseGame />}
          {activeGame === 'color_trap' && <ColorTrapGame />}
          {activeGame === 'idle_tycoon' && <IdleTycoonGame />}
        </div>
      )}
    </div>
  );
};
