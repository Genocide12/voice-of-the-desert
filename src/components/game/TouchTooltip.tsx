'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface TouchTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Allow parent to pass className for proper sizing */
  className?: string;
}

/**
 * Tooltip that works on both desktop (hover) and mobile (long-press 400ms).
 * On touch devices, press-and-hold reveals the tooltip.
 * Prevents iOS Safari native callout/context menu.
 */
export function TouchTooltip({ content, children, side = 'top', className }: TouchTooltipProps) {
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

  // Mobile long-press — 400ms threshold
  const handleTouchStart = (e: React.TouchEvent) => {
    longPressed.current = false;
    const touch = e.touches[0];
    if (!touch) return;
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      show(clientX, clientY);
      // Audio haptic feedback (works on Safari iOS)
      try {
        if (navigator.vibrate) navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    }, 400);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (longPressed.current) {
      // Keep tooltip visible for 2 seconds after release
      setTimeout(() => hide(), 2000);
    }
  };

  const handleTouchMove = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    hide();
  };

  // Prevent native context menu / iOS callout on long-press
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const prevent = (e: Event) => {
      if (longPressed.current) e.preventDefault();
    };
    // iOS Safari callout prevention
    const preventCallout = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', prevent);
    el.addEventListener('selectstart', preventCallout);
    return () => {
      el.removeEventListener('contextmenu', prevent);
      el.removeEventListener('selectstart', preventCallout);
    };
  }, []);

  const sideClass =
    side === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : side === 'bottom'
        ? 'top-full left-1/2 -translate-x-1/2 mt-2'
        : side === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 mr-2'
          : 'left-full top-1/2 -translate-y-1/2 ml-2';

  // Style: prevent iOS native behaviors that steal long-press
  const wrapperStyle: CSSProperties = {
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    touchAction: 'manipulation',
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
          <div className="rounded-md bg-foreground/95 px-3 py-2 text-xs text-background shadow-lg max-w-[220px] text-center">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
