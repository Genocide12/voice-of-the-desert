/**
 * Haptics: Web Vibration API + Telegram HapticFeedback + visual pulse fallback.
 * - Telegram WebApp: native haptics (works in Telegram client)
 * - Chrome/Firefox Android: navigator.vibrate
 * - Safari iOS / desktop: visual pulse applied DIRECTLY to the clicked button
 *   (no CustomEvent / no React — resilient to HMR)
 */

'use client';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

// Track the most recently clicked element (module-level, survives HMR)
let _lastClicked: HTMLElement | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button =
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('a') ||
        target;
      _lastClicked = button instanceof HTMLElement ? button : null;
    },
    true,
  );
}

/** Apply visual pulse directly to the last-clicked button */
function applyVisualPulse(intensity: 'soft' | 'medium' | 'strong') {
  if (typeof document === 'undefined') return;
  const target = _lastClicked;
  console.log('[haptics] applyVisualPulse', intensity, 'target:', target?.tagName, target?.textContent?.slice(0, 30));
  if (!target || !target.isConnected) return;
  const button =
    target.closest('button') ||
    target.closest('[role="button"]') ||
    target;
  if (!(button instanceof HTMLElement)) return;

  const cls = `haptic-pulse-${intensity}`;
  button.classList.remove('haptic-pulse-soft', 'haptic-pulse-medium', 'haptic-pulse-strong');
  // Force reflow so the animation restarts
  void button.offsetWidth;
  button.classList.add(cls);
  console.log('[haptics] added class', cls, 'to button:', button.textContent?.slice(0, 30));
  setTimeout(() => button.classList.remove(cls), 400);
}

/** Show a brief full-screen flash for strong haptics (iOS feedback) */
function showFlashOverlay() {
  if (typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.className = 'haptic-flash-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 350);
}

class HapticsService {
  private enabled = true;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  private hasVibration(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  private inTelegram(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return !!window.Telegram?.WebApp?.HapticFeedback;
    } catch {
      return false;
    }
  }

  /** Soft tick for button presses */
  click() {
    console.log("[haptics] click() called, enabled:", this.enabled);
    if (!this.enabled) return;
    if (this.inTelegram()) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('soft');
      } catch {
        /* ignore */
      }
    }
    if (this.hasVibration()) {
      try {
        navigator.vibrate!(10);
      } catch {
        /* ignore */
      }
    }
    // Visual fallback (always — works on iOS Safari, desktop)
    applyVisualPulse('soft');
  }

  /** Medium tap for selection */
  select() {
    if (!this.enabled) return;
    if (this.inTelegram()) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
      } catch {
        /* ignore */
      }
    }
    if (this.hasVibration()) {
      try {
        navigator.vibrate!(15);
      } catch {
        /* ignore */
      }
    }
    applyVisualPulse('medium');
  }

  /** Success pulse for insight gain */
  success() {
    if (!this.enabled) return;
    if (this.inTelegram()) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch {
        /* ignore */
      }
    }
    if (this.hasVibration()) {
      try {
        navigator.vibrate!([20, 30, 20]);
      } catch {
        /* ignore */
      }
    }
    applyVisualPulse('strong');
    showFlashOverlay();
  }

  /** Warning for negative insight */
  warning() {
    if (!this.enabled) return;
    if (this.inTelegram()) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
      } catch {
        /* ignore */
      }
    }
    if (this.hasVibration()) {
      try {
        navigator.vibrate!([30, 40, 30]);
      } catch {
        /* ignore */
      }
    }
    applyVisualPulse('strong');
    showFlashOverlay();
  }
}

let _h: HapticsService | null = null;
export function getHaptics(): HapticsService {
  if (!_h) _h = new HapticsService();
  return _h;
}
