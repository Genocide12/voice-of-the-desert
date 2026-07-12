/**
 * Haptics: Web Vibration API + Telegram HapticFeedback + audio tick fallback.
 * - Telegram WebApp: native haptics (works in Telegram client)
 * - Chrome/Firefox Android: navigator.vibrate
 * - Safari iOS / desktop: AUDIO TICK fallback (short synthesized click — feels like haptic, works everywhere)
 * - All platforms: visual pulse on the clicked button
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
  if (!target || !target.isConnected) return;
  const button =
    target.closest('button') ||
    target.closest('[role="button"]') ||
    target;
  if (!(button instanceof HTMLElement)) return;

  const cls = `haptic-pulse-${intensity}`;
  button.classList.remove('haptic-pulse-soft', 'haptic-pulse-medium', 'haptic-pulse-strong');
  void button.offsetWidth;
  button.classList.add(cls);
  setTimeout(() => button.classList.remove(cls), 400);
}

/** Show a brief full-screen flash for strong haptics */
function showFlashOverlay() {
  if (typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.className = 'haptic-flash-overlay';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 350);
}

// ====== Audio tick fallback (works on Safari iOS, all browsers) ======
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      _audioCtx = new AC();
    } catch {
      return null;
    }
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

/**
 * Play a short synthesized "tick" sound that mimics a haptic buzz.
 * This is the key fallback for Safari iOS where navigator.vibrate is unavailable.
 * Different intensities produce different tones:
 * - soft: 60Hz sine, 8ms (subtle tick)
 * - medium: 80Hz sine, 15ms (clearer tap)
 * - strong: 50Hz + 100Hz, 30ms (deep thump)
 */
function playAudioTick(intensity: 'soft' | 'medium' | 'strong') {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (intensity === 'strong') {
    // Deep thump: low frequency + harmonic
    [50, 100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const vol = i === 0 ? 0.3 : 0.15;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    });
  } else if (intensity === 'medium') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 80;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  } else {
    // soft
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.01);
  }
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
    if (!this.enabled) return;
    // 1. Telegram native (highest priority)
    if (this.inTelegram()) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('soft');
      } catch {
        /* ignore */
      }
    }
    // 2. Web Vibration API (Chrome/Firefox Android)
    if (this.hasVibration()) {
      try {
        navigator.vibrate!(10);
      } catch {
        /* ignore */
      }
    }
    // 3. Audio tick fallback (Safari iOS, desktop — works EVERYWHERE)
    playAudioTick('soft');
    // 4. Visual pulse (all platforms)
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
    playAudioTick('medium');
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
    // Double audio tick for success rhythm
    playAudioTick('strong');
    setTimeout(() => playAudioTick('medium'), 50);
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
    playAudioTick('strong');
    setTimeout(() => playAudioTick('strong'), 70);
    applyVisualPulse('strong');
    showFlashOverlay();
  }
}

let _h: HapticsService | null = null;
export function getHaptics(): HapticsService {
  if (!_h) _h = new HapticsService();
  return _h;
}
