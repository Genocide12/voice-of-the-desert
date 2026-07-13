/**
 * Daily koan cron endpoint.
 * Vercel cron calls this daily; it broadcasts a koan to all known chats.
 * (For simplicity, we rely on an in-memory chat list; for production use a DB.)
 * Triggered by Vercel Cron: 0 9 * * *  (every day at 09:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { KOANS, DAILY_KOAN_INTROS, type Localized } from '@/lib/i18n/content';
import type { Lang } from '@/lib/game/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory registered chat list (for demo; in production persist to DB)
const registeredChats = new Set<number>();

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';

function tr(loc: Localized, lang: Lang): string {
  return loc[lang] ?? loc.ru;
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'no_bot_token' }, { status: 500 });
  }

  // Pick today's koan deterministically by date
  const dayOfYear = Math.floor(Date.now() / 86_400_000);
  const koan = KOANS[dayOfYear % KOANS.length]!;

  let sent = 0;
  let failed = 0;

  for (const chatId of registeredChats) {
    // Each chat would store its own lang; defaulting to ru for this demo
    const lang: Lang = 'ru';
    const intro = DAILY_KOAN_INTROS[lang][dayOfYear % DAILY_KOAN_INTROS[lang].length]!;
    const text = `${intro}\n\n*${tr(koan.question, lang)}*`;
    try {
      const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      if (resp.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, koanId: koan.id });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'daily-koan-cron',
    registeredChats: registeredChats.size,
    nextKoanId: KOANS[Math.floor(Date.now() / 86_400_000) % KOANS.length]?.id,
  });
}
