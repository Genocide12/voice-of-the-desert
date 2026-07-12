# 🏜️ Голос Пустыни · Voice of the Desert

Медитативная игра о странствующем монахе, пересекающем бесконечную пустыню коанов. Каждый день пустыня задаёт философский вопрос; твой ответ определяет твой путь, встречи и тон пустыни.

**A meditative game about a wandering monk crossing an endless desert of koans. Each day the desert asks a philosophical question; your answer shapes your path, encounters, and the desert's tone.**

## ✨ Features

- 🌐 **Bilingual** RU/EN with auto-detection (browser + Telegram locale)
- 🎨 **Dynamic day/dusk/night/dawn themes** — visuals shift with the phase
- 📜 **Poetic (day) + mystical (night) tone** — Rumi/Hafiz by day, symbols by night
- 🔊 **Procedural audio** — Web Audio API SFX (wind, sand, bell, chime) + generative pentatonic ambient
- 🗣️ **TTS narration** — Microsoft Edge Neural voices (Svetlana/Dmitry for RU, Aria/Guy for EN) via `node-edge-tts`
- 📳 **Haptics** — Web Vibration API + Telegram HapticFeedback
- 💡 **Tooltips** — desktop hover + mobile long-press (TouchTooltip)
- 📱 **PWA** — installable, offline-capable, manifest + service worker
- 📴 **Non-selectable page** for native app feel
- 🗺️ **Path map** — visual trail of your journey across the sand
- 📖 **Journal** — every koan, answer, and desert response recorded
- 🤖 **Telegram bot** — full text-mode gameplay via inline buttons + Web App menu button
- ⏰ **Daily koan** — Vercel Cron pushes a koan every day

## 🎮 Play

- **Web**: visit the deployed Vercel URL
- **Telegram**: open the bot, tap **Play** or use `/play`, or open the Web App via the menu button

## 🛠️ Tech Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Zustand (persist to localStorage)
- Web Audio API (procedural sound, no audio files)
- `node-edge-tts` (Microsoft Edge Neural TTS, free, no API key)
- Telegram Bot API (webhook + inline keyboards)
- Framer Motion (transitions)

## 🔧 Environment Variables

Set these in Vercel (Project → Settings → Environment Variables):

```
BOT_TOKEN     — Telegram bot token from @BotFather
WEBAPP_URL    — https://your-app.vercel.app  (the production URL)
CRON_SECRET   — (optional) secret to protect /api/cron/daily-koan
```

## 🚀 Deploy

This project is configured for Vercel with:
- `vercel.json` — daily cron at 09:00 UTC for the daily koan
- Next.js standalone output
- PWA assets in `/public`

## 📁 Structure

```
src/
├── app/
│   ├── page.tsx                  # Main game UI
│   ├── layout.tsx                # PWA meta + Telegram SDK
│   ├── globals.css               # Day/dusk/night/dawn themes
│   └── api/
│       ├── tts/route.ts          # Edge TTS endpoint
│       ├── bot-webhook/route.ts  # Telegram bot
│       └── cron/daily-koan/      # Daily koan cron
├── lib/
│   ├── i18n/                     # Bilingual content + koans
│   ├── game/                     # Game engine + types
│   ├── store/                    # Zustand store
│   ├── audio/                    # AudioEngine + TTS service
│   └── haptics.ts                # Vibration + Telegram haptics
└── components/game/              # TouchTooltip + game components
public/
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker
└── icons/                        # PWA icons
```

## 🎭 Game Design

12 koans across two tones (poetic + mystic), 8 encounter types (caravan, mirage, well, beast, dunes, ruins, stars, silence), each with 3 choices. Phase progression: **day → dusk → night → dawn → day**. Each choice shifts phase, distance, and insight.

---

Made for the wanderer in you.
