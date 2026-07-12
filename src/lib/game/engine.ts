/**
 * Game engine for "Voice of the Desert"
 * Pure functions for koan selection, encounter resolution, path map.
 */

import { KOANS, ENCOUNTER_CHOICES, type Koan, type EncounterType, type EncounterChoice } from '../i18n/content';
import type { GameState, JournalEntry, PathNode, Phase, Lang } from './types';

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

/** Resolve a koan answer: returns new state + the chosen option's effects */
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

  // Path map node: add a new node based on direction
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

  // Phase progression: day → dusk → night → dawn → day
  const nextPhase = progressPhase(state.phase);

  const newState: GameState = {
    ...state,
    currentEncounter: encounter,
    currentKoanId: null,
    awaitingChoice: 'encounter',
    insight: state.insight + option.insight,
    path: [...state.path, newNode],
    phase: nextPhase,
  };

  return { state: newState, option, encounter };
}

/** Resolve an encounter choice */
export function resolveEncounterChoice(
  state: GameState,
  encounter: EncounterType,
  choiceIndex: number,
  koan: Koan | null,
  answerText: string,
  desertResponse: string,
  lang: Lang,
): { state: GameState; choice: EncounterChoice; journalEntry: JournalEntry } {
  const choices = ENCOUNTER_CHOICES[encounter];
  const choice = choices?.[choiceIndex];
  if (!choice) throw new Error('Invalid encounter choice');

  const journalEntry: JournalEntry = {
    id: `j-${state.day}-${Date.now()}`,
    day: state.day,
    phase: state.phase,
    koanId: koan?.id ?? 'unknown',
    koanQuestion: koan?.question[lang] ?? '',
    answerText,
    desertResponse,
    encounter,
    encounterResult: choice.result[lang],
    insightDelta: choice.insight,
    timestamp: Date.now(),
  };

  const nextKoan = getKoanForDay(state.day + 1);

  const newState: GameState = {
    ...state,
    day: state.day + 1,
    distance: Math.max(0, state.distance + choice.distance),
    insight: state.insight + choice.insight,
    phase: choice.nextPhase,
    currentKoanId: nextKoan.id,
    currentEncounter: null,
    awaitingChoice: 'koan',
    journal: [journalEntry, ...state.journal].slice(0, 100), // keep last 100
  };

  return { state: newState, choice, journalEntry };
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
