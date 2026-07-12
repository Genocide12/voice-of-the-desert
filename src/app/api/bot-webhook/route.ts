/**
 * Telegram Bot webhook for "Voice of the Desert"
 * - In-memory sessions (casual game, acceptable)
 * - Commands: /start, /play, /new, /lang, /help
 * - Inline buttons for koans and encounters
 * - Menu button opens web app
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
  type GameState,
} from '@/lib/game/engine';
import type { Lang } from '@/lib/game/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ====== In-memory session store ======
interface Session {
  state: GameState | null;
  lang: Lang;
}

const sessions = new Map<number, Session>();

function getSession(userId: number): Session {
  let s = sessions.get(userId);
  if (!s) {
    s = { state: null, lang: 'ru' };
    sessions.set(userId, s);
  }
  return s;
}

function tr(loc: Localized, lang: Lang): string {
  return loc[lang] ?? loc.ru;
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

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  return tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: replyMarkup,
  });
}

// ====== Inline keyboard builders ======
function mainMenuKeyboard(lang: Lang) {
  return {
    inline_keyboard: [
      [
        { text: tr(BOT.playGame, lang), callback_data: 'play' },
        { text: tr(BOT.newGame, lang), callback_data: 'new' },
      ],
      [
        { text: tr(BOT.language, lang), callback_data: 'lang' },
        { text: tr(BOT.helpCmd, lang), callback_data: 'help' },
      ],
      ...(WEBAPP_URL
        ? [[{ text: tr(BOT.openWeb, lang), web_app: { url: WEBAPP_URL } }]]
        : []),
    ],
  };
}

function langKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
        { text: '🇬🇧 English', callback_data: 'lang_en' },
      ],
      [{ text: '← Back', callback_data: 'menu' }],
    ],
  };
}

function koanKeyboard(koanId: string, lang: Lang) {
  const koan = KOANS.find((k) => k.id === koanId);
  if (!koan) return mainMenuKeyboard(lang);
  return {
    inline_keyboard: [
      ...koan.options.map((opt, i) => [
        { text: tr(opt.text, lang).slice(0, 60), callback_data: `ans_${i}` },
      ]),
    ],
  };
}

function encounterKeyboard(encounter: string, lang: Lang) {
  const choices = ENCOUNTER_CHOICES[encounter as keyof typeof ENCOUNTER_CHOICES];
  if (!choices) return mainMenuKeyboard(lang);
  return {
    inline_keyboard: [
      ...choices.map((c, i) => [{ text: tr(c.text, lang).slice(0, 60), callback_data: `enc_${i}` }]),
    ],
  };
}

// ====== Message builders ======
function buildKoanMessage(state: GameState, lang: Lang): string {
  const koan = KOANS.find((k) => k.id === state.currentKoanId);
  if (!koan) return tr(BOT.emptyJourney, lang);
  const greeting = DESERT_GREETINGS[lang][state.day % DESERT_GREETINGS[lang].length]!;
  const phaseLabel =
    state.phase === 'day' ? '☀️' : state.phase === 'dusk' ? '🌅' : state.phase === 'night' ? '🌙' : '🌄';
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
  const name = tr(ENCOUNTER_NAMES[enc], lang);
  const descArr = ENCOUNTER_DESCRIPTIONS[enc][lang];
  const desc = descArr[state.day % descArr.length]!;
  // Use pendingAnswer/pendingResponse from state (saved by resolveKoanAnswer)
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
      const userId = msg.from?.id ?? chatId;
      const text = msg.text ?? '';
      const session = getSession(userId);

      if (text.startsWith('/start')) {
        await sendMessage(chatId, tr(BOT.welcome, session.lang), mainMenuKeyboard(session.lang));
      } else if (text.startsWith('/help')) {
      await sendMessage(chatId, tr(BOT.help, session.lang), mainMenuKeyboard(session.lang));
    } else if (text.startsWith('/play')) {
      if (!session.state) {
        const firstKoan = getKoanForDay(1);
        session.state = createInitialState(firstKoan.id);
      }
      if (session.state.awaitingChoice === 'koan' && session.state.currentKoanId) {
        await sendMessage(chatId, buildKoanMessage(session.state, session.lang), koanKeyboard(session.state.currentKoanId, session.lang));
      } else if (session.state.awaitingChoice === 'encounter' && session.state.currentEncounter) {
        await sendMessage(chatId, buildEncounterMessage(session.state, session.lang), encounterKeyboard(session.state.currentEncounter, session.lang));
      } else {
        await sendMessage(chatId, buildStatsMessage(session.state, session.lang), mainMenuKeyboard(session.lang));
      }
    } else if (text.startsWith('/new')) {
      const firstKoan = getKoanForDay(1);
      session.state = createInitialState(firstKoan.id);
      await sendMessage(chatId, tr(BOT.newGameStarted, session.lang) + '\n\n' + buildKoanMessage(session.state, session.lang), koanKeyboard(session.state.currentKoanId, session.lang));
    } else if (text.startsWith('/lang')) {
      await sendMessage(chatId, tr(BOT.langPrompt, session.lang), langKeyboard());
    } else {
      await sendMessage(chatId, tr(BOT.welcome, session.lang), mainMenuKeyboard(session.lang));
    }
    return NextResponse.json({ ok: true });
  }

  // Handle callback query
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const userId = cb.from?.id;
    const data = cb.data ?? '';
    if (!chatId || !userId) {
      await answerCallback(cb.id);
      return NextResponse.json({ ok: true });
    }
    const session = getSession(userId);
    await answerCallback(cb.id);

    if (data === 'menu') {
      await sendMessage(chatId, tr(BOT.welcome, session.lang), mainMenuKeyboard(session.lang));
    } else if (data === 'help') {
      await sendMessage(chatId, tr(BOT.help, session.lang), mainMenuKeyboard(session.lang));
    } else if (data === 'lang') {
      await sendMessage(chatId, tr(BOT.langPrompt, session.lang), langKeyboard());
    } else if (data === 'lang_ru' || data === 'lang_en') {
      session.lang = data === 'lang_ru' ? 'ru' : 'en';
      await sendMessage(chatId, tr(BOT.langChanged, session.lang), mainMenuKeyboard(session.lang));
    } else if (data === 'play') {
      if (!session.state) {
        const firstKoan = getKoanForDay(1);
        session.state = createInitialState(firstKoan.id);
      }
      if (session.state.awaitingChoice === 'koan' && session.state.currentKoanId) {
        await sendMessage(chatId, buildKoanMessage(session.state, session.lang), koanKeyboard(session.state.currentKoanId, session.lang));
      } else if (session.state.awaitingChoice === 'encounter' && session.state.currentEncounter) {
        await sendMessage(chatId, buildEncounterMessage(session.state, session.lang), encounterKeyboard(session.state.currentEncounter, session.lang));
      } else {
        await sendMessage(chatId, buildStatsMessage(session.state, session.lang), mainMenuKeyboard(session.lang));
      }
    } else if (data === 'new') {
      const firstKoan = getKoanForDay(1);
      session.state = createInitialState(firstKoan.id);
      await sendMessage(chatId, tr(BOT.newGameStarted, session.lang) + '\n\n' + buildKoanMessage(session.state, session.lang), koanKeyboard(session.state.currentKoanId, session.lang));
    } else if (data.startsWith('ans_') && session.state?.awaitingChoice === 'koan') {
      const idx = parseInt(data.slice(4), 10);
      const koan = KOANS.find((k) => k.id === session.state!.currentKoanId);
      if (koan && koan.options[idx]) {
        const { state: newState } = resolveKoanAnswer(session.state, koan, idx, session.lang);
        session.state = newState;
        // Encounter message — uses pendingAnswer/pendingResponse from state
        await sendMessage(chatId, buildEncounterMessage(newState, session.lang), encounterKeyboard(newState.currentEncounter!, session.lang));
      }
    } else if (data.startsWith('enc_') && session.state?.awaitingChoice === 'encounter') {
      const idx = parseInt(data.slice(4), 10);
      const enc = session.state.currentEncounter;
      if (enc) {
        const { state: newState, isFinale } = resolveEncounterChoice(
          session.state,
          enc,
          idx,
          session.lang,
        );
        session.state = newState;
        if (isFinale) {
          // Finale — game finished
          await sendMessage(chatId, buildFinaleMessage(newState, session.lang), mainMenuKeyboard(session.lang));
        } else {
          await sendMessage(chatId, buildStatsMessage(newState, session.lang) + '\n\n' + buildKoanMessage(newState, session.lang), koanKeyboard(newState.currentKoanId!, session.lang));
        }
      }
    } else {
      await sendMessage(chatId, tr(BOT.welcome, session.lang), mainMenuKeyboard(session.lang));
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const stack = e instanceof Error ? e.stack : '';
    console.error('Webhook error:', msg, stack);
    return NextResponse.json({ ok: false, error: msg, stack: stack?.split('\n').slice(0, 5).join(' | ') }, { status: 200 });
  }
}

// GET endpoint for verification
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'voice-of-the-desert-bot',
    webhook: 'active',
    hasToken: !!BOT_TOKEN,
    hasWebappUrl: !!WEBAPP_URL,
  });
}
