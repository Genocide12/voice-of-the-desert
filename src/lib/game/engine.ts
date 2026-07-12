/**
 * Game engine for "Voice of the Desert"
 * Pure functions for koan selection, encounter resolution, path map.
 */

import { KOANS, ENCOUNTER_CHOICES, type Koan, type EncounterType, type EncounterChoice } from '../i18n/content';
import type { GameState, JournalEntry, PathNode, Phase, Lang } from './types';

/** Total number of koans = max days. After this, the game reaches finale. */
export const MAX_DAYS = KOANS.length;

/** Pick a koan deterministically by day, rotating through the pool */
export function getKoanForDay(day: number): Koan {
  if (KOANS.length === 0) throw new Error('No koans available');
  const idx = (day - 1) % KOANS.length;
  return KOANS[idx]!;
}

/** Get a random koan (for daily koan feature) */
export function getRandomKoan(seed?: number): Koan {
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  return KOANS[s % KOANS.length]!;
}

/** Resolve a koan answer: saves pending answer/response, transitions to encounter */
export function resolveKoanAnswer(
  state: GameState,
  koan: Koan,
  optionIndex: number,
  lang: Lang,
): {
  state: GameState;
  option: Koan['options'][number];
  encounter: EncounterType;
} {
  const option = koan.options[optionIndex];
  if (!option) throw new Error('Invalid option index');

  const encounter = option.nextEncounter;

  // Path map node
  const lastNode = state.path[state.path.length - 1];
  const lastX = lastNode?.x ?? 0;
  const lastY = lastNode?.y ?? 0;
  const rad = (option.direction * Math.PI) / 180;
  const step = 10;
  const newNode: PathNode = {
    x: lastX + Math.sin(rad) * step,
    y: lastY - Math.cos(rad) * step,
    phase: state.phase,
    encounter,
    day: state.day,
  };

  const nextPhase = progressPhase(state.phase);

  const newState: GameState = {
    ...state,
    currentEncounter: encounter,
    currentKoanId: null,
    awaitingChoice: 'encounter',
    insight: state.insight + option.insight,
    path: [...state.path, newNode],
    phase: nextPhase,
    // SAVE pending data so resolveEncounterChoice can build a full journal entry
    pendingKoanId: koan.id,
    pendingAnswer: option.text[lang],
    pendingResponse: option.response[lang],
  };

  return { state: newState, option, encounter };
}

/** Resolve an encounter choice: builds journal entry from pending data, advances day */
export function resolveEncounterChoice(
  state: GameState,
  encounter: EncounterType,
  choiceIndex: number,
  lang: Lang,
): { state: GameState; choice: EncounterChoice; journalEntry: JournalEntry; isFinale: boolean } {
  const choices = ENCOUNTER_CHOICES[encounter];
  const choice = choices?.[choiceIndex];
  if (!choice) throw new Error('Invalid encounter choice');

  // Find the koan from pendingKoanId (not from journal[0]!)
  const koan = state.pendingKoanId ? KOANS.find((k) => k.id === state.pendingKoanId) ?? null : null;

  const journalEntry: JournalEntry = {
    id: `j-${state.day}-${Date.now()}`,
    day: state.day,
    phase: state.phase,
    koanId: koan?.id ?? state.pendingKoanId ?? 'unknown',
    koanQuestion: koan?.question[lang] ?? '',
    answerText: state.pendingAnswer,
    desertResponse: state.pendingResponse,
    encounter,
    encounterResult: choice.result[lang],
    insightDelta: choice.insight,
    timestamp: Date.now(),
  };

  const nextDay = state.day + 1;
  const isFinale = nextDay > MAX_DAYS;

  if (isFinale) {
    // Game finished — go to finale
    const newState: GameState = {
      ...state,
      day: nextDay,
      distance: Math.max(0, state.distance + choice.distance),
      insight: state.insight + choice.insight,
      phase: choice.nextPhase,
      currentKoanId: null,
      currentEncounter: null,
      awaitingChoice: 'finale',
      pendingKoanId: null,
      pendingAnswer: '',
      pendingResponse: '',
      journal: [journalEntry, ...state.journal].slice(0, 100),
      finished: true,
    };
    return { state: newState, choice, journalEntry, isFinale: true };
  }

  const nextKoan = getKoanForDay(nextDay);
  const newState: GameState = {
    ...state,
    day: nextDay,
    distance: Math.max(0, state.distance + choice.distance),
    insight: state.insight + choice.insight,
    phase: choice.nextPhase,
    currentKoanId: nextKoan.id,
    currentEncounter: null,
    awaitingChoice: 'koan',
    // Clear pending data
    pendingKoanId: null,
    pendingAnswer: '',
    pendingResponse: '',
    journal: [journalEntry, ...state.journal].slice(0, 100),
  };

  return { state: newState, choice, journalEntry, isFinale: false };
}

/** Progress phase: day → dusk → night → dawn → day */
export function progressPhase(phase: Phase): Phase {
  const order: Phase[] = ['day', 'dusk', 'night', 'dawn'];
  const idx = order.indexOf(phase);
  return order[(idx + 1) % 4]!;
}

/** Initial game state */
export function createInitialState(firstKoanId: string): GameState {
  return {
    started: true,
    day: 1,
    distance: 0,
    insight: 0,
    phase: 'day',
    currentKoanId: firstKoanId,
    currentEncounter: null,
    awaitingChoice: 'koan',
    pendingKoanId: null,
    pendingAnswer: '',
    pendingResponse: '',
    path: [
      {
        x: 0,
        y: 0,
        phase: 'day',
        encounter: 'silence',
        day: 1,
      },
    ],
    journal: [],
    finished: false,
  };
}

/** Get current koan object from state */
export function getCurrentKoan(state: GameState): Koan | null {
  if (!state.currentKoanId) return null;
  return KOANS.find((k) => k.id === state.currentKoanId) ?? null;
}

/** Get current encounter choices */
export function getCurrentEncounterChoices(state: GameState): EncounterChoice[] {
  if (!state.currentEncounter) return [];
  return ENCOUNTER_CHOICES[state.currentEncounter] ?? [];
}
