/**
 * Zustand store with persist (localStorage)
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Settings, Lang } from '../game/types';
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
}

const defaultSettings: Settings = {
  lang: 'ru',
  soundEnabled: true,
  musicEnabled: true,
  voiceEnabled: true,
  vibrationEnabled: true,
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
    }),
    {
      name: 'desert-game-store',
      version: 3,
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        if (persisted.settings) {
          // v3: remove voiceGender from settings
          const { voiceGender, ...rest } = persisted.settings;
          persisted.settings = { ...defaultSettings, ...rest };
        }
        if (version < 2 && persisted.state) {
          persisted.state = null;
        }
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
