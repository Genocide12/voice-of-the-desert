/**
 * Health check endpoint — called hourly by Vercel Cron.
 * Checks:
 *   1. Web app (homepage) — HTTP 200
 *   2. TTS endpoint — returns audio
 *   3. Bot webhook — returns JSON with ok:true
 *   4. Telegram bot API getWebhookInfo — webhook active, no errors
 * If ANY check fails, sends immediate notification to bot owner.
 * Also sends a daily "all good" summary at 09:00 UTC.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID ?? '8808573708';
const APP_URL = process.env.WEBAPP_URL ?? 'https://voice-of-the-desert-nine.vercel.app';

interface CheckResult {
  name: string;
  ok: boolean;
  status?: number;
  error?: string;
  latencyMs?: number;
}

async function checkUrl(name: string, url: string, options?: RequestInit): Promise<CheckResult> {
  const start = Date.now();
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000), ...options });
    const latencyMs = Date.now() - start;
    if (resp.ok) {
      return { name, ok: true, status: resp.status, latencyMs };
    }
    return { name, ok: false, status: resp.status, latencyMs, error: `HTTP ${resp.status}` };
  } catch (e) {
    return { name, ok: false, error: e instanceof Error ? e.message : 'fetch failed', latencyMs: Date.now() - start };
  }
}

async function notifyOwner(text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: OWNER_CHAT_ID,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error('notifyOwner error:', e);
  }
}

export async function POST(req: NextRequest) {
  // Verify cron secret (optional)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: CheckResult[] = [];

  // 1. Web app homepage
  results.push(await checkUrl('Web app', APP_URL));

  // 2. TTS endpoint
  results.push(
    await checkUrl('TTS API', `${APP_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'тест', lang: 'ru', gender: 'female' }),
    }),
  );

  // 3. Bot webhook GET
  results.push(await checkUrl('Bot webhook', `${APP_URL}/api/bot-webhook`));

  // 4. Telegram getWebhookInfo
  if (BOT_TOKEN) {
    const tgStart = Date.now();
    try {
      const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`, {
        signal: AbortSignal.timeout(10000),
      });
      const tgData = await tgResp.json();
      const pending = tgData?.result?.pending_update_count ?? 0;
      const lastError = tgData?.result?.last_error_message;
      const tgOk = tgResp.ok && pending < 50 && !lastError;
      results.push({
        name: 'Telegram webhook',
        ok: tgOk,
        status: tgResp.status,
        latencyMs: Date.now() - tgStart,
        error: tgOk ? undefined : `pending=${pending}, lastError=${lastError ?? 'none'}`,
      });
    } catch (e) {
      results.push({ name: 'Telegram webhook', ok: false, error: e instanceof Error ? e.message : 'failed' });
    }
  }

  const allOk = results.every((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  // Build report
  const statusEmoji = (ok: boolean) => (ok ? '✅' : '❌');
  const reportLines = results.map((r) => {
    const latency = r.latencyMs ? ` (${r.latencyMs}ms)` : '';
    const err = r.error ? ` — ${r.error}` : '';
    return `${statusEmoji(r.ok)} ${r.name}${latency}${err}`;
  });

  if (!allOk) {
    // IMMEDIATE alert on failure
    const alertText = [
      `🚨 *ALERT: Service down*`,
      '',
      ...reportLines,
      '',
      `🕐 ${new Date().toUTCString()}`,
      `🔗 ${APP_URL}`,
    ].join('\n');
    await notifyOwner(alertText);
  } else {
    // Check if it's 09:00 UTC (daily summary) — only send if hour matches
    const hour = new Date().getUTCHours();
    if (hour === 9) {
      const summaryText = [
        `✅ *Daily health report*`,
        '',
        ...reportLines,
        '',
        `🕐 ${new Date().toUTCString()}`,
      ].join('\n');
      await notifyOwner(summaryText);
    }
  }

  return NextResponse.json({
    ok: allOk,
    timestamp: new Date().toISOString(),
    results,
    failedCount: failed.length,
    notified: !allOk || (allOk && new Date().getUTCHours() === 9),
  });
}

export async function GET(req: NextRequest) {
  // Allow manual health check via GET
  return POST(req);
}
