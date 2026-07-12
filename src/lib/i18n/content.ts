/**
 * Game content for "Voice of the Desert" (Голос Пустыни)
 * All textual content: koans, encounters, UI strings, desert responses.
 * Bilingual RU/EN. Day tone = poetic (Rumi/Hafiz), Night tone = mystical/symbolic.
 */

import type { Localized, LocalizedList } from './index';

// ============ UI STRINGS ============

export const UI = {
  title: { ru: 'Голос Пустыни', en: 'Voice of the Desert' },
  subtitle: { ru: 'Странствие монаха', en: 'A Monk\'s Wanderings' },

  // Stats
  day: { ru: 'День', en: 'Day' },
  distance: { ru: 'Путь', en: 'Distance' },
  insight: { ru: 'Прозрение', en: 'Insight' },
  phase: { ru: 'Время', en: 'Phase' },

  // Phases
  phaseDay: { ru: 'День', en: 'Day' },
  phaseDusk: { ru: 'Сумерки', en: 'Dusk' },
  phaseNight: { ru: 'Ночь', en: 'Night' },
  phaseDawn: { ru: 'Рассвет', en: 'Dawn' },

  // Actions
  beginJourney: { ru: 'Начать странствие', en: 'Begin the journey' },
  continue: { ru: 'Идти дальше', en: 'Walk on' },
  answer: { ru: 'Ответить', en: 'Answer' },
  reflect: { ru: 'Размышлять', en: 'Reflect' },

  // Tabs / sections
  tabJourney: { ru: 'Путь', en: 'Journey' },
  tabMap: { ru: 'Карта', en: 'Map' },
  tabJournal: { ru: 'Журнал', en: 'Journal' },
  tabSettings: { ru: 'Настройки', en: 'Settings' },

  // Settings
  settingsTitle: { ru: 'Настройки странника', en: 'Wanderer\'s settings' },
  language: { ru: 'Язык', en: 'Language' },
  sound: { ru: 'Звуки', en: 'Sounds' },
  music: { ru: 'Музыка', en: 'Music' },
  voice: { ru: 'Голос пустыни', en: 'Desert voice' },
  vibration: { ru: 'Вибро', en: 'Vibration' },
  voiceGender: { ru: 'Голос', en: 'Voice' },
  voiceFemale: { ru: 'Женский', en: 'Female' },
  voiceMale: { ru: 'Мужской', en: 'Male' },

  // Empty states
  journalEmpty: {
    ru: 'Журнал пуст. Пустыня ещё не говорила с тобой.',
    en: 'The journal is empty. The desert has not spoken to you yet.',
  },
  mapEmpty: {
    ru: 'Твой путь ещё не начертан на песке.',
    en: 'Your path is not yet traced upon the sand.',
  },

  // Misc
  installApp: { ru: 'Установить приложение', en: 'Install app' },
  installHint: {
    ru: 'Добавь на главный экран для полного погружения',
    en: 'Add to home screen for full immersion',
  },
  newGame: { ru: 'Новое странствие', en: 'New journey' },
  newGameConfirm: {
    ru: 'Начать заново? Текущий путь будет утерян в песках.',
    en: 'Begin anew? The current path will be lost to the sands.',
  },
  desertSpeaks: { ru: 'Пустыня говорит:', en: 'The desert speaks:' },
  youAnswered: { ru: 'Ты ответил:', en: 'You answered:' },
  tooltipSound: { ru: 'Включить звуки пустыни', en: 'Enable desert sounds' },
  tooltipVoice: { ru: 'Озвучка голоса пустыни', en: 'Desert voice narration' },
  tooltipVibration: { ru: 'Виброотклики на действия', en: 'Vibration feedback' },
  tooltipMusic: { ru: 'Фоновая музыка', en: 'Background music' },
  tooltipLang: { ru: 'Сменить язык', en: 'Switch language' },
  tooltipNewGame: { ru: 'Начать заново', en: 'Start over' },
  tooltipInstall: { ru: 'Установить как приложение', en: 'Install as app' },
} as const;

// ============ KOANS ============

export interface KoanOption {
  text: Localized;
  /** Direction on the path map in degrees (0 = north) */
  direction: number;
  /** Insight delta */
  insight: number;
  /** Encounter type triggered next */
  nextEncounter: EncounterType;
  /** Desert's poetic/mystical response to this answer */
  response: Localized;
}

export interface Koan {
  id: string;
  /** Day-phase tone */
  tone: 'poetic' | 'mystic';
  question: Localized;
  options: KoanOption[];
}

export type EncounterType =
  | 'caravan'
  | 'mirage'
  | 'well'
  | 'beast'
  | 'dunes'
  | 'ruins'
  | 'stars'
  | 'silence';

export const ENCOUNTER_NAMES: Record<EncounterType, Localized> = {
  caravan: { ru: 'Караван', en: 'Caravan' },
  mirage: { ru: 'Мираж', en: 'Mirage' },
  well: { ru: 'Колодец', en: 'Well' },
  beast: { ru: 'Зверь', en: 'Beast' },
  dunes: { ru: 'Барханы', en: 'Dunes' },
  ruins: { ru: 'Руины', en: 'Ruins' },
  stars: { ru: 'Звёзды', en: 'Stars' },
  silence: { ru: 'Тишина', en: 'Silence' },
};

export const ENCOUNTER_DESCRIPTIONS: Record<EncounterType, LocalizedList> = {
  caravan: {
    ru: [
      'На горизонте поднимается пыль — караван торговцев медленно пересекает барханы.',
      'Колокольчики верблюдов звенят в знойном воздухе. Караван приближается.',
      'Старый проводник машет тебе рукой. Его караван остановился у тени скалы.',
    ],
    en: [
      'Dust rises on the horizon — a traders\' caravan slowly crosses the dunes.',
      'Camel bells ring in the feverish air. A caravan approaches.',
      'An old guide waves to you. His caravan has stopped in the shade of a rock.',
    ],
  },
  mirage: {
    ru: [
      'Воздух дрожит. Город из света встаёт над песком, маня прохладой и водой.',
      'Ты видишь реку, которой здесь нет. Её шум звучит как обещание.',
      'Силуэты дворцов колышутся в раскалённом воздухе. Они зовут.',
    ],
    en: [
      'The air shimmers. A city of light rises above the sand, promising coolness and water.',
      'You see a river that is not here. Its sound is like a promise.',
      'Silhouettes of palaces sway in the heated air. They call to you.',
    ],
  },
  well: {
    ru: [
      'В низине между барханов — старый колодец. Его камни помнят тысячи губ.',
      'Ты находишь заброшенный колодец. На дне — тёмная вода, отражающая небо.',
      'Каменный обод колодца тёплый от солнца. Внутри — тишина и влага.',
    ],
    en: [
      'In the hollow between dunes — an old well. Its stones remember thousands of lips.',
      'You find an abandoned well. At its bottom — dark water reflecting the sky.',
      'The stone rim of the well is warm from the sun. Within — silence and moisture.',
    ],
  },
  beast: {
    ru: [
      'Из-за бархана появляются глаза. Зверь следит за тобой, не двигаясь.',
      'Что-то большое крадётся по песку. Следы исчезают за твоей спиной.',
      'Тень с когтями ложится на песок. Зверь ждёт твоего движения.',
    ],
    en: [
      'Eyes appear from behind a dune. A beast watches you, motionless.',
      'Something large creeps across the sand. Tracks vanish behind your back.',
      'A shadow with claws falls upon the sand. The beast awaits your move.',
    ],
  },
  dunes: {
    ru: [
      'Барханы уходят в бесконечность. Ни следа, ни тени, ни звука — только песок.',
      'Ты стоишь на гребне. Впереди — только волны песка, идущие к горизонту.',
      'Ветер стирает твои следы. Бесконечные дюны молчат.',
    ],
    en: [
      'Dunes stretch into infinity. No track, no shadow, no sound — only sand.',
      'You stand on the crest. Ahead — only waves of sand reaching the horizon.',
      'The wind erases your tracks. Endless dunes are silent.',
    ],
  },
  ruins: {
    ru: [
      'Полузанесённые песком колонны. Здесь когда-то был город. Теперь — только ветер.',
      'Ты проходишь мимо разрушенной арки. На камне — стёртые слова на мёртвом языке.',
      'Руины храма. Статуи без лиц смотрят в небо, которого больше не видят.',
    ],
    en: [
      'Half-buried columns. A city once stood here. Now — only wind.',
      'You pass a ruined arch. On the stone — worn words in a dead language.',
      'Ruins of a temple. Faceless statues gaze at a sky they no longer see.',
    ],
  },
  stars: {
    ru: [
      'Небо раскрывается. Тысячи звёзд — как костры тех, кто шёл до тебя.',
      'Млечный путь ложится через пустыню. Ты — песчинка под бесконечностью.',
      'Звёзды молчат. Но их молчание громче всех слов, что ты слышал.',
    ],
    en: [
      'The sky opens. Thousands of stars — like campfires of those who walked before you.',
      'The Milky Way lies across the desert. You are a grain of sand beneath infinity.',
      'The stars are silent. But their silence is louder than any words you have heard.',
    ],
  },
  silence: {
    ru: [
      'Тишина. Не отсутствие звука — а присутствие чего-то, что больше звука.',
      'Пустыня молчит. И в этом молчании — всё, что ты искал.',
      'Ничего не происходит. И это — самое важное, что случилось с тобой.',
    ],
    en: [
      'Silence. Not the absence of sound — but the presence of something greater than sound.',
      'The desert is silent. And in this silence — all that you sought.',
      'Nothing happens. And this — is the most important thing that has happened to you.',
    ],
  },
};

// ============ ENCOUNTER CHOICES ============

export interface EncounterChoice {
  text: Localized;
  insight: number;
  /** Distance delta (in steps) */
  distance: number;
  /** Phase transition after this choice */
  nextPhase: 'day' | 'dusk' | 'night' | 'dawn';
  /** Desert's comment on this choice */
  result: Localized;
}

export const ENCOUNTER_CHOICES: Record<EncounterType, EncounterChoice[]> = {
  caravan: [
    {
      text: { ru: 'Попросить воды', en: 'Ask for water' },
      insight: 1,
      distance: 5,
      nextPhase: 'dusk',
      result: {
        ru: 'Торговец даёт тебе флягу. Вода тёплая, но живая. Ты благословляешь её.',
        en: 'The trader gives you a flask. The water is warm, but alive. You bless it.',
      },
    },
    {
      text: { ru: 'Поменять историю', en: 'Trade a story' },
      insight: 3,
      distance: 2,
      nextPhase: 'dusk',
      result: {
        ru: 'Ты рассказываешь о своих коанах. Старый проводник кивает: он слышал их прежде.',
        en: 'You tell of your koans. The old guide nods: he has heard them before.',
      },
    },
    {
      text: { ru: 'Пройти мимо', en: 'Pass in silence' },
      insight: 2,
      distance: 8,
      nextPhase: 'dusk',
      result: {
        ru: 'Ты кланяешься и идёшь дальше. Их путь — не твой. Твой — не их.',
        en: 'You bow and walk on. Their path is not yours. Yours — not theirs.',
      },
    },
  ],
  mirage: [
    {
      text: { ru: 'Идти к городу', en: 'Walk toward the city' },
      insight: 0,
      distance: -3,
      nextPhase: 'night',
      result: {
        ru: 'Город тает. Ты остаёшься в пустоте, но пустота — тоже учитель.',
        en: 'The city dissolves. You remain in emptiness, but emptiness is also a teacher.',
      },
    },
    {
      text: { ru: 'Закрыть глаза', en: 'Close your eyes' },
      insight: 4,
      distance: 1,
      nextPhase: 'night',
      result: {
        ru: 'Когда ты открываешь глаза, миража нет. Только песок. Только правда.',
        en: 'When you open your eyes, the mirage is gone. Only sand. Only truth.',
      },
    },
    {
      text: { ru: 'Заговорить с рекой', en: 'Speak to the river' },
      insight: 3,
      distance: 2,
      nextPhase: 'night',
      result: {
        ru: 'Река отвечает. Она говорит о жажде, которая не утоляется водой.',
        en: 'The river answers. It speaks of a thirst that no water can quench.',
      },
    },
  ],
  well: [
    {
      text: { ru: 'Испить', en: 'Drink' },
      insight: 1,
      distance: 6,
      nextPhase: 'dusk',
      result: {
        ru: 'Вода холодная и горькая. Ты благодаришь колодец и идёшь дальше.',
        en: 'The water is cold and bitter. You thank the well and walk on.',
      },
    },
    {
      text: { ru: 'Смотреть в воду', en: 'Look into the water' },
      insight: 5,
      distance: 0,
      nextPhase: 'night',
      result: {
        ru: 'В тёмной воде — твоё отражение. Но это не ты. Это тот, кем ты можешь стать.',
        en: 'In the dark water — your reflection. But it is not you. It is who you may become.',
      },
    },
    {
      text: { ru: 'Оставить подношение', en: 'Leave an offering' },
      insight: 2,
      distance: 4,
      nextPhase: 'dusk',
      result: {
        ru: 'Ты кладёшь камень на обод. Кто-то после тебя испьёт и вспомнит тебя.',
        en: 'You place a stone on the rim. Someone after you will drink and remember you.',
      },
    },
  ],
  beast: [
    {
      text: { ru: 'Стоять неподвижно', en: 'Stand still' },
      insight: 4,
      distance: 3,
      nextPhase: 'night',
      result: {
        ru: 'Зверь принюхивается. Не найдя страха, он уходит. Страх был его единственной пищей.',
        en: 'The beast sniffs the air. Finding no fear, it leaves. Fear was its only food.',
      },
    },
    {
      text: { ru: 'Посмотреть в глаза', en: 'Meet its eyes' },
      insight: 5,
      distance: 1,
      nextPhase: 'night',
      result: {
        ru: 'В глазах зверя — твои собственные глаза. Ты узнаёшь его. Он — твоя тень.',
        en: 'In the beast\'s eyes — your own eyes. You recognize it. It is your shadow.',
      },
    },
    {
      text: { ru: 'Бежать', en: 'Run' },
      insight: -1,
      distance: -5,
      nextPhase: 'night',
      result: {
        ru: 'Ты бежишь. Зверь не догоняет — но что-то внутри тебя теперь бежит всегда.',
        en: 'You run. The beast does not chase — but something inside you now runs forever.',
      },
    },
  ],
  dunes: [
    {
      text: { ru: 'Идти по гребню', en: 'Walk the crest' },
      insight: 2,
      distance: 7,
      nextPhase: 'dusk',
      result: {
        ru: 'Ветер бьёт в лицо. Но с гребня видно дальше. Ты идёшь против ветра.',
        en: 'The wind beats your face. But from the crest you see further. You walk against the wind.',
      },
    },
    {
      text: { ru: 'Лечь в песок', en: 'Lie in the sand' },
      insight: 4,
      distance: 0,
      nextPhase: 'night',
      result: {
        ru: 'Ты ложишься. Песок принимает тебя. Ты слышишь, как пустыня дышит под тобой.',
        en: 'You lie down. The sand receives you. You hear the desert breathing beneath you.',
      },
    },
    {
      text: { ru: 'Считать барханы', en: 'Count the dunes' },
      insight: 1,
      distance: 3,
      nextPhase: 'dusk',
      result: {
        ru: 'Ты сбиваешься. Пустыня не поддаётся счёту. Это её первый урок.',
        en: 'You lose count. The desert cannot be counted. This is its first lesson.',
      },
    },
  ],
  ruins: [
    {
      text: { ru: 'Читать стёртые слова', en: 'Read the worn words' },
      insight: 4,
      distance: 1,
      nextPhase: 'night',
      result: {
        ru: 'Слова стираются под твоим взглядом. Может, они были обращены не к глазам.',
        en: 'The words fade beneath your gaze. Perhaps they were not addressed to eyes.',
      },
    },
    {
      text: { ru: 'Молиться среди колонн', en: 'Pray among the columns' },
      insight: 5,
      distance: 0,
      nextPhase: 'night',
      result: {
        ru: 'Твои слова тонут в камне. Но камень запоминает. Он запомнил всех, кто молился здесь.',
        en: 'Your words sink into the stone. But the stone remembers. It remembers all who prayed here.',
      },
    },
    {
      text: { ru: 'Унести обломок', en: 'Take a fragment' },
      insight: -1,
      distance: 4,
      nextPhase: 'dusk',
      result: {
        ru: 'Камень тяжёл в руке. Ты несёшь чужое прошлое, забыв своё настоящее.',
        en: 'The stone is heavy in your hand. You carry another\'s past, forgetting your own present.',
      },
    },
  ],
  stars: [
    {
      text: { ru: 'Искать созвездия', en: 'Find constellations' },
      insight: 3,
      distance: 2,
      nextPhase: 'dawn',
      result: {
        ru: 'Ты находишь знакомые линии. Но звёзды не знают, что они — созвездия.',
        en: 'You find familiar lines. But the stars do not know they are constellations.',
      },
    },
    {
      text: { ru: 'Молчать со звёздами', en: 'Be silent with the stars' },
      insight: 6,
      distance: 0,
      nextPhase: 'dawn',
      result: {
        ru: 'Вы молчите вместе. Это самая длинная беседа в твоей жизни.',
        en: 'You are silent together. This is the longest conversation of your life.',
      },
    },
    {
      text: { ru: 'Задать вопрос небу', en: 'Ask the sky a question' },
      insight: 4,
      distance: 1,
      nextPhase: 'dawn',
      result: {
        ru: 'Небо не отвечает. Но вопрос становится чище. Может, в этом и был ответ.',
        en: 'The sky does not answer. But the question becomes clearer. Perhaps that was the answer.',
      },
    },
  ],
  silence: [
    {
      text: { ru: 'Слушать', en: 'Listen' },
      insight: 7,
      distance: 0,
      nextPhase: 'dawn',
      result: {
        ru: 'Ты слушаешь. И наконец слышишь: то, что слушало — и есть ответ.',
        en: 'You listen. And finally you hear: that which listens — is the answer.',
      },
    },
    {
      text: { ru: 'Ждать', en: 'Wait' },
      insight: 3,
      distance: 0,
      nextPhase: 'dawn',
      result: {
        ru: 'Ты ждёшь. Пустыня не торопится. И ты учишься не торопиться у неё.',
        en: 'You wait. The desert does not hurry. And you learn from it not to hurry.',
      },
    },
    {
      text: { ru: 'Идти дальше', en: 'Walk on' },
      insight: 2,
      distance: 6,
      nextPhase: 'dawn',
      result: {
        ru: 'Ты идёшь. Тишина идёт с тобой. Она больше не покинет тебя.',
        en: 'You walk. The silence walks with you. It will never leave you again.',
      },
    },
  ],
};

// ============ KOAN DATABASE ============

export const KOANS: Koan[] = [
  {
    id: 'k01',
    tone: 'poetic',
    question: {
      ru: 'Песок забывает следы. Что остаётся от того, кто прошёл здесь?',
      en: 'The sand forgets the footprints. What remains of the one who walked here?',
    },
    options: [
      {
        text: { ru: 'Ветер, который поднял песок', en: 'The wind that lifted the sand' },
        direction: 45,
        insight: 3,
        nextEncounter: 'dunes',
        response: {
          ru: 'Пустыня улыбается. Ветер — её первый язык.',
          en: 'The desert smiles. The wind is her first language.',
        },
      },
      {
        text: { ru: 'Тень, которую он отбрасывал', en: 'The shadow he cast' },
        direction: 180,
        insight: 2,
        nextEncounter: 'ruins',
        response: {
          ru: 'Тень длиннее того, кто её отбрасывал. Так всегда.',
          en: 'The shadow is longer than the one who cast it. So it always is.',
        },
      },
      {
        text: { ru: 'Ничего. И это — не мало', en: 'Nothing. And that is not little' },
        direction: 0,
        insight: 5,
        nextEncounter: 'silence',
        response: {
          ru: 'Пустыня кивает. Ничто — её любимое дитя.',
          en: 'The desert nods. Nothingness is her favorite child.',
        },
      },
    ],
  },
  {
    id: 'k02',
    tone: 'mystic',
    question: {
      ru: 'Ты идёшь к горизонту. Но горизонт уходит. Куда ты идёшь на самом деле?',
      en: 'You walk toward the horizon. But the horizon recedes. Where are you truly going?',
    },
    options: [
      {
        text: { ru: 'К себе, которого не знаю', en: 'Toward the self I do not know' },
        direction: 270,
        insight: 5,
        nextEncounter: 'well',
        response: {
          ru: 'В колодце тебя ждёт отражение. Готов ли ты узнать его?',
          en: 'A reflection waits for you in the well. Are you ready to know it?',
        },
      },
      {
        text: { ru: 'Никуда. И это — путь', en: 'Nowhere. And that is the way' },
        direction: 90,
        insight: 4,
        nextEncounter: 'dunes',
        response: {
          ru: 'Барханы соглашаются. Тот, кто никуда не идёт, никогда не теряется.',
          en: 'The dunes agree. The one who goes nowhere is never lost.',
        },
      },
      {
        text: { ru: 'Туда, откуда пришёл', en: 'Back to where I came from' },
        direction: 0,
        insight: 2,
        nextEncounter: 'ruins',
        response: {
          ru: 'Руины ждут. Но то, что ты оставил, уже не то, что ты найдёшь.',
          en: 'The ruins wait. But what you left is no longer what you will find.',
        },
      },
    ],
  },
  {
    id: 'k03',
    tone: 'poetic',
    question: {
      ru: 'Солнце жжёт твою спину. Луна — прохладна. Что тяжелее: свет или тьма?',
      en: 'The sun burns your back. The moon is cool. Which is heavier: light or darkness?',
    },
    options: [
      {
        text: { ru: 'Свет — он обжигает', en: 'Light — it burns' },
        direction: 180,
        insight: 2,
        nextEncounter: 'mirage',
        response: {
          ru: 'Мираг согласен. Свет обманывает раньше, чем тьма.',
          en: 'The mirage agrees. Light deceives sooner than darkness.',
        },
      },
      {
        text: { ru: 'Тьма — она скрывает', en: 'Darkness — it conceals' },
        direction: 0,
        insight: 3,
        nextEncounter: 'beast',
        response: {
          ru: 'Зверь в тьме кивает. Но он — лишь твоя тень, ставшая плотью.',
          en: 'The beast in the dark nods. But it is only your shadow, made flesh.',
        },
      },
      {
        text: { ru: 'Они весят одинаково — ничего', en: 'They weigh the same — nothing' },
        direction: 90,
        insight: 5,
        nextEncounter: 'stars',
        response: {
          ru: 'Звёзды улыбаются. Ты понял игру света и тьмы.',
          en: 'The stars smile. You have understood the game of light and dark.',
        },
      },
    ],
  },
  {
    id: 'k04',
    tone: 'mystic',
    question: {
      ru: 'Жажда — это отсутствие воды или присутствие желания?',
      en: 'Is thirst the absence of water, or the presence of desire?',
    },
    options: [
      {
        text: { ru: 'Отсутствие воды', en: 'The absence of water' },
        direction: 135,
        insight: 1,
        nextEncounter: 'caravan',
        response: {
          ru: 'Караван несёт воду. Но напоит ли он твою жажду?',
          en: 'The caravan carries water. But will it quench your thirst?',
        },
      },
      {
        text: { ru: 'Присутствие желания', en: 'The presence of desire' },
        direction: 315,
        insight: 5,
        nextEncounter: 'mirage',
        response: {
          ru: 'Мираж рождается из твоего желания. Убери желание — и мираж станет песком.',
          en: 'The mirage is born of your desire. Remove desire — and the mirage becomes sand.',
        },
      },
      {
        text: { ru: 'Ни то, ни другое — это память о воде', en: 'Neither — it is the memory of water' },
        direction: 270,
        insight: 4,
        nextEncounter: 'well',
        response: {
          ru: 'Колодец древнее твоей памяти. Он помнит первую жажду.',
          en: 'The well is older than your memory. It remembers the first thirst.',
        },
      },
    ],
  },
  {
    id: 'k05',
    tone: 'poetic',
    question: {
      ru: 'Караван оставляет следы. Ветер стирает их. Кто из них прав?',
      en: 'The caravan leaves tracks. The wind erases them. Which of them is right?',
    },
    options: [
      {
        text: { ru: 'Караван — следы и есть смысл', en: 'The caravan — the tracks are the meaning' },
        direction: 90,
        insight: 2,
        nextEncounter: 'caravan',
        response: {
          ru: 'Торговцы кивают. Но их фляги пусты быстрее, чем их следы.',
          en: 'The traders nod. But their flasks empty faster than their tracks fade.',
        },
      },
      {
        text: { ru: 'Ветер — забвение и есть свобода', en: 'The wind — forgetting is freedom' },
        direction: 270,
        insight: 4,
        nextEncounter: 'dunes',
        response: {
          ru: 'Ветер обнимает тебя. Он любит тех, кто не цепляется за следы.',
          en: 'The wind embraces you. It loves those who do not cling to tracks.',
        },
      },
      {
        text: { ru: 'Оба. Идти и забываться — одно движение', en: 'Both. Walking and being forgotten — one motion' },
        direction: 0,
        insight: 6,
        nextEncounter: 'silence',
        response: {
          ru: 'Пустыня замирает. Ты произнёс её тайное имя.',
          en: 'The desert holds its breath. You have spoken its secret name.',
        },
      },
    ],
  },
  {
    id: 'k06',
    tone: 'mystic',
    question: {
      ru: 'Ночь открывает звёзды. День — закрывает их. Что открыто днём, что закрыто ночью?',
      en: 'Night reveals the stars. Day conceals them. What is revealed by day, hidden by night?',
    },
    options: [
      {
        text: { ru: 'Днём открыта форма, ночью — суть', en: 'By day form is revealed, by night — essence' },
        direction: 0,
        insight: 5,
        nextEncounter: 'stars',
        response: {
          ru: 'Звёзды приветствуют тебя. Ты видишь их суть.',
          en: 'The stars greet you. You see their essence.',
        },
      },
      {
        text: { ru: 'Днём открыто действие, ночью — бездействие', en: 'By day action, by night — non-action' },
        direction: 180,
        insight: 3,
        nextEncounter: 'beast',
        response: {
          ru: 'Зверь ночи — это бездействие, принявшее форму.',
          en: 'The beast of night is non-action, taken form.',
        },
      },
      {
        text: { ru: 'Ничего. День и ночь — одна ткань', en: 'Nothing. Day and night are one fabric' },
        direction: 90,
        insight: 6,
        nextEncounter: 'silence',
        response: {
          ru: 'Тишина соглашается. Ты разрезал ткань — и увидел нить.',
          en: 'Silence agrees. You cut the fabric — and saw the thread.',
        },
      },
    ],
  },
  {
    id: 'k07',
    tone: 'poetic',
    question: {
      ru: 'Ты находишь монету в песке. Чья она?',
      en: 'You find a coin in the sand. Whose is it?',
    },
    options: [
      {
        text: { ru: 'Того, кто её потерял', en: 'The one who lost it' },
        direction: 225,
        insight: 2,
        nextEncounter: 'ruins',
        response: {
          ru: 'Руины хранят имена. Но того, кто потерял, больше нет среди имён.',
          en: 'The ruins keep names. But the one who lost it is no longer among the names.',
        },
      },
      {
        text: { ru: 'Твоего — ты её нашёл', en: 'Yours — you found it' },
        direction: 45,
        insight: 1,
        nextEncounter: 'caravan',
        response: {
          ru: 'Караван качает головой. Найти — не значит получить.',
          en: 'The caravan shakes its head. To find is not to receive.',
        },
      },
      {
        text: { ru: 'Песка — всё в пустыне принадлежит ей', en: 'The sand\'s — all in the desert belongs to it' },
        direction: 0,
        insight: 5,
        nextEncounter: 'dunes',
        response: {
          ru: 'Барханы принимают дар. Песок возвращается к песку.',
          en: 'The dunes accept the gift. Sand returns to sand.',
        },
      },
    ],
  },
  {
    id: 'k08',
    tone: 'mystic',
    question: {
      ru: 'Эхо повторяет твой голос. Но кому оно принадлежит — тебе или скале?',
      en: 'The echo repeats your voice. But whose is it — yours, or the cliff\'s?',
    },
    options: [
      {
        text: { ru: 'Тебе — это твой голос, вернувшийся', en: 'Yours — it is your voice returned' },
        direction: 90,
        insight: 2,
        nextEncounter: 'ruins',
        response: {
          ru: 'Руины смеются. Они слышали эхо раньше, чем ты родился.',
          en: 'The ruins laugh. They heard the echo before you were born.',
        },
      },
      {
        text: { ru: 'Скале — она даёт ему форму', en: 'The cliff\'s — it gives it form' },
        direction: 270,
        insight: 3,
        nextEncounter: 'beast',
        response: {
          ru: 'Зверь — тоже эхо. Эхо твоего страха, получившее клыки.',
          en: 'The beast is also an echo. An echo of your fear, given fangs.',
        },
      },
      {
        text: { ru: 'Никому. Эхо — это звук без хозяина', en: 'No one\'s. The echo is a sound without a master' },
        direction: 0,
        insight: 6,
        nextEncounter: 'silence',
        response: {
          ru: 'Тишина — это эхо, которое перестало искать источник.',
          en: 'Silence is an echo that has stopped seeking its source.',
        },
      },
    ],
  },
  {
    id: 'k09',
    tone: 'poetic',
    question: {
      ru: 'Старый проводник говорит: «Я знаю пустыню». Молодой странник молчит. Кто из них мудрее?',
      en: 'The old guide says: "I know the desert." The young wanderer is silent. Which is wiser?',
    },
    options: [
      {
        text: { ru: 'Старый — знание есть мудрость', en: 'The old one — knowledge is wisdom' },
        direction: 135,
        insight: 1,
        nextEncounter: 'caravan',
        response: {
          ru: 'Караван соглашается. Но его проводник умер в пустыне, которую «знал».',
          en: 'The caravan agrees. But its guide died in the desert he "knew".',
        },
      },
      {
        text: { ru: 'Молодой — молчание есть мудрость', en: 'The young one — silence is wisdom' },
        direction: 315,
        insight: 4,
        nextEncounter: 'silence',
        response: {
          ru: 'Молодой странник — это ты. Ты всегда им был.',
          en: 'The young wanderer is you. You always have been.',
        },
      },
      {
        text: { ru: 'Оба — но каждый по-своему', en: 'Both — but each in their own way' },
        direction: 0,
        insight: 5,
        nextEncounter: 'well',
        response: {
          ru: 'Колодец молчит. Он знал их обоих. И обоих пережил.',
          en: 'The well is silent. It knew them both. And outlived them both.',
        },
      },
    ],
  },
  {
    id: 'k10',
    tone: 'mystic',
    question: {
      ru: 'Ты видишь свои следы впереди себя. Как это возможно?',
      en: 'You see your own footprints ahead of you. How is this possible?',
    },
    options: [
      {
        text: { ru: 'Ты идёшь по кругу', en: 'You are walking in a circle' },
        direction: 360,
        insight: 2,
        nextEncounter: 'dunes',
        response: {
          ru: 'Барханы — это круг, ставший линией. И линия, ставшая кругом.',
          en: 'The dunes are a circle made line. And a line made circle.',
        },
      },
      {
        text: { ru: 'Кто-то шёл твоей дорогой прежде', en: 'Someone walked your path before' },
        direction: 0,
        insight: 3,
        nextEncounter: 'ruins',
        response: {
          ru: 'Руины — это дом того, кто шёл прежде. Его следы — его наследство тебе.',
          en: 'The ruins are the home of the one who walked before. His tracks — his legacy to you.',
        },
      },
      {
        text: { ru: 'Время в пустыне идёт не по прямой', en: 'Time in the desert does not move in a line' },
        direction: 90,
        insight: 6,
        nextEncounter: 'stars',
        response: {
          ru: 'Звёзды подтверждают. Они видели тебя идущим по своим следам ещё до того, как ты родился.',
          en: 'The stars confirm. They saw you walking in your own tracks before you were born.',
        },
      },
    ],
  },
  {
    id: 'k11',
    tone: 'poetic',
    question: {
      ru: 'Цветок расцветает в пустыне раз в сто лет. Ты видишь его. Что ты делаешь?',
      en: 'A flower blooms in the desert once in a hundred years. You see it. What do you do?',
    },
    options: [
      {
        text: { ru: 'Сорвать и сохранить', en: 'Pick it and keep it' },
        direction: 180,
        insight: -1,
        nextEncounter: 'caravan',
        response: {
          ru: 'Цветок вянут в твоей руке. Караван качает головой: сохранённое — не живое.',
          en: 'The flower withers in your hand. The caravan shakes its head: what is kept is not alive.',
        },
      },
      {
        text: { ru: 'Сидеть рядом, пока не отцветёт', en: 'Sit beside it until it fades' },
        direction: 0,
        insight: 5,
        nextEncounter: 'silence',
        response: {
          ru: 'Ты сидишь. Цветок цветёт. Время останавливается. Это и было его цветение.',
          en: 'You sit. The flower blooms. Time stops. This was its blooming.',
        },
      },
      {
        text: { ru: 'Уйти, не трогая', en: 'Leave without touching' },
        direction: 90,
        insight: 4,
        nextEncounter: 'dunes',
        response: {
          ru: 'Ты уходишь. Цветок остаётся. Кто-то другой увидит его — или никто. Это его путь.',
          en: 'You leave. The flower remains. Someone else will see it — or no one. That is its way.',
        },
      },
    ],
  },
  {
    id: 'k12',
    tone: 'mystic',
    question: {
      ru: 'Ты слышишь голос в песке. Он говорит твоим голосом. Что это?',
      en: 'You hear a voice in the sand. It speaks in your voice. What is it?',
    },
    options: [
      {
        text: { ru: 'Песок помнит всё, что ты говорил', en: 'The sand remembers all you have said' },
        direction: 270,
        insight: 4,
        nextEncounter: 'ruins',
        response: {
          ru: 'Руины вторят: камень помнит дольше, чем песок. Но и он забывает.',
          en: 'The ruins echo: stone remembers longer than sand. But even it forgets.',
        },
      },
      {
        text: { ru: 'Ты сам стал эхом пустыни', en: 'You have become the desert\'s echo' },
        direction: 90,
        insight: 6,
        nextEncounter: 'silence',
        response: {
          ru: 'Голос в песке умолкает. Он был тобой. Теперь ты — им.',
          en: 'The voice in the sand falls silent. It was you. Now you are it.',
        },
      },
      {
        text: { ru: 'Это ветер играет твоими словами', en: 'The wind plays with your words' },
        direction: 0,
        insight: 2,
        nextEncounter: 'dunes',
        response: {
          ru: 'Ветер хохочет. Он любит красть слова и носить их, как старые одежды.',
          en: 'The wind laughs. It loves to steal words and wear them like old garments.',
        },
      },
    ],
  },
];

// ============ DESERT INTRO MESSAGES ============

export const DESERT_GREETINGS: LocalizedList = {
  ru: [
    'Пустыня смотрит на тебя. Её глаза — барханы. Она ждёт.',
    'Ветер приносит песок к твоим ногам. Это — её приветствие.',
    'Солнце зависло над головой. Пустыня собирается говорить.',
    'Ночь опустилась. Звёзды — это глаза пустыни, открытые наконец.',
  ],
  en: [
    'The desert looks at you. Its eyes are the dunes. It waits.',
    'The wind brings sand to your feet. This is its greeting.',
    'The sun hangs above your head. The desert prepares to speak.',
    'Night has fallen. The stars are the desert\'s eyes, finally open.',
  ],
};

export const DAILY_KOAN_INTROS: LocalizedList = {
  ru: [
    'Пустыня прислала тебе сегодняшний коан:',
    'Сегодняшний шёпот песков:',
    'Пустыня не забыла тебя. Вот её вопрос дня:',
    'Утренний ветер принёс тебе коан:',
  ],
  en: [
    'The desert sent you today\'s koan:',
    'Today\'s whisper of the sands:',
    'The desert has not forgotten you. Here is its question of the day:',
    'The morning wind brought you a koan:',
  ],
};

// ============ BOT STRINGS ============

export const BOT = {
  welcome: {
    ru: '🏜️ *Голос Пустыни*\n\nТы — странствующий монах на краю мира. Каждый день пустыня задаёт тебе коан. Твой ответ определяет твой путь.\n\nВыбери действие ниже или открой веб-версию для полного опыта.',
    en: '🏜️ *Voice of the Desert*\n\nYou are a wandering monk at the edge of the world. Each day the desert asks you a koan. Your answer shapes your path.\n\nChoose an action below or open the web version for the full experience.',
  },
  help: {
    ru: 'Команды:\n/play — продолжить странствие\n/new — новое странствие\n/lang — сменить язык\n/help — эта справка\n\nИли открой веб-версию кнопкой меню.',
    en: 'Commands:\n/play — continue the journey\n/new — new journey\n/lang — switch language\n/help — this help\n\nOr open the web version via the menu button.',
  },
  chooseAnswer: { ru: 'Выбери ответ:', en: 'Choose your answer:' },
  chooseAction: { ru: 'Что ты сделаешь?', en: 'What will you do?' },
  yourStats: { ru: 'Твои странствия', en: 'Your journey' },
  newGameStarted: {
    ru: '🌅 Новое странствие начато. Пустыня ждёт твоего первого шага.',
    en: '🌅 A new journey begins. The desert awaits your first step.',
  },
  langChanged: { ru: 'Язык изменён на русский.', en: 'Language changed to English.' },
  langPrompt: { ru: 'Выбери язык:', en: 'Choose language:' },
  openWeb: { ru: '🌐 Открыть веб-версию', en: '🌐 Open web version' },
  playGame: { ru: '🎮 Играть', en: '🎮 Play' },
  newGame: { ru: '🔄 Новое странствие', en: '🔄 New journey' },
  language: { ru: '🌐 Язык', en: '🌐 Language' },
  helpCmd: { ru: '❓ Справка', en: '❓ Help' },
  back: { ru: '← Назад', en: '← Back' },
  emptyJourney: {
    ru: 'Ты ещё не начал странствие. Нажми «Играть».',
    en: 'You have not started a journey yet. Tap "Play".',
  },
  finaleTitle: { ru: 'Конец пути', en: 'End of the Path' },
  finaleBody: {
    ru: 'Пустыня замолкает. Ты оборачиваешься — и видишь, что следов нет. Ветер стёр их. Но что-то осталось. Что-то, что нельзя унести и нельзя потерять. Ты больше не странник. Ты — сама пустыня.',
    en: 'The desert falls silent. You turn around — and see no footprints. The wind has erased them. But something remains. Something that cannot be carried and cannot be lost. You are no longer a wanderer. You are the desert itself.',
  },
  finaleStats: { ru: 'Твоё странствие', en: 'Your journey' },
  playAgain: { ru: 'Начать заново', en: 'Begin again' },
  // Tooltips
  tooltipDay: { ru: 'Сколько дней в пути', en: 'How many days on the path' },
  tooltipDistance: { ru: 'Сколько шагов пройдено', en: 'Steps taken' },
  tooltipInsight: { ru: 'Прозрение — мера понимания. Растёт от правильных ответов', en: 'Insight — measure of understanding. Grows from wise answers' },
  tooltipPhase: { ru: 'Время суток. Меняется с каждым шагом', en: 'Time of day. Shifts with each step' },
  tooltipNarrate: { ru: 'Нажми, чтобы пустыня повторила вопрос', en: 'Tap for the desert to repeat the question' },
  tooltipAnswer: { ru: 'Выбери ответ. У каждого — свои последствия', en: 'Choose your answer. Each has its consequences' },
  tooltipEncounter: { ru: 'Встреча на пути. Реши, что делать', en: 'An encounter on the path. Decide what to do' },
  tooltipEncounterChoice: { ru: 'Действие определяет, что будет дальше', en: 'Your action shapes what comes next' },
} as const;

export function tr(loc: Localized, lang: 'ru' | 'en'): string {
  return loc[lang] ?? loc.ru;
}
