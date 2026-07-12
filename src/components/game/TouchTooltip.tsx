'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface TouchTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Tooltip that works on both desktop (hover) and mobile (long-press).
 * On touch devices, press-and-hold for 500ms reveals the tooltip.
 */
export function TouchTooltip({ content, children, side = 'top' }: TouchTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const show = (x?: number, y?: number) => {
    if (x !== undefined && y !== undefined) setCoords({ x, y });
    else setCoords(null);
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    setCoords(null);
  };

  // Desktop hover
  const handleMouseEnter = () => show();
  const handleMouseLeave = () => hide();

  // Mobile long-press
  const handleTouchStart = (e: React.TouchEvent) => {
    longPressed.current = false;
    const touch = e.touches[0];
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      show(touch.clientX, touch.clientY);
      // Prevent context menu on long press
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    // Hide tooltip shortly after release if it was long-pressed
    if (longPressed.current) {
      setTimeout(() => hide(), 1500);
    }
  };

  const handleTouchMove = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    hide();
  };

  // Prevent native context menu on long-press
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const prevent = (e: Event) => {
      if (longPressed.current) e.preventDefault();
    };
    el.addEventListener('contextmenu', prevent);
    return () => el.removeEventListener('contextmenu', prevent);
  }, []);

  // Position the tooltip
  const sideClass =
    side === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : side === 'bottom'
        ? 'top-full left-1/2 -translate-x-1/2 mt-2'
        : side === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 mr-2'
          : 'left-full top-1/2 -translate-y-1/2 ml-2';

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {children}
      {visible && (
        <div
          className={`pointer-events-none absolute z-50 ${sideClass} ${coords ? 'fixed' : ''}`}
          style={coords ? { left: coords.x, top: coords.y, transform: 'translate(-50%, -120%)' } : undefined}
        >
          <div className="rounded-md bg-foreground/95 px-3 py-2 text-xs text-background shadow-lg max-w-[220px] text-center">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
