/**
 * i18n system for "Voice of the Desert" (Голос Пустыни)
 * Simple key-based system with RU/EN support and locale auto-detection.
 */

export type Lang = 'ru' | 'en';

export type Localized = { ru: string; en: string };

export type LocalizedList = { ru: string[]; en: string[] };

/** Detect language from browser/Telegram/storage */
export function detectLang(): Lang {
  if (typeof window === 'undefined') return 'ru';

  // 1. localStorage override
  try {
    const stored = window.localStorage.getItem('desert-lang');
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }

  // 2. Telegram WebApp
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.language_code) {
      const code = tg.initDataUnsafe.user.language_code.toLowerCase();
      if (code.startsWith('ru')) return 'ru';
      if (code.startsWith('en')) return 'en';
    }
  } catch {
    /* ignore */
  }

  // 3. Browser
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('en')) return 'en';

  return 'ru';
}

/** Translate a Localized object */
export function t(loc: Localized, lang: Lang): string {
  return loc[lang] ?? loc.ru;
}

/** Translate a LocalizedList and pick a variation by seed */
export function pickVariation(list: LocalizedList, lang: Lang, seed: number): string {
  const arr = list[lang] ?? list.ru;
  if (!arr || arr.length === 0) return '';
  const idx = Math.abs(seed) % arr.length;
  return arr[idx];
}
