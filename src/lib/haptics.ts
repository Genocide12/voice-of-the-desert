/**
 * Haptics: Web Vibration API + Telegram HapticFeedback + audio haptic engine.
 * - Telegram WebApp: native haptics (works in Telegram client)
 * - Chrome/Firefox Android: navigator.vibrate
 * - Safari iOS / ALL browsers: AUDIO HAPTIC ENGINE — synthesized "buzz" that mimics
 *   physical vibration through speaker. Works EVERYWHERE including Safari iOS.
 * - All platforms: visual pulse on the clicked button + flash overlay
 *
 * The audio haptic engine uses short bursts of low-frequency noise + sine waves
 * that create a perceptible "thump" through the phone speaker, felt as haptic-like
 * feedback even without vibration motor support.
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

// ====== AUDIO HAPTIC ENGINE (works on ALL browsers including Safari iOS) ======
let _audioCtx: AudioContext | null = null;
let _masterGain: GainNode | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      _audioCtx = new AC();
      _masterGain = _audioCtx.createGain();
      _masterGain.gain.value = 0.5;
      _masterGain.connect(_audioCtx.destination);
    } catch {
      return null;
    }
  }
  // CRITICAL: Safari iOS requires resume() on every user gesture
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

// Global: initialize AudioContext on first touch/click (Safari iOS requirement)
if (typeof window !== 'undefined') {
  const initOnGesture = () => {
    getAudioCtx();
  };
  window.addEventListener('touchstart', initOnGesture, { once: true, passive: true });
  window.addEventListener('click', initOnGesture, { once: true, passive: true });
}

/**
 * Play a synthesized "haptic buzz" — a short burst that mimics physical vibration.
 * This is the KEY fallback for Safari iOS where navigator.vibrate is unavailable.
 *
 * Technique: low-frequency sine wave + filtered noise burst = "thump" felt through speaker.
 * Connects DIRECTLY to destination (not through masterGain) to ensure audible even if
 * masterGain is at 0.
 */
function playAudioHaptic(intensity: 'soft' | 'medium' | 'strong') {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Resume context if suspended (Safari iOS requirement — MUST be in user gesture)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // Create a dedicated gain node for haptics (independent of masterGain)
  const hapticGain = ctx.createGain();
  hapticGain.gain.value = 0.6;
  hapticGain.connect(ctx.destination);

  const settings = {
    soft: { freq: 100, duration: 0.05, vol: 0.3, noise: false },
    medium: { freq: 70, duration: 0.08, vol: 0.5, noise: true },
    strong: { freq: 50, duration: 0.12, vol: 0.7, noise: true },
  }[intensity];

  // 1. Low-frequency sine wave (the "thump")
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(settings.freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, settings.freq * 0.5), now + settings.duration);
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(settings.vol, now + 0.005);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
  osc.connect(oscGain);
  oscGain.connect(hapticGain);
  osc.start(now);
  osc.stop(now + settings.duration + 0.01);

  // 2. Filtered noise burst (the "buzz" texture)
  if (settings.noise) {
    const noiseDuration = settings.duration * 0.9;
    const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = settings.freq * 4;
    noiseFilter.Q.value = 3;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = settings.vol * 0.4;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(hapticGain);
    noiseSrc.start(now);
    noiseSrc.stop(now + noiseDuration);
  }

  // 3. For strong: add a harmonic for richer "thump"
  if (intensity === 'strong') {
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = settings.freq * 1.5;
    osc2Gain.gain.setValueAtTime(0.0001, now);
    osc2Gain.gain.exponentialRampToValueAtTime(settings.vol * 0.4, now + 0.008);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
    osc2.connect(osc2Gain);
    osc2Gain.connect(hapticGain);
    osc2.start(now);
    osc2.stop(now + settings.duration + 0.01);
  }

  // Cleanup hapticGain after use
  setTimeout(() => {
    try { hapticGain.disconnect(); } catch { /* ignore */ }
  }, (settings.duration + 0.1) * 1000);
}

class HapticsService {
  private enabled = true;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  /** Resume audio context (call on any user gesture) */
  resume() {
    getAudioCtx();
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
    // Resume audio context on every click (Safari iOS requirement)
    this.resume();
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
    // 3. Audio haptic (ALL browsers — Safari iOS, desktop, etc.)
    playAudioHaptic('soft');
    // 4. Visual pulse (all platforms)
    applyVisualPulse('soft');
  }

  /** Medium tap for selection */
  select() {
    if (!this.enabled) return;
    this.resume();
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
    playAudioHaptic('medium');
    applyVisualPulse('medium');
  }

  /** Success pulse for insight gain */
  success() {
    if (!this.enabled) return;
    this.resume();
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
    // Double audio haptic for success rhythm
    playAudioHaptic('strong');
    setTimeout(() => playAudioHaptic('medium'), 60);
    applyVisualPulse('strong');
    showFlashOverlay();
  }

  /** Warning for negative insight */
  warning() {
    if (!this.enabled) return;
    this.resume();
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
    playAudioHaptic('strong');
    setTimeout(() => playAudioHaptic('strong'), 80);
    applyVisualPulse('strong');
    showFlashOverlay();
  }
}

let _h: HapticsService | null = null;
export function getHaptics(): HapticsService {
  if (!_h) _h = new HapticsService();
  return _h;
}
