/**
 * Game types for "Voice of the Desert"
 */

import type { EncounterType } from '../i18n/content';

export type Lang = 'ru' | 'en';
export type Phase = 'day' | 'dusk' | 'night' | 'dawn';
export type VoiceGender = 'female' | 'male';

/** A node on the path map */
export interface PathNode {
  x: number;
  y: number;
  phase: Phase;
  encounter: EncounterType;
  day: number;
}

/** A journal entry */
export interface JournalEntry {
  id: string;
  day: number;
  phase: Phase;
  koanId: string;
  koanQuestion: string;
  answerText: string;
  desertResponse: string;
  encounter: EncounterType;
  encounterResult: string;
  insightDelta: number;
  timestamp: number;
}

/** Game state persisted in store */
export interface GameState {
  started: boolean;
  day: number;
  distance: number;
  insight: number;
  phase: Phase;
  currentKoanId: string | null;
  currentEncounter: EncounterType | null;
  awaitingChoice: 'koan' | 'encounter' | null;
  path: PathNode[];
  journal: JournalEntry[];
}

export interface Settings {
  lang: Lang;
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
  voiceGender: VoiceGender;
}
