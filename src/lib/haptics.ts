/**
 * Haptics: Web Vibration API + Telegram HapticFeedback.
 * Button presses use a soft tick; insight gains use a stronger pulse.
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

class HapticsService {
  private enabled = true;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  /** Soft tick for button presses */
  click() {
    if (!this.enabled) return;
    // Telegram
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('soft');
    } catch {
      /* ignore */
    }
    // Web Vibration API: very short pulse
    try {
      if (navigator.vibrate) navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }

  /** Medium tap for selection */
  select() {
    if (!this.enabled) return;
    try {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } catch {
      /* ignore */
    }
    try {
      if (navigator.vibrate) navigator.vibrate(15);
    } catch {
      /* ignore */
    }
  }

  /** Success pulse for insight gain */
  success() {
    if (!this.enabled) return;
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch {
      /* ignore */
    }
    try {
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    } catch {
      /* ignore */
    }
  }

  /** Warning for negative insight */
  warning() {
    if (!this.enabled) return;
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
    } catch {
      /* ignore */
    }
    try {
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    } catch {
      /* ignore */
    }
  }
}

let _h: HapticsService | null = null;
export function getHaptics(): HapticsService {
  if (!_h) _h = new HapticsService();
  return _h;
}
