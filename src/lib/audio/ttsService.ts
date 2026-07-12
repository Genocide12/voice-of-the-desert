/**
 * TTS service: client-side queue that fetches audio from /api/tts.
 * Uses node-edge-tts (Microsoft Edge Neural voices) on the backend.
 * Queue prevents overlapping narration.
 */

'use client';

import type { Lang, VoiceGender } from '../game/types';

interface QueueItem {
  text: string;
  lang: Lang;
  gender: VoiceGender;
  onPlayed?: () => void;
}

class TTSService {
  private queue: QueueItem[] = [];
  private playing = false;
  private audioEl: HTMLAudioElement | null = null;
  private enabled = true;
  private cache = new Map<string, string>(); // key -> blob URL

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.stop();
  }

  /** Enqueue text for narration */
  speak(text: string, lang: Lang, gender: VoiceGender, onPlayed?: () => void) {
    if (!this.enabled || !text.trim()) {
      onPlayed?.();
      return;
    }
    this.queue.push({ text, lang, gender, onPlayed });
    if (!this.playing) this.processQueue();
  }

  /** Stop all playback and clear queue */
  stop() {
    this.queue = [];
    this.playing = false;
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }

  private async processQueue() {
    if (this.playing || this.queue.length === 0) return;
    this.playing = true;
    const item = this.queue.shift()!;
    try {
      const url = await this.fetchAudio(item.text, item.lang, item.gender);
      if (!url) {
        item.onPlayed?.();
        this.playing = false;
        this.processQueue();
        return;
      }
      await this.playUrl(url);
      item.onPlayed?.();
    } catch {
      item.onPlayed?.();
    }
    this.playing = false;
    this.processQueue();
  }

  private async fetchAudio(text: string, lang: Lang, gender: VoiceGender): Promise<string | null> {
    const key = `${lang}:${gender}:${text}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, gender }),
      });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      // Cap cache size
      if (this.cache.size > 30) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          const oldUrl = this.cache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          this.cache.delete(firstKey);
        }
      }
      this.cache.set(key, url);
      return url;
    } catch {
      return null;
    }
  }

  private playUrl(url: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioEl) {
        this.audioEl = new Audio();
      }
      this.audioEl.src = url;
      this.audioEl.onended = () => resolve();
      this.audioEl.onerror = () => resolve();
      this.audioEl.play().catch(() => resolve());
    });
  }
}

let _tts: TTSService | null = null;
export function getTTS(): TTSService {
  if (!_tts) _tts = new TTSService();
  return _tts;
}
