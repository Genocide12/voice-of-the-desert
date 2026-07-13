/**
 * Telegram Bot webhook for "Voice of the Desert"
 * STATELESS design: full game state encoded in callback_data (≤64 bytes)
 * No in-memory sessions needed — works on Vercel serverless.
 *
 * State encoding in callback_data:
 *   Format: "s{day}_{ins}_{dist}_{phase}_{ko|en}_{id}_{lang}"
 *   Example: "s3_12_45_1_en_k07_ru"  (day 3, insight 12, distance 45, phase dusk, encounter k07, lang ru)
 *   phase: 0=day, 1=dusk, 2=night, 3=dawn
 *   ko|en: 'ko' = awaiting koan answer, 'en' = awaiting encounter choice, 'fn' = finale
 *
 * Action callbacks:
 *   "a{optIdx}_{state}" — answer koan with option index, then full state
 *   "e{choiceIdx}_{state}" — encounter choice, then full state
 *   "new" — start new game (no state)
 *   "menu" — main menu
 *   "lang_ru" / "lang_en" — switch language (preserved via state or default)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  KOANS,
  ENCOUNTER_CHOICES,
  ENCOUNTER_NAMES,
  ENCOUNTER_DESCRIPTIONS,
  BOT,
  DESERT_GREETINGS,
  type Localized,
} from '@/lib/i18n/content';
import {
  createInitialState,
  getKoanForDay,
  resolveKoanAnswer,
  resolveEncounterChoice,
  MAX_DAYS,
  type GameState,
} from '@/lib/game/engine';
import type { Lang } from '@/lib/game/types';
import type { Phase } from '@/lib/game/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

// ====== State encoding/decoding ======
const PHASE_TO_NUM: Record<Phase, number> = { day: 0, dusk: 1, night: 2, dawn: 3 };
const NUM_TO_PHASE: Record<number, Phase> = { 0: 'day', 1: 'dusk', 2: 'night', 3: 'dawn' };

function encodeState(state: GameState, lang: Lang): string {
  const phase = PHASE_TO_NUM[state.phase] ?? 0;
  const stage =
    state.awaitingChoice === 'koan' ? 'ko' :
    state.awaitingChoice === 'encounter' ? 'en' :
    state.awaitingChoice === 'finale' ? 'fn' : 'ko';
  const id = state.currentKoanId ?? state.currentEncounter ?? 'x';
  // Format: s{day}_{ins}_{dist}_{phase}_{stage}_{id}_{lang}
  return `s${state.day}_${state.insight}_${state.distance}_${phase}_${stage}_${id}_${lang}`;
}

function decodeState(encoded: string): { state: GameState; lang: Lang } | null {
  if (!encoded.startsWith('s')) return null;
  try {
    const parts = encoded.slice(1).split('_');
    const day = parseInt(parts[0] ?? '1', 10) || 1;
    const insight = parseInt(parts[1] ?? '0', 10) || 0;
    const distance = parseInt(parts[2] ?? '0', 10) || 0;
    const phaseNum = parseInt(parts[3] ?? '0', 10) || 0;
    const stage = parts[4] ?? 'ko';
    const id = parts[5] ?? 'x';
    // Robust lang detection: default to 'ru'
    const lang: Lang = parts[6] === 'en' ? 'en' : 'ru';

    const phase = NUM_TO_PHASE[phaseNum] ?? 'day';
    const currentKoanId = stage === 'ko' ? id : null;
    const currentEnc = stage === 'en' ? (id as any) : null;
    const awaiting: GameState['awaitingChoice'] =
      stage === 'ko' ? 'koan' : stage === 'en' ? 'encounter' : stage === 'fn' ? 'finale' : 'koan';

    const state: GameState = {
      started: true,
      day,
      insight,
      distance,
      phase,
      currentKoanId,
      currentEncounter: currentEnc,
      awaitingChoice: awaiting,
      pendingKoanId: null,
      pendingAnswer: '',
      pendingResponse: '',
      path: [],
      journal: [],
      finished: awaiting === 'finale',
    };
    return { state, lang };
  } catch {
    return null;
  }
}

// ====== Telegram Bot API helpers ======
const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const WEBAPP_URL = process.env.WEBAPP_URL ?? '';

async function tg(method: string, payload: any) {
  if (!BOT_TOKEN) return { ok: false, error: 'no_bot_token' };
  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await resp.json();
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any, parseMode = 'Markdown') {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    reply_markup: replyMarkup,
  });
}

async function answerCallback(callbackId: string) {
  return tg('answerCallbackQuery', { callback_query_id: callbackId });
}

/** Edit the message that contained the inline button (instead of sending a new message) */
async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: any, parseMode = 'Markdown') {
  return tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: parseMode,
    reply_markup: replyMarkup,
  });
}

function tr(loc: Localized | undefined, lang: Lang): string {
  if (!loc) return '';
  return loc[lang] ?? loc.ru ?? '';
}

// ====== Inline keyboards with state encoding ======
function mainMenuKeyboard(lang: Lang) {
  return {
    inline_keyboard: [
      [
        { text: '🎮 ' + tr(BOT.playGame, lang), callback_data: 'new' },
        { text: '🌐 ' + tr(BOT.language, lang), callback_data: 'lang_menu' },
      ],
      [
        { text: '❓ ' + tr(BOT.helpCmd, lang), callback_data: 'help' },
      ],
      ...(WEBAPP_URL
        ? [[{ text: '🖥️ ' + tr(BOT.openWeb, lang), web_app: { url: WEBAPP_URL } }]]
        : []),
    ],
  };
}

function langKeyboard(lang: Lang) {
  const back = lang === 'ru' ? '← Назад' : '← Back';
  return {
    inline_keyboard: [
      [
        { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
        { text: '🇬🇧 English', callback_data: 'lang_en' },
      ],
      [{ text: back, callback_data: 'menu' }],
    ],
  };
}

function koanKeyboard(koanId: string, state: GameState, lang: Lang) {
  const koan = KOANS.find((k) => k.id === koanId);
  if (!koan) return mainMenuKeyboard(lang);
  const stateEnc = encodeState(state, lang);
  return {
    inline_keyboard: [
      ...koan.options.map((opt, i) => [
        // a{idx}_{state}  — action + encoded state
        { text: tr(opt.text, lang).slice(0, 60), callback_data: `a${i}_${stateEnc}` },
      ]),
    ],
  };
}

function encounterKeyboard(encounter: string, state: GameState, lang: Lang) {
  const choices = ENCOUNTER_CHOICES[encounter as keyof typeof ENCOUNTER_CHOICES];
  if (!choices) return mainMenuKeyboard(lang);
  const stateEnc = encodeState(state, lang);
  return {
    inline_keyboard: [
      ...choices.map((c, i) => [
        { text: tr(c.text, lang).slice(0, 60), callback_data: `e${i}_${stateEnc}` },
      ]),
    ],
  };
}

// ====== Message builders ======
function buildKoanMessage(state: GameState, lang: Lang): string {
  const koan = KOANS.find((k) => k.id === state.currentKoanId);
  if (!koan) return tr(BOT.emptyJourney, lang);
  const greeting = DESERT_GREETINGS[lang][state.day % DESERT_GREETINGS[lang].length]!;
  const phaseLabel = state.phase === 'day' ? '☀️' : state.phase === 'dusk' ? '🌅' : state.phase === 'night' ? '🌙' : '🌄';
  return [
    `${phaseLabel} *День ${state.day} · ${state.distance} ${tr({ ru: 'шагов', en: 'steps' }, lang)} · ${state.insight} ${tr({ ru: 'прозрений', en: 'insights' }, lang)}*`,
    '',
    `_${greeting}_`,
    '',
    `*${tr(koan.question, lang)}*`,
    '',
    tr(BOT.chooseAnswer, lang),
  ].join('\n');
}

function buildEncounterMessage(state: GameState, lang: Lang): string {
  const enc = state.currentEncounter;
  if (!enc) return tr(BOT.emptyJourney, lang);
  const nameLoc = ENCOUNTER_NAMES[enc];
  const descLoc = ENCOUNTER_DESCRIPTIONS[enc];
  if (!nameLoc || !descLoc) {
    return `*${tr(BOT.desertSpeaks, lang)}*\n\n${state.pendingResponse || '…'}`;
  }
  const name = tr(nameLoc, lang);
  const descArr = descLoc[lang] ?? descLoc.ru;
  const desc = descArr?.[state.day % descArr.length] ?? '';
  const answerText = state.pendingAnswer || '…';
  const desertResponse = state.pendingResponse || '…';
  return [
    `*${name}*`,
    '',
    `_${desc}_`,
    '',
    `${tr(BOT.youAnswered, lang)} "${answerText}"`,
    '',
    `*${tr(BOT.desertSpeaks, lang)}* ${desertResponse}`,
    '',
    tr(BOT.chooseAction, lang),
  ].join('\n');
}

function buildStatsMessage(state: GameState, lang: Lang): string {
  return [
    `*${tr(BOT.yourStats, lang)}*`,
    '',
    `${tr({ ru: 'День', en: 'Day' }, lang)}: ${state.day}`,
    `${tr({ ru: 'Путь', en: 'Distance' }, lang)}: ${state.distance}`,
    `${tr({ ru: 'Прозрение', en: 'Insight' }, lang)}: ${state.insight}`,
  ].join('\n');
}

function buildFinaleMessage(state: GameState, lang: Lang): string {
  return [
    `🌅 *${tr({ ru: 'Конец пути', en: 'End of the Path' }, lang)}*`,
    '',
    `_${tr({ ru: 'Пустыня замолкает. Ты оборачиваешься — и видишь, что следов нет. Ветер стёр их. Но что-то осталось. Ты больше не странник. Ты — сама пустыня.', en: 'The desert falls silent. You turn around — and see no footprints. The wind has erased them. But something remains. You are no longer a wanderer. You are the desert itself.' }, lang)}_`,
    '',
    `*${tr({ ru: 'Твоё странствие', en: 'Your journey' }, lang)}*`,
    `${tr({ ru: 'Дней', en: 'Days' }, lang)}: ${state.day - 1}`,
    `${tr({ ru: 'Путь', en: 'Distance' }, lang)}: ${state.distance}`,
    `${tr({ ru: 'Прозрение', en: 'Insight' }, lang)}: ${state.insight}`,
    '',
    tr({ ru: 'Нажми «Новое странствие», чтобы начать заново.', en: 'Tap "New journey" to begin again.' }, lang),
  ].join('\n');
}

// ====== Webhook handler ======
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Handle message
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text ?? '';
      // Detect lang from user
      const lang: Lang = (msg.from?.language_code?.startsWith('en') ? 'en' : 'ru') as Lang;

      if (text.startsWith('/start')) {
        const userId = msg.from?.id;
        const userName = msg.from?.username ?? msg.from?.first_name ?? 'friend';
        const welcome = tr(BOT.welcome, lang);
        const idNote = `\n\n🆔 *Твой Telegram ID: ${userId}*\nОтправь этот ID разработчику для настройки уведомлений.`;
        await sendMessage(chatId, welcome + idNote, mainMenuKeyboard(lang));
      } else if (text.startsWith('/help')) {
        await sendMessage(chatId, tr(BOT.help, lang), mainMenuKeyboard(lang));
      } else if (text.startsWith('/play')) {
        const firstKoan = getKoanForDay(1);
        const state = createInitialState(firstKoan.id);
        await sendMessage(chatId, buildKoanMessage(state, lang), koanKeyboard(state.currentKoanId!, state, lang));
      } else if (text.startsWith('/new')) {
        const firstKoan = getKoanForDay(1);
        const state = createInitialState(firstKoan.id);
        await sendMessage(chatId, tr(BOT.newGameStarted, lang) + '\n\n' + buildKoanMessage(state, lang), koanKeyboard(state.currentKoanId!, state, lang));
      } else if (text.startsWith('/lang')) {
        await sendMessage(chatId, tr(BOT.langPrompt, lang), langKeyboard(lang));
      } else {
        await sendMessage(chatId, tr(BOT.welcome, lang), mainMenuKeyboard(lang));
      }
      return NextResponse.json({ ok: true });
    }

    // Handle callback query — EDIT the original message (no new messages)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;
      const data = cb.data ?? '';
      if (!chatId || !messageId) {
        await answerCallback(cb.id);
        return NextResponse.json({ ok: true });
      }
      await answerCallback(cb.id);

      // Helper: edit current message in-place
      const edit = (text: string, kb?: any) => editMessage(chatId, messageId, text, kb);

      // Parse callback data
      if (data === 'menu') {
        const lang: Lang = (cb.from?.language_code?.startsWith('en') ? 'en' : 'ru') as Lang;
        await edit(tr(BOT.welcome, lang), mainMenuKeyboard(lang));
      } else if (data === 'help') {
        const lang: Lang = (cb.from?.language_code?.startsWith('en') ? 'en' : 'ru') as Lang;
        await edit(tr(BOT.help, lang), mainMenuKeyboard(lang));
      } else if (data === 'lang_menu') {
        await edit(tr(BOT.langPrompt, 'ru'), langKeyboard('ru'));
      } else if (data === 'lang_ru' || data === 'lang_en') {
        const lang: Lang = data === 'lang_ru' ? 'ru' : 'en';
        await edit(tr(BOT.langChanged, lang), mainMenuKeyboard(lang));
      } else if (data === 'new') {
        const lang: Lang = (cb.from?.language_code?.startsWith('en') ? 'en' : 'ru') as Lang;
        const firstKoan = getKoanForDay(1);
        const state = createInitialState(firstKoan.id);
        await edit(tr(BOT.newGameStarted, lang) + '\n\n' + buildKoanMessage(state, lang), koanKeyboard(state.currentKoanId!, state, lang));
      } else if (data.startsWith('a') || data.startsWith('e')) {
        // Parse action + state
        const isAnswer = data.startsWith('a');
        const rest = data.slice(1);
        const stateStart = rest.indexOf('_s');
        if (stateStart === -1) {
          await edit('Session expired. Type /new to start over.', mainMenuKeyboard('ru'));
          return NextResponse.json({ ok: true });
        }
        const idx = parseInt(rest.slice(0, stateStart), 10);
        const stateEnc = rest.slice(stateStart + 1);
        const decoded = decodeState(stateEnc);
        if (!decoded) {
          await edit('Session expired. Type /new to start over.', mainMenuKeyboard('ru'));
          return NextResponse.json({ ok: true });
        }
        const { state, lang } = decoded;

        if (isAnswer) {
          // Koan answer → edit to encounter message
          try {
            const koan = KOANS.find((k) => k.id === state.currentKoanId);
            if (!koan || !koan.options[idx]) {
              await edit('Invalid option. Type /new to start over.', mainMenuKeyboard(lang));
              return NextResponse.json({ ok: true });
            }
            const { state: newState } = resolveKoanAnswer(state, koan, idx, lang);
            const msg = buildEncounterMessage(newState, lang);
            const kb = encounterKeyboard(newState.currentEncounter!, newState, lang);
            await edit(msg, kb);
          } catch (innerE) {
            console.error('ans_ error:', innerE, 'data:', data);
            await edit('Error: ' + (innerE instanceof Error ? innerE.message : 'unknown'), mainMenuKeyboard(lang));
          }
        } else {
          // Encounter choice → edit to next koan (or finale)
          const enc = state.currentEncounter;
          if (!enc) {
            await edit('Invalid encounter. Type /new to start over.', mainMenuKeyboard(lang));
            return NextResponse.json({ ok: true });
          }
          const { state: newState, isFinale } = resolveEncounterChoice(state, enc, idx, lang);
          if (isFinale) {
            await edit(buildFinaleMessage(newState, lang), mainMenuKeyboard(lang));
          } else {
            await edit(buildStatsMessage(newState, lang) + '\n\n' + buildKoanMessage(newState, lang), koanKeyboard(newState.currentKoanId!, newState, lang));
          }
        }
      } else {
        const lang: Lang = (cb.from?.language_code?.startsWith('en') ? 'en' : 'ru') as Lang;
        await edit(tr(BOT.welcome, lang), mainMenuKeyboard(lang));
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('Webhook error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

// GET endpoint for verification
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'voice-of-the-desert-bot',
    webhook: 'active',
    stateless: true,
    hasToken: !!BOT_TOKEN,
    hasWebappUrl: !!WEBAPP_URL,
    maxDays: MAX_DAYS,
  });
}
