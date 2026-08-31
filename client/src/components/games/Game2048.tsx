import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RotateCcw, Award, BookOpen, Hash, Sparkles, Undo, Eye, EyeOff } from 'lucide-react';
import { gamesApi } from '../../services/gamesApi';
import confetti from 'canvas-confetti';

type ThemeMode = 'literary' | 'numbers';

interface TileVisual {
  title: string;
  icon: string;
  bg: string;
  text: string;
}

const TILE_VISUALS: Record<number, TileVisual> = {
  2: { title: 'Page', icon: '📄', bg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 text-amber-900 dark:text-amber-200', text: 'text-amber-900' },
  4: { title: 'Chapter', icon: '🔖', bg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 text-rose-950 dark:text-rose-200', text: 'text-rose-950' },
  8: { title: 'Book', icon: '📖', bg: 'bg-orange-200 dark:bg-orange-950/80 border-orange-400 text-orange-950 dark:text-orange-200', text: 'text-orange-950' },
  16: { title: 'Stack', icon: '📚', bg: 'bg-emerald-200 dark:bg-emerald-950/80 border-emerald-400 text-emerald-950 dark:text-emerald-200', text: 'text-emerald-950' },
  32: { title: 'Collection', icon: '🏺', bg: 'bg-sky-200 dark:bg-sky-950/80 border-sky-400 text-sky-950 dark:text-sky-200', text: 'text-sky-950' },
  64: { title: 'Series', icon: '📜', bg: 'bg-indigo-300 dark:bg-indigo-950/80 border-indigo-500 text-indigo-950 dark:text-indigo-200', text: 'text-indigo-950' },
  128: { title: 'Archive', icon: '🌟', bg: 'bg-purple-300 dark:bg-purple-950/80 border-purple-500 text-purple-950 dark:text-purple-200 font-bold', text: 'text-purple-950' },
  256: { title: 'Library', icon: '🏛️', bg: 'bg-amber-400 dark:bg-amber-700 border-amber-600 text-slate-950 dark:text-white font-bold', text: 'text-slate-950' },
  512: { title: 'Masterpiece', icon: '👑', bg: 'bg-emerald-400 dark:bg-emerald-700 border-emerald-600 text-slate-950 dark:text-white font-bold', text: 'text-slate-950' },
  1024: { title: 'Grand Sanctuary', icon: '🏰', bg: 'bg-indigo-500 dark:bg-indigo-700 border-indigo-700 text-white font-bold', text: 'text-white' },
  2048: { title: 'Literary Pantheon', icon: '🌌', bg: 'bg-purple-600 dark:bg-purple-800 border-purple-800 text-white font-bold shadow-lg', text: 'text-white' },
};

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-[11px] rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Game2048: React.FC = () => {
  const [board, setBoard] = useState<number[][]>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [prevBoard, setPrevBoard] = useState<number[][] | null>(null);
  const [score, setScore] = useState(0);
  const [prevScore, setPrevScore] = useState<number>(0);
  const [highScore, setHighScore] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>('literary');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gamesApi.getScores().then(({ scores }) => {
      const g = scores.find((s) => s.gameKey === '2048');
      if (g) setHighScore(g.highScore);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFocusMode(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const addRandomTile = useCallback((grid: number[][]): number[][] => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return grid;
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { r, c } = emptyCells[randomIndex];
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    let emptyBoard = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    emptyBoard = addRandomTile(emptyBoard);
    emptyBoard = addRandomTile(emptyBoard);
    setBoard(emptyBoard);
    setPrevBoard(null);
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const slideRow = (row: number[]): { newRow: number[]; gainedScore: number } => {
    const nonZero = row.filter((val) => val !== 0);
    const newRow: number[] = [];
    let gainedScore = 0;
    for (let i = 0; i < nonZero.length; i++) {
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        newRow.push(mergedVal);
        gainedScore += mergedVal;
        if (mergedVal === 2048 && !won) {
          setWon(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
        i++;
      } else {
        newRow.push(nonZero[i]);
      }
    }
    while (newRow.length < 4) newRow.push(0);
    return { newRow, gainedScore };
  };

  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver) return;
      let currentGrid = board.map((r) => [...r]);
      let totalGainedScore = 0;
      let changed = false;

      const rotateLeft = (matrix: number[][]) => {
        const res = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++)
            res[3 - c][r] = matrix[r][c];
        return res;
      };

      if (direction === 'UP') currentGrid = rotateLeft(currentGrid);
      else if (direction === 'RIGHT') currentGrid = rotateLeft(rotateLeft(currentGrid));
      else if (direction === 'DOWN') currentGrid = rotateLeft(rotateLeft(rotateLeft(currentGrid)));

      const newGrid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
      for (let r = 0; r < 4; r++) {
        const { newRow, gainedScore } = slideRow(currentGrid[r]);
        newGrid[r] = newRow;
        totalGainedScore += gainedScore;
        if (newRow.some((val, idx) => val !== currentGrid[r][idx])) changed = true;
      }

      let finalGrid = newGrid;
      if (direction === 'UP') finalGrid = rotateLeft(rotateLeft(rotateLeft(newGrid)));
      else if (direction === 'RIGHT') finalGrid = rotateLeft(rotateLeft(newGrid));
      else if (direction === 'DOWN') finalGrid = rotateLeft(newGrid);

      if (changed) {
        setPrevBoard(board);
        setPrevScore(score);
        const withRandom = addRandomTile(finalGrid);
        setBoard(withRandom);
        const newScore = score + totalGainedScore;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          gamesApi.saveScore('2048', newScore, won).catch(() => {});
        }
        let canMove = false;
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++) {
            if (withRandom[r][c] === 0) canMove = true;
            if (c < 3 && withRandom[r][c] === withRandom[r][c + 1]) canMove = true;
            if (r < 3 && withRandom[r][c] === withRandom[r + 1][c]) canMove = true;
          }
        if (!canMove) setGameOver(true);
      }
    },
    [board, gameOver, addRandomTile, score, highScore, won]
  );

  const handleUndo = () => {
    if (prevBoard) {
      setBoard(prevBoard);
      setScore(prevScore);
      setPrevBoard(null);
      setGameOver(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); move('UP'); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); move('DOWN'); }
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); move('LEFT'); }
      else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); move('RIGHT'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? 'RIGHT' : 'LEFT');
    else move(deltaY > 0 ? 'DOWN' : 'UP');
  };

  const toggleFocusMode = async () => {
    if (!focusMode) {
      await containerRef.current?.requestFullscreen?.();
      setFocusMode(true);
    } else {
      if (document.fullscreenElement) await document.exitFullscreen();
      setFocusMode(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={focusMode ? 'fixed inset-0 z-50 bg-slate-950 flex items-center justify-center' : 'space-y-6 max-w-md mx-auto'}
    >
      {/* Header controls */}
      {!focusMode && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              Literary 2048 <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-xs text-slate-500">Combine tiles to build a Literary Pantheon!</p>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip text="Focus mode — hides everything, just the board">
              <button
                onClick={toggleFocusMode}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-haven-100 dark:hover:bg-slate-800 transition-all"
              >
                <Eye className="w-4 h-4" />
              </button>
            </Tooltip>

            <div className="flex items-center gap-1.5 p-1 bg-haven-100 dark:bg-slate-800 rounded-xl">
              <Tooltip text="Literary mode — tiles show book icons">
                <button
                  onClick={() => setTheme('literary')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    theme === 'literary' ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip text="Numbers mode — plain tile values">
                <button
                  onClick={() => setTheme('numbers')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    theme === 'numbers' ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* Scores & Undo */}
      {!focusMode && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">{score}</p>
          </Card>

          <Card className="p-2.5 text-center bg-haven-100/70 dark:bg-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-amber-500" /> High Score
            </span>
            <p className="font-mono text-xl font-bold text-amber-700 dark:text-amber-400">{highScore}</p>
          </Card>

          <Tooltip text="Undo your last move">
            <button
              onClick={handleUndo}
              disabled={!prevBoard}
              className="w-full p-2.5 rounded-2xl border border-haven-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center disabled:opacity-40 transition-all hover:bg-haven-50"
            >
              <Undo className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">Undo</span>
            </button>
          </Tooltip>
        </div>
      )}

      {/* 4x4 Grid Container */}
      <div
        className={`relative p-3 bg-slate-800/90 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-700 touch-none${focusMode ? ' w-[min(90vw,90vh)] aspect-square' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {focusMode && (
          <Tooltip text="Exit focus mode">
            <button
              onClick={toggleFocusMode}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </Tooltip>
        )}

        <div className="grid grid-cols-4 gap-2.5 aspect-square">
          {board.map((row, r) =>
            row.map((val, c) => {
              const info = TILE_VISUALS[val];
              return (
                <div
                  key={`${r}-${c}`}
                  className="w-full h-full rounded-xl bg-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden select-none"
                >
                  {val > 0 && (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`w-full h-full rounded-xl flex flex-col items-center justify-center border shadow-xs ${
                        info ? info.bg : 'bg-purple-600 text-white font-bold border-purple-800'
                      }`}
                    >
                      {theme === 'literary' && info ? (
                        <>
                          <span className="text-lg leading-none">{info.icon}</span>
                          <span className="text-[10px] font-bold tracking-tight mt-0.5 px-0.5 text-center leading-tight truncate w-full">
                            {info.title}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-xl font-bold">{val}</span>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Game Over / Victory Overlay */}
        <AnimatePresence>
          {(gameOver || won) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 space-y-4"
            >
              <h3 className="font-serif font-bold text-2xl text-white">
                {won ? '🌌 Pantheon Achieved!' : 'Game Over!'}
              </h3>
              <p className="text-xs text-slate-300">
                {won ? 'Congratulations! You unlocked the Literary Pantheon.' : `Final score: ${score} points!`}
              </p>
              <Button variant="primary" onClick={initGame} icon={<RotateCcw className="w-4 h-4" />}>
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!focusMode && (
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Use Arrow Keys or WASD to slide.</span>
          <button onClick={initGame} className="text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Restart
          </button>
        </div>
      )}
    </div>
  );
};
