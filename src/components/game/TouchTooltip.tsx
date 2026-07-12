'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface TouchTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/**
 * Simple, reliable tooltip — works on desktop (hover) and mobile (long-press 350ms).
 * Uses pointer events (works on mouse + touch + pen).
 * Positions tooltip relative to element using getBoundingClientRect.
 */
export function TouchTooltip({ content, children, side = 'top', className }: TouchTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const show = () => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 240;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    // Keep on screen
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
    let top: number;
    if (side === 'top') {
      top = rect.top - 8; // tooltip will be above, translated up by its height
    } else {
      top = rect.bottom + 8;
    }
    setPos({ top, left });
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    setPos(null);
  };

  // Desktop hover
  const handleMouseEnter = () => show();
  const handleMouseLeave = () => hide();

  // Mobile long-press via pointer events
  const handlePointerDown = () => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      show();
      // Light vibration on Android
      try {
        if (navigator.vibrate) navigator.vibrate(15);
      } catch {
        /* ignore */
      }
    }, 350);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (longPressed.current) {
      setTimeout(() => hide(), 2500);
    }
  };

  const handlePointerMove = () => {
    if (pressTimer.current && !longPressed.current) {
      // Cancel on move (scrolling)
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // Prevent context menu on long-press
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const prevent = (e: Event) => {
      if (longPressed.current) e.preventDefault();
    };
    el.addEventListener('contextmenu', prevent);
    return () => el.removeEventListener('contextmenu', prevent);
  }, []);

  return (
    <>
      <div
        ref={wrapRef}
        className={className ?? 'relative inline-flex'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        style={{ WebkitTouchCallout: 'none', touchAction: 'auto' }}
      >
        {children}
      </div>
      {visible && pos && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: side === 'top' ? pos.top : pos.top,
            left: pos.left,
            width: 240,
            transform: side === 'top' ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          <div className="rounded-lg bg-foreground/95 px-3 py-2 text-xs text-background shadow-xl text-center leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
