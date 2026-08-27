import React, { useEffect, useRef, useState } from 'react';
import ePub, { Book as EpubBook, Rendition } from 'epubjs';

import { Button } from '../ui/Button';

import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { booksApi } from '../../services/booksApi';

interface EpubReaderProps {
  url: string;
  bookId: string;
  initialCfi?: string;
  onProgressUpdate?: (cfi: string, percentage: number) => void;
  onHudVisibilityChange?: (visible: boolean) => void;
}

export const EpubReader: React.FC<EpubReaderProps> = ({
  url,
  bookId,
  initialCfi,
  onProgressUpdate,
  onHudVisibilityChange,
}) => {
  const readerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renditionRef = useRef<Rendition | null>(null);
  const epubBookRef = useRef<EpubBook | null>(null);

  const currentCfiRef = useRef(initialCfi || '');

  const [fontSize, setFontSize] = useState(100);

  const [toc, setToc] = useState<
    { label: string; href: string }[]
  >([]);

  const [theme, setTheme] = useState<
    'light' | 'dark' | 'sepia'
  >('light');

  const [readerError, setReaderError] = useState<string | null>(null);

  const [hudVisible, setHudVisible] = useState(true);

  const [showHint, setShowHint] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchAtRef = useRef(0);

  useEffect(() => {
  const handleResize = () => {
    if (!containerRef.current || !renditionRef.current) return;

    renditionRef.current.resize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );

    if (currentCfiRef.current) {
      renditionRef.current.display(currentCfiRef.current);
    }
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

  useEffect(() => {
    onHudVisibilityChange?.(hudVisible);
  }, [hudVisible, onHudVisibilityChange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowHint(false);
    }, 4500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    const loadBook = async () => {
      try {
        setLoading(true);
        setReaderError(null);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch EPUB');
        }

        const arrayBuffer = await response.arrayBuffer();

        if (destroyed) return;

        const book = ePub(arrayBuffer);

        epubBookRef.current = book;

        await book.ready;

        if (destroyed || !containerRef.current) return;

        const rendition = book.renderTo(
          containerRef.current,
          {
            width: '100%',
            height: '100%',
            spread: 'none',
            flow: 'paginated',
          }
        );

        renditionRef.current = rendition;

        rendition.on('rendered', (_section:any, view:any) => {
  const document = view.document;

  let startX = 0;
  let startY = 0;

  document.addEventListener(
    'touchstart',
    (event:any) => {
      const touch = event.touches[0];

      startX = touch.clientX;
      startY = touch.clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    (event:any) => {
      const touch = event.changedTouches[0];

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (
        Math.abs(deltaX) < 40 ||
        Math.abs(deltaX) < Math.abs(deltaY)
      ) {
        return;
      }

      if (deltaX < 0) {
        void rendition.next();
      } else {
        void rendition.prev();
      }
    },
    { passive: true }
  );
});


        rendition.themes.register('light', {
          body: {
            background: '#ffffff !important',
            color: '#1e293b !important',
          },
        });

        rendition.themes.register('dark', {
          body: {
            background: '#0f172a !important',
            color: '#f8fafc !important',
          },
        });

        rendition.themes.register('sepia', {
          body: {
            background: '#f8f1e5 !important',
            color: '#433422 !important',
          },
        });

        rendition.themes.select(theme);

        rendition.themes.fontSize(`${fontSize}%`);

        rendition.on('relocated', (location: any) => {
          if (!location?.start) return;

          const cfi = location.start.cfi;

          currentCfiRef.current = cfi;

          if (
            typeof location.start.displayed?.page ===
            'number'
          ) {
            setCurrentPage(
              location.start.displayed.page + 1
            );
          }

          if (
            typeof location.start.displayed?.total ===
            'number'
          ) {
            setTotalPages(
              location.start.displayed.total
            );
          }

          let percentage = 0;

          try {
            percentage =
              book.locations.percentageFromCfi(cfi);
          } catch {
            percentage = 0;
          }

          if (
            onProgressUpdate &&
            typeof percentage === 'number' &&
            !Number.isNaN(percentage)
          ) {
            onProgressUpdate(
              cfi,
              Math.round(percentage * 100)
            );
          }

          booksApi
            .updateBook(bookId, {
              currentCfi: cfi,
            })
            .catch(() => {});
        });

        book.loaded.navigation
          .then((nav) => {
            if (!destroyed) {
              setToc(nav.toc);
            }
          })
          .catch(() => {});

        await rendition.display(initialCfi || undefined);

        if (!destroyed) {
          setLoading(false);
        }

        book.locations
          .generate(1024)
          .catch(() => {});
      } catch (error) {
        console.error(
          'Failed to load EPUB:',
          error
        );

        if (!destroyed) {
          setReaderError(
            'This EPUB could not be opened. The file may be invalid, corrupted, or unavailable.'
          );

          setLoading(false);
        }
      }
    };

    loadBook(
      
    );

    

    return () => {
      destroyed = true;

      try {
        renditionRef.current?.destroy();
      } catch {}

      try {
        epubBookRef.current?.destroy();
      } catch {}

      renditionRef.current = null;
      epubBookRef.current = null;
    };
  }, [url]);

  const changeFontSize = (delta: number) => {
    const currentCfi = currentCfiRef.current;

    setFontSize((previous) => {
      const next = Math.max(
        70,
        Math.min(220, previous + delta)
      );

      const rendition = renditionRef.current;

      if (rendition) {
        rendition.themes.fontSize(`${next}%`);

        window.setTimeout(() => {
          if (containerRef.current) {
  renditionRef.current?.resize(
    containerRef.current.clientWidth,
    containerRef.current.clientHeight
  );
}

          if (currentCfi) {
            rendition.display(currentCfi);
          }
        }, 100);
      }

      return next;
    });
  };

  const applyTheme = (
    newTheme: 'light' | 'dark' | 'sepia'
  ) => {
    setTheme(newTheme);

    renditionRef.current?.themes.select(newTheme);

    window.setTimeout(() => {
      if (containerRef.current) {
  renditionRef.current?.resize(
    containerRef.current.clientWidth,
    containerRef.current.clientHeight
  );
}

      if (currentCfiRef.current) {
        renditionRef.current?.display(
          currentCfiRef.current
        );
      }
    }, 50);
  };

  const changePage = (
    direction: 'next' | 'prev'
  ) => {
    if (!renditionRef.current || loading) return;

    if (direction === 'next') {
      void renditionRef.current.next().catch(() => {});
    } else {
      void renditionRef.current.prev().catch(() => {});
    }
  };

 const handleTouchStart = (
  event: React.TouchEvent<HTMLDivElement>
) => {
  const touch = event.touches[0];

  touchStartRef.current = {
    x: touch.clientX,
    y: touch.clientY,
  };

  lastTouchAtRef.current = Date.now();
};

const handleTouchEnd = (
  event: React.TouchEvent<HTMLDivElement>
) => {
  const start = touchStartRef.current;
  touchStartRef.current = null;

  if (!start) return;

  const touch = event.changedTouches[0];

  const deltaX = touch.clientX - start.x;
  const deltaY = touch.clientY - start.y;

  const minSwipeDistance = 40;

  if (
    Math.abs(deltaX) < minSwipeDistance ||
    Math.abs(deltaX) < Math.abs(deltaY)
  ) {
    return;
  }

  lastTouchAtRef.current = Date.now();

  if (deltaX < 0) {
    changePage('next');
  } else {
    changePage('prev');
  }
};

  const handleReaderClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (Date.now() - lastTouchAtRef.current < 500) return;
    const target = event.target as HTMLElement;

    if (
      target.closest('button') ||
      target.closest('select')
    ) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const clickX =
      event.clientX - rect.left;

    if (clickX < rect.width * 0.28) {
      changePage('prev');
    } else if (clickX > rect.width * 0.72) {
      changePage('next');
    }
  };

  const toggleReaderMode = async () => {
  try {
    if (hudVisible) {
      setHudVisible(false);
      setShowHint(false);

      if (!document.fullscreenElement && readerRef.current) {
        await readerRef.current.requestFullscreen();

        setTimeout(() => {
          if (containerRef.current && renditionRef.current) {
            renditionRef.current.resize(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            );

            if (currentCfiRef.current) {
              renditionRef.current.display(currentCfiRef.current);
            }
          }
        }, 150);
      }
    } else {
      setHudVisible(true);

      if (document.fullscreenElement) {
        await document.exitFullscreen();

        setTimeout(() => {
          if (containerRef.current && renditionRef.current) {
            renditionRef.current.resize(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            );

            if (currentCfiRef.current) {
              renditionRef.current.display(currentCfiRef.current);
            }
          }
        }, 150);
      }
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
  }
};

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const activeElement =
        document.activeElement;

      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        changePage('next');
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        changePage('prev');
      }

      if (event.key === ' ') {
        event.preventDefault();
        changePage('next');
      }

      if (
        event.key === 'Escape' &&
        !hudVisible
      ) {
        setHudVisible(true);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [hudVisible]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setHudVisible(true);
      }
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  return (
    <div
      ref={readerRef}
      className="relative flex flex-col h-full min-h-[500px] overflow-hidden rounded-2xl border border-haven-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      {hudVisible && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-haven-200 bg-haven-100/70 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
          <select
            onChange={(event) =>
              renditionRef.current?.display(
                event.target.value
              )
            }
            className="min-w-0 max-w-full flex-1 truncate rounded-lg border border-haven-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 sm:max-w-xs sm:flex-none"
          >
            <option value="">
              Chapters / Table of Contents
            </option>

            {toc.map((item, index) => (
              <option
                key={index}
                value={item.href}
              >
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-haven-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() =>
                  changeFontSize(-5)
                }
                className="rounded p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <span className="min-w-[45px] text-center text-[10px] font-mono">
                {fontSize}%
              </span>

              <button
                type="button"
                onClick={() =>
                  changeFontSize(5)
                }
                className="rounded p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  applyTheme('light')
                }
                className={`rounded-lg p-2 transition ${
                  theme === 'light'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Light mode"
              >
                <Sun className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTheme('sepia')
                }
                className={`rounded-lg p-2 transition ${
                  theme === 'sepia'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Sepia mode"
              >
                <Coffee className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  applyTheme('dark')
                }
                className={`rounded-lg p-2 transition ${
                  theme === 'dark'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative flex-1 overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-950'
            : theme === 'sepia'
              ? 'bg-[#f8f1e5]'
              : 'bg-white'
        }`}
        onClick={handleReaderClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {loading && !readerError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 text-sm text-slate-500 dark:bg-slate-950/80">
            Opening EPUB...
          </div>
        )}

        {readerError ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-rose-600 dark:text-rose-300">
            {readerError}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full"
          />
        )}

        {showHint && !loading && !readerError && (
          <div className="pointer-events-none absolute bottom-8 left-1/2 z-40 -translate-x-1/2 animate-pulse">
            <div className="whitespace-nowrap rounded-full bg-slate-900/90 px-4 py-2 text-xs text-white shadow-xl">
              ← Click the sides, use ← →, or press
              Space to turn pages →
            </div>
          </div>
        )}
      </div>

      {hudVisible && (
        <div className="flex items-center justify-between border-t border-haven-200 bg-haven-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              changePage('prev')
            }
            icon={
              <ChevronLeft className="h-4 w-4" />
            }
          >
            Previous
          </Button>

          <span className="text-xs font-mono text-slate-400">
            {totalPages > 0
              ? `Page ${currentPage} / ${totalPages}`
              : `Page ${currentPage}`}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              changePage('next')
            }
            icon={
              <ChevronRight className="h-4 w-4" />
            }
          >
            Next
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={toggleReaderMode}
        className="
          absolute
          right-4
          top-28
          z-50
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          border
          border-white/20
          bg-slate-900
          text-white
          shadow-2xl
          transition-all
          hover:scale-110
          hover:bg-slate-800
          active:scale-95
        "
        title={
          hudVisible
            ? 'Focus mode — hide controls and enter fullscreen'
            : 'Exit focus mode'
        }
      >
        {hudVisible ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};