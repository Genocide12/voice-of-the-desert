/**
 * GitHub Webhook receiver — sends push/deploy notifications to bot owner.
 * Configure in GitHub repo Settings → Webhooks → Add webhook:
 *   - Payload URL: https://voice-of-the-desert-nine.vercel.app/api/github-webhook
 *   - Content type: application/json
 *   - Events: Push, Deployments
 *   - Secret: set GITHUB_WEBHOOK_SECRET env var (optional but recommended)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID ?? '8808573708'; // fallback to bot's own ID

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
  try {
    const event = req.headers.get('x-github-event') ?? '';
    const body = await req.json();

    // Push event
    if (event === 'push') {
      const repo = body.repository?.full_name ?? 'unknown';
      const ref = body.ref ?? '';
      const branch = ref.replace('refs/heads/', '');
      const pusher = body.pusher?.name ?? 'unknown';
      const commits = body.commits ?? [];
      const count = commits.length;

      if (count === 0) {
        // Branch deletion or other non-commit push
        return NextResponse.json({ ok: true, skipped: true });
      }

      const commitLines = commits.slice(0, 5).map((c: any) => {
        const msg = (c.message ?? '').split('\n')[0]?.slice(0, 60) ?? '';
        const author = c.author?.username ?? c.author?.name ?? '?';
        const sha = (c.id ?? '').slice(0, 7);
        return `  \`${sha}\` ${msg} — *${author}*`;
      }).join('\n');

      const more = count > 5 ? `\n  _...and ${count - 5} more_` : '';

      const text = [
        `📦 *Push to ${repo}*`,
        `Branch: \`${branch}\``,
        `By: ${pusher}`,
        `Commits: ${count}`,
        '',
        commitLines + more,
        '',
        body.compare ? `🔗 [View diff](${body.compare})` : '',
      ].filter(Boolean).join('\n');

      await notifyOwner(text);
      return NextResponse.json({ ok: true, notified: true });
    }

    // Deployment event
    if (event === 'deployment_status') {
      const repo = body.repository?.full_name ?? 'unknown';
      const state = body.deployment_status?.state ?? 'unknown';
      const targetUrl = body.deployment_status?.target_url ?? '';
      const environment = body.deployment?.environment ?? 'unknown';
      const creator = body.deployment?.creator?.login ?? 'unknown';

      const stateEmoji: Record<string, string> = {
        success: '✅',
        failure: '❌',
        error: '❌',
        pending: '⏳',
        queued: '⏳',
        in_progress: '🔄',
      };
      const emoji = stateEmoji[state] ?? 'ℹ️';

      const text = [
        `${emoji} *Deploy ${state}: ${repo}*`,
        `Environment: \`${environment}\``,
        `By: ${creator}`,
        targetUrl ? `🔗 [View deployment](${targetUrl})` : '',
      ].filter(Boolean).join('\n');

      await notifyOwner(text);
      return NextResponse.json({ ok: true, notified: true });
    }

    // Ping event (when webhook first configured)
    if (event === 'ping') {
      const repo = body.repository?.full_name ?? 'unknown';
      await notifyOwner(`🔌 *GitHub webhook connected*\nRepo: ${repo}\nEvents will now be sent here.`);
      return NextResponse.json({ ok: true, pong: true });
    }

    return NextResponse.json({ ok: true, event, skipped: true });
  } catch (e) {
    console.error('github-webhook error:', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'unknown' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'github-webhook',
    events: ['push', 'deployment_status', 'ping'],
    ownerChatId: OWNER_CHAT_ID ? 'configured' : 'missing',
  });
}
