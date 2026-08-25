import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import { Button } from '../ui/Button';

import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Coffee,
  Eye,
  EyeOff
} from 'lucide-react';

import { booksApi } from '../../services/booksApi';

// Set up worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface PdfReaderProps {
  url: string;
  bookId: string;
  initialPage?: number;
  onHudVisibilityChange?: (visible: boolean) => void;
}

export const PdfReader: React.FC<PdfReaderProps> = ({
  url,
  bookId,
  initialPage = 1,
  onHudVisibilityChange
}) => {
  const readerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);

  const [pageNum, setPageNum] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);

  const [scale, setScale] = useState(1.2);

  const [theme, setTheme] =
    useState<'light' | 'dark' | 'sepia'>('light');

  const [readerError, setReaderError] =
    useState<string | null>(null);

  const [hudVisible, setHudVisible] = useState(true);

  const [showNavigationHint, setShowNavigationHint] =
    useState(true);

  const renderTaskRef =
    useRef<pdfjsLib.RenderTask | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchAtRef = useRef(0);

  useEffect(() => {
    onHudVisibilityChange?.(hudVisible);
  }, [hudVisible, onHudVisibilityChange]);

  // Load PDF
  useEffect(() => {
    setReaderError(null);
    setPdfDoc(null);
    setPageNum(initialPage);

    const loadingTask = pdfjsLib.getDocument({
      url,
      disableAutoFetch: false,
      disableStream: false
    });

    loadingTask.promise
      .then((doc) => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
      })
      .catch((err) => {
        console.error('Failed to load PDF document:', err);

        setReaderError(
          'This PDF could not be opened. Try re-uploading the original file.'
        );
      });

    return () => {
      loadingTask.destroy();
    };
  }, [url, initialPage]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);

        if (cancelled || !canvasRef.current) return;

        renderTaskRef.current?.cancel();

        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvasContext: context,
          viewport
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!cancelled) {
          booksApi
            .updateBook(bookId, {
              currentPage: pageNum,
              totalPages
            })
            .catch(() => {});
        }
      } catch (error: any) {
        if (
          error?.name !== 'RenderingCancelledException' &&
          !cancelled
        ) {
          console.error('PDF render error:', error);

          setReaderError(
            'This PDF page could not be rendered.'
          );
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;

      renderTaskRef.current?.cancel();
    };
  }, [
    pdfDoc,
    pageNum,
    scale,
    bookId,
    totalPages
  ]);

  // Hide navigation hint automatically
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowNavigationHint(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, []);

  const changePage = (delta: number) => {
    setPageNum((previous) => {
      return Math.max(
        1,
        Math.min(totalPages, previous + delta)
      );
    });
  };

  const goPrevious = () => {
    if (pageNum > 1) {
      changePage(-1);
    }
  };

  const goNext = () => {
    if (pageNum < totalPages) {
      changePage(1);
    }
  };

  const changeZoom = (delta: number) => {
    setScale((previous) => {
      const next = previous + delta;

      return Math.max(
        0.5,
        Math.min(3, Number(next.toFixed(1)))
      );
    });
  };

  const toggleReaderMode = async () => {
    try {
      if (hudVisible) {
        setHudVisible(false);

        if (!document.fullscreenElement) {
          await readerRef.current?.requestFullscreen();
        }
      } else {
        setHudVisible(true);

        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (
        event.key === 'ArrowRight' ||
        event.key === ' '
      ) {
        event.preventDefault();
        goNext();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        changeZoom(0.1);
      }

      if (event.key === '-') {
        event.preventDefault();
        changeZoom(-0.1);
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
  }, [pageNum, totalPages]);

  const handlePageClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (Date.now() - lastTouchAtRef.current < 500) return;
    const target = event.target as HTMLElement;

    // Don't trigger page navigation when clicking controls
    if (
      target.closest('button') ||
      target.closest('canvas')
    ) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const clickX = event.clientX - rect.left;

    if (clickX < rect.width * 0.25) {
      goPrevious();
    } else if (clickX > rect.width * 0.75) {
      goNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    lastTouchAtRef.current = Date.now();
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaX < 0 ? goNext() : goPrevious();
    } else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      const rect = event.currentTarget.getBoundingClientRect();
      touch.clientX - rect.left < rect.width / 2 ? goPrevious() : goNext();
    }
  };

  const readerBackground =
    theme === 'sepia'
      ? 'bg-[#e8dfcf]'
      : theme === 'dark'
      ? 'bg-slate-950'
      : 'bg-slate-100';

  return (
    <div
      ref={readerRef}
      className="relative flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-haven-200 dark:border-slate-800"
    >
      {/* Controls Bar */}
      {hudVisible && (
        <div className="relative z-30 shrink-0 flex items-center justify-between px-4 py-2.5 bg-haven-100/70 dark:bg-slate-800/80 border-b border-haven-200 dark:border-slate-700">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={goPrevious}
              disabled={pageNum <= 1}
              icon={
                <ChevronLeft className="w-4 h-4" />
              }
            >
              Prev
            </Button>

            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Page {pageNum} / {totalPages}
            </span>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={goNext}
              disabled={
                totalPages === 0 ||
                pageNum >= totalPages
              }
              icon={
                <ChevronRight className="w-4 h-4" />
              }
            >
              Next
            </Button>
          </div>

          {/* Zoom & Themes */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-haven-300 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => changeZoom(-0.1)}
                disabled={scale <= 0.5}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setScale(1)}
                className="min-w-11 px-1 text-[10px] font-mono hover:text-amber-600"
                title="Reset zoom"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => changeZoom(0.1)}
                disabled={scale >= 3}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Light mode"
              >
                <Sun className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'sepia'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Sepia mode"
              >
                <Coffee className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Dark mode"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main PDF Area */}
      <div
        onClick={handlePageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
        className={`relative z-0 flex-1 min-h-0 overflow-auto flex justify-center items-start p-6 transition-colors duration-300 ${readerBackground}`}
      >
        {readerError ? (
          <div className="flex items-center justify-center h-full text-center text-sm text-rose-600 dark:text-rose-300">
            {readerError}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-sm max-w-none"
          />
        )}

        {/* Temporary navigation hint */}
        {showNavigationHint && !readerError && (
          <div className="pointer-events-none fixed left-1/2 bottom-8 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-900/85 text-white text-xs shadow-xl animate-pulse">
            ← → Use arrow keys, or click the sides to turn pages
          </div>
        )}
      </div>

      {/* Footer */}
      {hudVisible && (
        <div className="relative z-30 shrink-0 flex items-center justify-between px-4 py-2 bg-haven-50 dark:bg-slate-800 border-t border-haven-200 dark:border-slate-700">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={goPrevious}
            disabled={pageNum <= 1}
            icon={
              <ChevronLeft className="w-4 h-4" />
            }
          >
            Previous
          </Button>

          <span className="text-xs text-slate-400 font-mono">
            Page {pageNum} / {totalPages}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={goNext}
            disabled={
              totalPages === 0 ||
              pageNum >= totalPages
            }
            icon={
              <ChevronRight className="w-4 h-4" />
            }
          >
            Next
          </Button>
        </div>
      )}

      {/* HUD + Fullscreen Toggle */}
      <button
        type="button"
        onClick={toggleReaderMode}
        className={`absolute z-50 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/90 text-white shadow-xl border border-white/10 transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 ${
          hudVisible
            ? 'bottom-3 right-4'
            : 'top-4 right-4 opacity-60 hover:opacity-100'
        }`}
        title={
          hudVisible
            ? 'Hide controls and enter fullscreen'
            : 'Show controls and exit fullscreen'
        }
      >
        {hudVisible ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};