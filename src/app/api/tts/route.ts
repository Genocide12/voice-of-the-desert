/**
 * TTS API route: uses node-edge-tts to synthesize speech.
 * Voices:
 *   RU female: ru-RU-SvetlanaNeural
 *   RU male:   ru-RU-DmitryNeural
 *   EN female: en-US-AriaNeural
 *   EN male:   en-US-GuyNeural
 */

import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const VOICES: Record<string, string> = {
  'ru-female': 'ru-RU-SvetlanaNeural',
  'ru-male': 'ru-RU-DmitryNeural',
  'en-female': 'en-US-AriaNeural',
  'en-male': 'en-US-GuyNeural',
};

export async function POST(req: NextRequest) {
  const tmpFile = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
  try {
    const body = await req.json();
    const text: string = (body?.text ?? '').toString().slice(0, 1000);
    const lang: string = body?.lang === 'en' ? 'en' : 'ru';
    const gender: string = body?.gender === 'male' ? 'male' : 'female';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const voiceKey = `${lang}-${gender}`;
    const voice = VOICES[voiceKey] ?? VOICES['ru-female']!;

    const tts = new EdgeTTS({
      voice,
      lang: lang === 'en' ? 'en-US' : 'ru-RU',
      rate: '-5%',
      pitch: '0%',
      volume: '+0%',
    });

    // node-edge-tts saves to file
    await tts.ttsPromise(text, tmpFile);
    const audioBuffer = await fs.readFile(tmpFile);

    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown TTS error';
    console.error('TTS error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    // Cleanup temp file
    try {
      await fs.unlink(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'voice-of-the-desert-tts',
    voices: Object.keys(VOICES),
  });
}
