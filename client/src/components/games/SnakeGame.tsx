import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

const GRID_SIZE = 16;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([
    { x: 8, y: 8 },
    { x: 8, y: 9 },
  ]);
  const [food, setFood] = useState<Position>({ x: 4, y: 4 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const directionRef = useRef<Direction>('UP');
  directionRef.current = direction;

  useEffect(() => {
    gamesApi.getScores().then(({ scores }) => {
      const s = scores.find((sc) => sc.gameKey === 'snake');
      if (s) setHighScore(s.highScore);
    }).catch(() => {});
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const initGame = useCallback(() => {
    const initialSnake = [
      { x: 8, y: 8 },
      { x: 8, y: 9 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('UP');
    directionRef.current = 'UP';
    setScore(0);
    setGameOver(false);
    setIsRunning(true);
  }, [generateFood]);

  // Main Snake Game Loop
  useEffect(() => {
    if (!isRunning || gameOver) return;

    const speed = Math.max(80, 160 - Math.floor(score / 20) * 10);
    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          setIsRunning(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          setIsRunning(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          setFood(generateFood(newSnake));

          if (newScore > highScore) {
            setHighScore(newScore);
            gamesApi.saveScore('snake', newScore).catch(() => {});
          }
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isRunning, gameOver, food, score, highScore, generateFood]);

  const changeDirection = (newDir: Direction) => {
    const curr = directionRef.current;
    if (
      (newDir === 'UP' && curr !== 'DOWN') ||
      (newDir === 'DOWN' && curr !== 'UP') ||
      (newDir === 'LEFT' && curr !== 'RIGHT') ||
      (newDir === 'RIGHT' && curr !== 'LEFT')
    ) {
      setDirection(newDir);
      directionRef.current = newDir;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) changeDirection('UP');
      else if (['ArrowDown', 'KeyS'].includes(e.code)) changeDirection('DOWN');
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) changeDirection('LEFT');
      else if (['ArrowRight', 'KeyD'].includes(e.code)) changeDirection('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
  const touch = e.touches[0];

  touchStart.current = {
    x: touch.clientX,
    y: touch.clientY,
  };
};

const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
  if (!touchStart.current) return;

  const touch = e.changedTouches[0];

  const deltaX = touch.clientX - touchStart.current.x;
  const deltaY = touch.clientY - touchStart.current.y;

  touchStart.current = null;

  const minSwipeDistance = 30;

  if (
    Math.abs(deltaX) < minSwipeDistance &&
    Math.abs(deltaY) < minSwipeDistance
  ) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    changeDirection(deltaX > 0 ? 'RIGHT' : 'LEFT');
  } else {
    changeDirection(deltaY > 0 ? 'DOWN' : 'UP');
  }
};

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
            Modern Snake Arcade
          </h2>
          <p className="text-xs text-slate-500">Collect apples and don't hit the walls!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{score}</p>
        </Card>
        <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" /> High Score
          </span>
          <p className="font-mono text-2xl font-bold text-amber-600">{highScore}</p>
        </Card>
      </div>

      {/* Grid Display Container */}
      <div
  className="relative aspect-square p-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden select-none touch-none"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
        <div className="w-full h-full grid grid-cols-16 gap-0.5" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);

            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.some((seg, idx) => idx > 0 && seg.x === x && seg.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`rounded-sm transition-colors ${
                  isHead
                    ? 'bg-amber-400 rounded-md shadow-md'
                    : isBody
                    ? 'bg-emerald-500'
                    : isFood
                    ? 'bg-rose-500 rounded-full animate-bounce'
                    : 'bg-slate-800/40'
                }`}
              />
            );
          })}
        </div>

        {(!isRunning || gameOver) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
            <h3 className="font-serif font-bold text-2xl text-white">
              {gameOver ? 'Snake Crashed!' : 'Ready to Play?'}
            </h3>
            <Button variant="primary" onClick={initGame} icon={<RotateCcw className="w-4 h-4" />}>
              {gameOver ? 'Try Again' : 'Start Game'}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      <div className="flex flex-col items-center gap-1 sm:hidden pt-2">
        <button onClick={() => changeDirection('UP')} className="p-3 bg-slate-800 rounded-xl text-white">
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-4">
          <button onClick={() => changeDirection('LEFT')} className="p-3 bg-slate-800 rounded-xl text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => changeDirection('RIGHT')} className="p-3 bg-slate-800 rounded-xl text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => changeDirection('DOWN')} className="p-3 bg-slate-800 rounded-xl text-white">
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
