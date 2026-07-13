/**
 * Procedural audio engine using Web Audio API.
 * No audio files — all sounds synthesized.
 * - SFX: wind, sand steps, bell, click, chime
 * - Ambient: generative drone with eastern motifs (pentatonic)
 */

'use client';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private ambientPlaying = false;
  private sfxEnabled = true;
  private musicEnabled = true;

  /** Lazily init AudioContext (must be triggered by user gesture) */
  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
  }
  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (!v) this.stopAmbient();
  }

  /** Resume audio context after user gesture */
  resume() {
    this.ensureCtx();
  }

  // ====== SFX ======

  /** Soft click for buttons */
  click() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Soft wind gust */
  wind(duration = 2.5) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);
    // Slowly sweep filter for "gust" feel
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(900, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(500, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration);
  }

  /** Footstep on sand */
  step() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  /** Temple bell — long resonant tone */
  bell(freq = 220) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const harmonics = [1, 2.76, 5.4, 8.93];
    const gains = [0.25, 0.15, 0.08, 0.04];
    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * h;
      const g = gains[i]!;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(g, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 5);
    });
  }

  /** Soft chime for insight gain */
  chime() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 1.3);
    });
  }

  // ====== AMBIENT MUSIC ======

  /** Start generative ambient drone with pentatonic motifs */
  startAmbient() {
    if (!this.musicEnabled || this.ambientPlaying) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    this.ambientPlaying = true;

    // Drone base (low root)
    const droneFreq = 110; // A2
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = droneFreq;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.06;
    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start();
    this.ambientNodes.push(droneOsc, droneGain);

    // Fifth drone
    const fifthOsc = ctx.createOscillator();
    fifthOsc.type = 'sine';
    fifthOsc.frequency.value = droneFreq * 1.5;
    const fifthGain = ctx.createGain();
    fifthGain.gain.value = 0.04;
    fifthOsc.connect(fifthGain);
    fifthGain.connect(this.masterGain);
    fifthOsc.start();
    this.ambientNodes.push(fifthOsc, fifthGain);

    // Slow LFO on drone gain for breathing effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);
    lfo.start();
    this.ambientNodes.push(lfo, lfoGain);

    // Pentatonic motif player (A minor pentatonic: A, C, D, E, G)
    const pentatonic = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 587.33];
    const scheduleNote = () => {
      if (!this.ambientPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)]!;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      // Lowpass for warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 4.5);
      // Schedule next note
      const nextDelay = 3000 + Math.random() * 4000;
      setTimeout(scheduleNote, nextDelay);
    };
    setTimeout(scheduleNote, 1500);

    // Wind bed (very soft)
    const windBufSize = Math.floor(ctx.sampleRate * 4);
    const windBuffer = ctx.createBuffer(1, windBufSize, ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < windBufSize; i++) {
      windData[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = windBuffer;
    windSrc.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.5;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.04;
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windSrc.start();
    this.ambientNodes.push(windSrc, windFilter, windGain);
  }

  stopAmbient() {
    this.ambientPlaying = false;
    this.ambientNodes.forEach((n) => {
      try {
        if ('stop' in n) (n as AudioScheduledSourceNode).stop();
        n.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.ambientNodes = [];
  }

  /** Phase-aware ambient adjustment */
  setPhase(phase: 'day' | 'dusk' | 'night' | 'dawn') {
    if (!this.ctx || !this.masterGain) return;
    // Subtle master gain shift by phase
    const targetVol = phase === 'night' ? 0.5 : phase === 'dawn' ? 0.55 : phase === 'dusk' ? 0.6 : 0.65;
    this.masterGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 2);
  }
}

// Singleton
let _engine: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!_engine) _engine = new AudioEngine();
  return _engine;
}
