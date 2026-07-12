'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface TouchTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Tooltip that works on both desktop (hover) and mobile (long-press 500ms).
 * On touch devices, press-and-hold reveals the tooltip.
 *
 * IMPORTANT: Does NOT use touch-action:manipulation (it blocks long-press on some browsers).
 * Instead, uses pointer events for reliable cross-platform detection.
 */
export function TouchTooltip({ content, children, side = 'top', className }: TouchTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

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

  // Mobile long-press — 500ms threshold
  const handleTouchStart = (e: React.TouchEvent) => {
    longPressed.current = false;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      show(touch.clientX, touch.clientY);
      // Light vibration if supported (Android Chrome)
      try {
        if (navigator.vibrate) navigator.vibrate(15);
      } catch {
        /* ignore */
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (longPressed.current) {
      // Keep tooltip visible for 2.5 seconds after release
      setTimeout(() => hide(), 2500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long-press if finger moves more than 10px (scrolling)
    if (pressTimer.current && touchStartPos.current) {
      const touch = e.touches[0];
      if (touch) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(pressTimer.current);
          pressTimer.current = null;
          hide();
        }
      }
    }
  };

  // Prevent native context menu on long-press (iOS/Android)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const prevent = (e: Event) => {
      if (longPressed.current) e.preventDefault();
    };
    el.addEventListener('contextmenu', prevent);
    return () => el.removeEventListener('contextmenu', prevent);
  }, []);

  const sideClass =
    side === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : side === 'bottom'
        ? 'top-full left-1/2 -translate-x-1/2 mt-2'
        : side === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 mr-2'
          : 'left-full top-1/2 -translate-y-1/2 ml-2';

  // Style: only prevent native callout, do NOT use touch-action:manipulation
  const wrapperStyle: CSSProperties = {
    WebkitTouchCallout: 'none',
  };

  return (
    <div
      ref={wrapRef}
      className={className ?? 'relative inline-flex'}
      style={wrapperStyle}
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
          <div className="rounded-lg bg-foreground/95 px-3 py-2 text-xs text-background shadow-xl max-w-[240px] text-center leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
