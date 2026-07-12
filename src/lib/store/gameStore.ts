/**
 * Zustand store with persist (localStorage)
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Settings, Lang, VoiceGender } from '../game/types';
import { createInitialState, getKoanForDay } from '../game/engine';

interface GameStore {
  state: GameState | null;
  settings: Settings;
  // actions
  startGame: () => void;
  newGame: () => void;
  setKoanAnswered: (newState: GameState) => void;
  setEncounterResolved: (newState: GameState) => void;
  setLang: (lang: Lang) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVoice: () => void;
  toggleVibration: () => void;
  setVoiceGender: (g: VoiceGender) => void;
  /** Sync state from external source (e.g. Telegram bot session) */
  hydrateFromBot: (state: GameState, lang: Lang) => void;
}

const defaultSettings: Settings = {
  lang: 'ru',
  soundEnabled: true,
  musicEnabled: true,
  voiceEnabled: true,
  vibrationEnabled: true,
  voiceGender: 'female',
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      state: null,
      settings: defaultSettings,

      startGame: () => {
        const firstKoan = getKoanForDay(1);
        set({ state: createInitialState(firstKoan.id) });
      },

      newGame: () => {
        const firstKoan = getKoanForDay(1);
        set({ state: createInitialState(firstKoan.id) });
      },

      setKoanAnswered: (newState) => set({ state: newState }),
      setEncounterResolved: (newState) => set({ state: newState }),

      setLang: (lang) => {
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('desert-lang', lang);
          } catch {
            /* ignore */
          }
        }
        set((s) => ({ settings: { ...s.settings, lang } }));
      },

      toggleSound: () => set((s) => ({ settings: { ...s.settings, soundEnabled: !s.settings.soundEnabled } })),
      toggleMusic: () => set((s) => ({ settings: { ...s.settings, musicEnabled: !s.settings.musicEnabled } })),
      toggleVoice: () => set((s) => ({ settings: { ...s.settings, voiceEnabled: !s.settings.voiceEnabled } })),
      toggleVibration: () =>
        set((s) => ({ settings: { ...s.settings, vibrationEnabled: !s.settings.vibrationEnabled } })),
      setVoiceGender: (g) => set((s) => ({ settings: { ...s.settings, voiceGender: g } })),

      hydrateFromBot: (state, lang) =>
        set((s) => ({ state, settings: { ...s.settings, lang } })),
    }),
    {
      name: 'desert-game-store',
      version: 2,
      // Migrate old persisted state to new schema (adds pending* fields, finished)
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        // Ensure settings exist with all fields
        if (persisted.settings) {
          persisted.settings = { ...defaultSettings, ...persisted.settings };
        }
        // Migrate game state: if old version (1), reset state to force fresh start
        // (old state lacks pendingKoanId/pendingAnswer/pendingResponse/finished)
        if (version < 2 && persisted.state) {
          // Reset state to null — user starts fresh (old incompatible state)
          persisted.state = null;
        }
        // Defensive: ensure all required fields exist on state
        if (persisted.state) {
          const s = persisted.state;
          s.pendingKoanId = s.pendingKoanId ?? null;
          s.pendingAnswer = s.pendingAnswer ?? '';
          s.pendingResponse = s.pendingResponse ?? '';
          s.finished = s.finished ?? false;
          if (!['koan', 'encounter', 'finale', null].includes(s.awaitingChoice)) {
            s.awaitingChoice = null;
          }
        }
        return persisted;
      },
    },
  ),
);
