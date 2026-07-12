'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sunset, Sunrise, Volume2, VolumeX, Music, Music2, Smartphone, Vibrate, Globe, RotateCcw, Download, Map as MapIcon, BookOpen, Compass, Settings as SettingsIcon, Play } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameStore as _useGameStore } from '@/lib/store/gameStore';
import { detectLang, type Lang, type Localized } from '@/lib/i18n';
import { UI, KOANS, ENCOUNTER_NAMES, ENCOUNTER_DESCRIPTIONS, DESERT_GREETINGS, tr } from '@/lib/i18n/content';
import {
  getCurrentKoan,
  getCurrentEncounterChoices,
  resolveKoanAnswer,
  resolveEncounterChoice,
  createInitialState,
  getKoanForDay,
} from '@/lib/game/engine';
import { getAudioEngine } from '@/lib/audio/AudioEngine';
import { getTTS } from '@/lib/audio/ttsService';
import { getHaptics } from '@/lib/haptics';
import { TouchTooltip } from '@/components/game/TouchTooltip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

type Tab = 'journey' | 'map' | 'journal' | 'settings';

const PHASE_ICONS = { day: Sun, dusk: Sunset, night: Moon, dawn: Sunrise };

export default function Home() {
  const { state, settings, startGame, newGame, setKoanAnswered, setEncounterResolved, setLang, toggleSound, toggleMusic, toggleVoice, toggleVibration, setVoiceGender } = useGameStore();
  const [tab, setTab] = useState<Tab>('journey');
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [showResponse, setShowResponse] = useState<{ text: string; insight: number } | null>(null);
  const [desertResponse, setDesertResponse] = useState<string | null>(null);
  const [pendingAnswerIdx, setPendingAnswerIdx] = useState<number | null>(null);

  // Init: detect language, set up audio, Telegram
  useEffect(() => {
    const lang = detectLang();
    if (settings.lang !== lang) setLang(lang);

    // Apply settings to engines
    const audio = getAudioEngine();
    audio.setSfxEnabled(settings.soundEnabled);
    audio.setMusicEnabled(settings.musicEnabled);
    const tts = getTTS();
    tts.setEnabled(settings.voiceEnabled);
    const haptics = getHaptics();
    haptics.setEnabled(settings.vibrationEnabled);

    // Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch {}
    }

    // PWA install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Apply settings changes to engines
  useEffect(() => {
    const audio = getAudioEngine();
    audio.setSfxEnabled(settings.soundEnabled);
    audio.setMusicEnabled(settings.musicEnabled);
  }, [settings.soundEnabled, settings.musicEnabled]);

  useEffect(() => {
    getTTS().setEnabled(settings.voiceEnabled);
  }, [settings.voiceEnabled]);

  useEffect(() => {
    getHaptics().setEnabled(settings.vibrationEnabled);
  }, [settings.vibrationEnabled]);

  // Start ambient music when game starts
  useEffect(() => {
    if (state?.started && settings.musicEnabled) {
      const audio = getAudioEngine();
      audio.resume();
      audio.startAmbient();
      audio.setPhase(state.phase);
    }
  }, [state?.started, settings.musicEnabled]);

  // Phase changes
  useEffect(() => {
    if (state?.phase) {
      getAudioEngine().setPhase(state.phase);
    }
  }, [state?.phase]);

  // Narrate the current koan question IMMEDIATELY when it appears.
  // TTS reads ONLY the question text — no topic title, no greeting, no answer narration.
  // If the player answers before the question finishes, TTS stops and moves on.
  useEffect(() => {
    if (!state?.started || !settings.voiceEnabled) return;
    if (state.awaitingChoice === 'koan' && state.currentKoanId) {
      const koan = KOANS.find((k) => k.id === state.currentKoanId);
      if (koan) {
        // Stop any current narration first, then speak the new question
        getTTS().stop();
        const timer = setTimeout(() => {
          getTTS().speak(tr(koan.question, settings.lang), settings.lang, settings.voiceGender);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    // If we're NOT on a koan (encounter/finale), stop any ongoing question narration
    if (state.awaitingChoice !== 'koan') {
      getTTS().stop();
    }
  }, [state?.currentKoanId, state?.awaitingChoice, state?.started, settings.voiceEnabled, settings.lang, settings.voiceGender]);

  const lang = settings.lang;

  const handleButtonClick = useCallback(() => {
    const audio = getAudioEngine();
    audio.resume();
    audio.click();
    getHaptics().click();
  }, []);

  const handleStart = useCallback(() => {
    handleButtonClick();
    startGame();
  }, [handleButtonClick, startGame]);

  const handleNewGame = useCallback(() => {
    if (!confirm(tr(UI.newGameConfirm, lang))) return;
    handleButtonClick();
    newGame();
    setShowResponse(null);
    setDesertResponse(null);
    setPendingAnswerIdx(null);
  }, [handleButtonClick, newGame, lang]);

  // Koan answer — STOP question narration immediately, then show encounter
  const handleKoanAnswer = useCallback(
    (idx: number) => {
      if (!state) return;
      const koan = getCurrentKoan(state);
      if (!koan) return;
      handleButtonClick();
      // STOP TTS immediately — don't finish the question, move to encounter
      getTTS().stop();
      const opt = koan.options[idx];
      if (!opt) return;
      const { state: newState } = resolveKoanAnswer(state, koan, idx, lang);
      setKoanAnswered(newState);
      setPendingAnswerIdx(idx);

      // Show desert response (visual only — NO TTS narration of response)
      const responseText = tr(opt.response, lang);
      setDesertResponse(responseText);

      // Insight haptic
      if (opt.insight > 0) getHaptics().success();
      else if (opt.insight < 0) getHaptics().warning();

      // SFX: chime for positive insight
      if (opt.insight > 0) {
        setTimeout(() => getAudioEngine().chime(), 300);
      }

      // Wind sound on encounter transition
      setTimeout(() => getAudioEngine().wind(2), 500);

      // Auto-clear response after a delay
      setTimeout(() => {
        setDesertResponse(null);
      }, 6000);
    },
    [state, lang, handleButtonClick, setKoanAnswered],
  );

  // Encounter choice — uses pendingAnswer/pendingResponse from state (not journal[0])
  const handleEncounterChoice = useCallback(
    (idx: number) => {
      if (!state || !state.currentEncounter) return;
      const choices = getCurrentEncounterChoices(state);
      const choice = choices[idx];
      if (!choice) return;
      handleButtonClick();
      getTTS().stop();

      const { state: newState, isFinale } = resolveEncounterChoice(
        state,
        state.currentEncounter,
        idx,
        lang,
      );
      setEncounterResolved(newState);

      // Show result
      const resultText = tr(choice.result, lang);
      setShowResponse({ text: resultText, insight: choice.insight });

      // Haptics
      if (choice.insight > 0) getHaptics().success();
      else if (choice.insight < 0) getHaptics().warning();

      // SFX
      if (choice.insight > 0) {
        setTimeout(() => getAudioEngine().chime(), 200);
      }
      // Bell on phase transition to night
      if (choice.nextPhase === 'night') {
        setTimeout(() => getAudioEngine().bell(220), 800);
      } else if (choice.nextPhase === 'dawn') {
        setTimeout(() => getAudioEngine().bell(330), 800);
      }
      // Bell on finale
      if (isFinale) {
        setTimeout(() => getAudioEngine().bell(110), 1000);
        setTimeout(() => getAudioEngine().bell(165), 2000);
        setTimeout(() => getAudioEngine().bell(220), 3000);
      }

      setTimeout(() => {
        setShowResponse(null);
      }, 5000);
    },
    [state, lang, handleButtonClick, setEncounterResolved],
  );

  const phaseClass = state?.phase ? `phase-${state.phase}` : 'phase-day';

  return (
    <main className={`${phaseClass} min-h-screen flex flex-col`}>
      <div className="sand-texture flex-1 flex flex-col">
        {/* Header */}
        <header className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-base font-semibold leading-tight">{tr(UI.title, lang)}</h1>
              <p className="text-[10px] opacity-60 leading-tight">{tr(UI.subtitle, lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TouchTooltip content={tr(UI.tooltipLang, lang)} side="bottom">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { handleButtonClick(); setLang(lang === 'ru' ? 'en' : 'ru'); }}>
                <Globe className="w-4 h-4" />
              </Button>
            </TouchTooltip>
            {installEvent && (
              <TouchTooltip content={tr(UI.tooltipInstall, lang)} side="bottom">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                  handleButtonClick();
                  if (installEvent) {
                    installEvent.prompt();
                    installEvent.userChoice.then(() => setInstallEvent(null));
                  }
                }}>
                  <Download className="w-4 h-4" />
                </Button>
              </TouchTooltip>
            )}
          </div>
        </header>

        {/* Stats bar (only when game active) */}
        {state?.started && (
          <div className="px-4 py-2 flex items-center justify-between gap-2 text-xs">
            <TouchTooltip content={tr(UI.tooltipPhase, lang)} side="bottom">
              <div className="flex-1"><Stat icon={PHASE_ICONS[state.phase]} label={tr(UI.phase, lang)} value={tr(state.phase === 'day' ? UI.phaseDay : state.phase === 'dusk' ? UI.phaseDusk : state.phase === 'night' ? UI.phaseNight : UI.phaseDawn, lang)} /></div>
            </TouchTooltip>
            <TouchTooltip content={tr(UI.tooltipDay, lang)} side="bottom">
              <div className="flex-1"><Stat icon={Sun} label={tr(UI.day, lang)} value={String(state.day)} /></div>
            </TouchTooltip>
            <TouchTooltip content={tr(UI.tooltipDistance, lang)} side="bottom">
              <div className="flex-1"><Stat icon={Compass} label={tr(UI.distance, lang)} value={String(state.distance)} /></div>
            </TouchTooltip>
            <TouchTooltip content={tr(UI.tooltipInsight, lang)} side="bottom">
              <div className="flex-1"><Stat icon={BookOpen} label={tr(UI.insight, lang)} value={String(state.insight)} /></div>
            </TouchTooltip>
          </div>
        )}

        {/* Tab bar */}
        <nav className="px-4 py-2 flex items-center gap-1 border-b border-border/40">
          <TabButton active={tab === 'journey'} onClick={() => { handleButtonClick(); setTab('journey'); }} icon={Play} label={tr(UI.tabJourney, lang)} />
          <TabButton active={tab === 'map'} onClick={() => { handleButtonClick(); setTab('map'); }} icon={MapIcon} label={tr(UI.tabMap, lang)} />
          <TabButton active={tab === 'journal'} onClick={() => { handleButtonClick(); setTab('journal'); }} icon={BookOpen} label={tr(UI.tabJournal, lang)} />
          <TabButton active={tab === 'settings'} onClick={() => { handleButtonClick(); setTab('settings'); }} icon={SettingsIcon} label={tr(UI.tabSettings, lang)} />
        </nav>

        {/* Main content */}
        <div className="flex-1 px-4 py-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {tab === 'journey' && (
              <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                {!state?.started ? (
                  <StartScreen lang={lang} onStart={handleStart} />
                ) : (
                  <JourneyView
                    state={state}
                    lang={lang}
                    onKoanAnswer={handleKoanAnswer}
                    onEncounterChoice={handleEncounterChoice}
                    desertResponse={desertResponse}
                    showResult={showResponse}
                    onNewGame={handleNewGame}
                  />
                )}
              </motion.div>
            )}
            {tab === 'map' && (
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <MapView state={state} lang={lang} />
              </motion.div>
            )}
            {tab === 'journal' && (
              <motion.div key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <JournalView state={state} lang={lang} />
              </motion.div>
            )}
            {tab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <SettingsView
                  settings={settings}
                  lang={lang}
                  onToggleSound={toggleSound}
                  onToggleMusic={toggleMusic}
                  onToggleVoice={toggleVoice}
                  onToggleVibration={toggleVibration}
                  onSetVoiceGender={setVoiceGender}
                  onSetLang={setLang}
                  onButtonClick={handleButtonClick}
                  onNewGame={handleNewGame}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-auto px-4 py-3 text-center text-[10px] opacity-50">
          <p>Голос Пустыни · Voice of the Desert</p>
          <p className="mt-0.5"> Made for the wanderer in you</p>
        </footer>
      </div>
    </main>
  );
}

// ============ Sub-components ============

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <Icon className="w-3.5 h-3.5 opacity-70" />
      <div className="text-[10px] opacity-60 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-md transition-colors min-h-[44px] justify-center ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function StartScreen({ lang, onStart }: { lang: Lang; onStart: () => void }) {
  const greeting = DESERT_GREETINGS[lang][0]!;
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-6 px-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }} className="flex flex-col items-center gap-4">
        <div className="relative">
          <Sun className="w-20 h-20 text-primary animate-pulse" style={{ animationDuration: '4s' }} />
          {lang === 'ru' ? null : null}
        </div>
        <div>
          <h2 className="text-2xl font-serif font-semibold mb-2">{tr(UI.title, lang)}</h2>
          <p className="text-sm opacity-70 italic max-w-xs">{greeting}</p>
        </div>
      </motion.div>
      <Button size="lg" onClick={onStart} className="min-h-[48px] px-8">
        {tr(UI.beginJourney, lang)}
      </Button>
    </div>
  );
}

function JourneyView({ state, lang, onKoanAnswer, onEncounterChoice, desertResponse, showResult, onNewGame }: {
  state: ReturnType<typeof useGameStore>['state'];
  lang: Lang;
  onKoanAnswer: (idx: number) => void;
  onEncounterChoice: (idx: number) => void;
  desertResponse: string | null;
  showResult: { text: string; insight: number } | null;
  onNewGame: () => void;
}) {
  if (!state) return null;

  // FINALE view — game finished
  if (state.awaitingChoice === 'finale' || state.finished) {
    return <FinaleView state={state} lang={lang} onNewGame={onNewGame} />;
  }

  const koan = getCurrentKoan(state);
  const encounterChoices = getCurrentEncounterChoices(state);

  // Encounter view
  if (state.awaitingChoice === 'encounter' && state.currentEncounter) {
    const enc = state.currentEncounter;
    const name = tr(ENCOUNTER_NAMES[enc], lang);
    const descArr = ENCOUNTER_DESCRIPTIONS[enc][lang];
    const desc = descArr[state.day % descArr.length]!;
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <AnimatePresence>
          {desertResponse && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center italic text-sm opacity-80 px-2">
              <span className="opacity-60">✦ {tr(UI.desertSpeaks, lang)} </span>
              {desertResponse}
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="p-5 border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <EncounterIcon type={enc} />
            <h3 className="text-lg font-serif font-semibold flex-1">{name}</h3>
          </div>
          <p className="text-sm italic opacity-80 leading-relaxed">{desc}</p>
        </Card>

        {showResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center px-4 py-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-sm italic">{showResult.text}</p>
            {showResult.insight !== 0 && (
              <p className={`text-xs mt-2 ${showResult.insight > 0 ? 'text-primary' : 'text-destructive'}`}>
                {showResult.insight > 0 ? '+' : ''}{showResult.insight} {tr(UI.insight, lang)}
              </p>
            )}
          </motion.div>
        )}

        <div className="flex flex-col gap-2">
          {encounterChoices.map((c, i) => (
            <TouchTooltip key={i} content={tr(UI.tooltipEncounterChoice, lang)} side="top">
              <Button variant="outline" className="justify-start text-left min-h-[48px] px-4 py-3 whitespace-normal h-auto w-full" onClick={() => onEncounterChoice(i)}>
                <span className="text-sm">{tr(c.text, lang)}</span>
              </Button>
            </TouchTooltip>
          ))}
        </div>
      </div>
    );
  }

  // Koan view
  if (state.awaitingChoice === 'koan' && koan) {
    const greeting = DESERT_GREETINGS[lang][state.day % DESERT_GREETINGS[lang].length]!;
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm italic opacity-70 px-2">
          {greeting}
        </motion.div>

        <Card className="p-6 border-primary/30 bg-card/80 backdrop-blur-sm relative">
          <div className="text-center mb-2 text-[10px] uppercase tracking-widest opacity-50">
            {koan.tone === 'poetic' ? (lang === 'ru' ? 'Поэтический коан' : 'Poetic koan') : (lang === 'ru' ? 'Мистический коан' : 'Mystic koan')}
          </div>
          <p className="text-lg font-serif text-center leading-relaxed pr-8">{tr(koan.question, lang)}</p>
          <div className="absolute top-3 right-3">
            <NarrateButton text={tr(koan.question, lang)} lang={lang} tooltip={tr({ ru: 'Озвучить вопрос', en: 'Narrate question' }, lang)} />
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          {koan.options.map((opt, i) => (
            <TouchTooltip key={i} content={tr(UI.tooltipAnswer, lang)} side="top">
              <Button variant="outline" className="justify-start text-left min-h-[48px] px-4 py-3 whitespace-normal h-auto w-full" onClick={() => onKoanAnswer(i)}>
                <span className="text-sm">{tr(opt.text, lang)}</span>
              </Button>
            </TouchTooltip>
          ))}
        </div>

        <div className="mt-2 text-center">
          <Button variant="ghost" size="sm" className="text-xs opacity-60" onClick={onNewGame}>
            <RotateCcw className="w-3 h-3 mr-1" />
            {tr(UI.newGame, lang)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-sm opacity-60">{tr(UI.journalEmpty, lang)}</p>
      <Button className="mt-4" onClick={onNewGame}>{tr(UI.newGame, lang)}</Button>
    </div>
  );
}

function FinaleView({ state, lang, onNewGame }: { state: NonNullable<ReturnType<typeof useGameStore>['state']>; lang: Lang; onNewGame: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 px-4 py-8 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5 }}>
        <div className="text-6xl mb-4">🌅</div>
        <h2 className="text-2xl font-serif font-semibold mb-4">{tr(UI.finaleTitle, lang)}</h2>
        <p className="text-sm italic opacity-80 leading-relaxed mb-6">{tr(UI.finaleBody, lang)}</p>
      </motion.div>

      <Card className="p-4 w-full border-primary/30">
        <div className="text-xs uppercase tracking-wide opacity-60 mb-2">{tr(UI.finaleStats, lang)}</div>
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-serif">{state.day - 1}</div>
            <div className="text-[10px] opacity-60">{tr(UI.day, lang)}</div>
          </div>
          <div>
            <div className="text-2xl font-serif">{state.distance}</div>
            <div className="text-[10px] opacity-60">{tr(UI.distance, lang)}</div>
          </div>
          <div>
            <div className="text-2xl font-serif">{state.insight}</div>
            <div className="text-[10px] opacity-60">{tr(UI.insight, lang)}</div>
          </div>
        </div>
      </Card>

      <Button size="lg" onClick={onNewGame} className="min-h-[48px] px-8">
        <RotateCcw className="w-4 h-4 mr-2" />
        {tr(UI.playAgain, lang)}
      </Button>
    </div>
  );
}

function EncounterIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    caravan: '🐪',
    mirage: '✨',
    well: '🪣',
    beast: '👁',
    dunes: '⛰',
    ruins: '🏛',
    stars: '✦',
    silence: '∅',
  };
  return <span className="text-2xl">{icons[type] ?? '·'}</span>;
}

function MapView({ state, lang }: { state: ReturnType<typeof useGameStore>['state']; lang: Lang }) {
  if (!state || state.path.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <p className="text-sm opacity-60">{tr(UI.mapEmpty, lang)}</p>
      </div>
    );
  }

  // Compute bounds
  const xs = state.path.map((p) => p.x);
  const ys = state.path.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = Math.max(maxX - minX, 100);
  const h = Math.max(maxY - minY, 100);
  const padding = 40;
  const svgW = 320, svgH = 320;

  const project = (x: number, y: number) => ({
    cx: padding + ((x - minX) / w) * (svgW - 2 * padding),
    cy: padding + ((y - minY) / h) * (svgH - 2 * padding),
  });

  const phaseColors: Record<string, string> = {
    day: 'oklch(0.55 0.14 55)',
    dusk: 'oklch(0.75 0.15 60)',
    night: 'oklch(0.70 0.12 250)',
    dawn: 'oklch(0.60 0.16 30)',
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-sm h-auto">
        {/* Background sand texture dots */}
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={Math.random() * svgW} cy={Math.random() * svgH} r="0.5" fill="currentColor" opacity="0.15" />
        ))}
        {/* Path line */}
        <polyline
          points={state.path.map((p) => { const { cx, cy } = project(p.x, p.y); return `${cx},${cy}`; }).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2,3"
          opacity="0.5"
        />
        {/* Path nodes */}
        {state.path.map((p, i) => {
          const { cx, cy } = project(p.x, p.y);
          const isLast = i === state.path.length - 1;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={isLast ? 6 : 3} fill={phaseColors[p.phase]} opacity={isLast ? 1 : 0.7} className={isLast ? 'star' : ''} />
              {isLast && (
                <circle cx={cx} cy={cy} r="10" fill="none" stroke={phaseColors[p.phase]} strokeWidth="1" opacity="0.4" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="text-xs opacity-60 text-center">
        <p>{tr(UI.tabMap, lang)}: {state.path.length} {lang === 'ru' ? 'узлов' : 'nodes'}</p>
        <p className="mt-1 italic">{tr(ENCOUNTER_NAMES[state.path[state.path.length - 1]!.encounter], lang)}</p>
      </div>
    </div>
  );
}

function JournalView({ state, lang }: { state: ReturnType<typeof useGameStore>['state']; lang: Lang }) {
  if (!state || state.journal.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <p className="text-sm opacity-60">{tr(UI.journalEmpty, lang)}</p>
      </div>
    );
  }
  return (
    <ScrollArea className="h-full journal-scroll">
      <div className="flex flex-col gap-3 pr-2 max-w-md mx-auto">
        {state.journal.map((entry) => (
          <Card key={entry.id} className="p-4 border-primary/15">
            <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-wide opacity-60">
              <span>{tr(UI.day, lang)} {entry.day}</span>
              <span>{tr(ENCOUNTER_NAMES[entry.encounter], lang)}</span>
            </div>
            <p className="text-sm font-serif italic mb-2">"{entry.koanQuestion}"</p>
            <p className="text-xs opacity-80 mb-1">
              <span className="opacity-60">{tr(UI.youAnswered, lang)} </span>
              {entry.answerText}
            </p>
            <p className="text-xs opacity-80 mb-2 italic">
              <span className="opacity-60 not-italic">{tr(UI.desertSpeaks, lang)} </span>
              {entry.desertResponse}
            </p>
            <p className="text-xs opacity-70 border-t border-border/40 pt-2 mt-2">{entry.encounterResult}</p>
            {entry.insightDelta !== 0 && (
              <p className={`text-[10px] mt-1 ${entry.insightDelta > 0 ? 'text-primary' : 'text-destructive'}`}>
                {entry.insightDelta > 0 ? '+' : ''}{entry.insightDelta} {tr(UI.insight, lang)}
              </p>
            )}
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function SettingsView({ settings, lang, onToggleSound, onToggleMusic, onToggleVoice, onToggleVibration, onSetVoiceGender, onSetLang, onButtonClick, onNewGame }: {
  settings: ReturnType<typeof useGameStore>['settings'];
  lang: Lang;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleVoice: () => void;
  onToggleVibration: () => void;
  onSetVoiceGender: (g: 'female' | 'male') => void;
  onSetLang: (l: Lang) => void;
  onButtonClick: () => void;
  onNewGame: () => void;
}) {
  return (
    <ScrollArea className="h-full journal-scroll">
      <div className="flex flex-col gap-3 pr-2 max-w-md mx-auto">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">{tr(UI.settingsTitle, lang)}</h3>

        {/* Language */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 opacity-70" />
              <span className="text-sm">{tr(UI.language, lang)}</span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant={lang === 'ru' ? 'default' : 'outline'} onClick={() => { onButtonClick(); onSetLang('ru'); }}>RU</Button>
              <Button size="sm" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => { onButtonClick(); onSetLang('en'); }}>EN</Button>
            </div>
          </div>
        </Card>

        {/* Sound */}
        <SettingRow icon={Volume2} iconOff={VolumeX} label={tr(UI.sound, lang)} tooltip={tr(UI.tooltipSound, lang)} enabled={settings.soundEnabled} onToggle={onToggleSound} onClick={onButtonClick} />
        <SettingRow icon={Music2} iconOff={Music} label={tr(UI.music, lang)} tooltip={tr(UI.tooltipMusic, lang)} enabled={settings.musicEnabled} onToggle={onToggleMusic} onClick={onButtonClick} />
        <SettingRow icon={Volume2} iconOff={VolumeX} label={tr(UI.voice, lang)} tooltip={tr(UI.tooltipVoice, lang)} enabled={settings.voiceEnabled} onToggle={onToggleVoice} onClick={onButtonClick} />
        <SettingRow icon={Vibrate} iconOff={Vibrate} label={tr(UI.vibration, lang)} tooltip={tr(UI.tooltipVibration, lang)} enabled={settings.vibrationEnabled} onToggle={onToggleVibration} onClick={onButtonClick} />

        {/* Voice gender */}
        {settings.voiceEnabled && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 opacity-70" />
                <span className="text-sm">{tr(UI.voiceGender, lang)}</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant={settings.voiceGender === 'female' ? 'default' : 'outline'} onClick={() => { onButtonClick(); onSetVoiceGender('female'); }}>
                  {tr(UI.voiceFemale, lang)}
                </Button>
                <Button size="sm" variant={settings.voiceGender === 'male' ? 'default' : 'outline'} onClick={() => { onButtonClick(); onSetVoiceGender('male'); }}>
                  {tr(UI.voiceMale, lang)}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* New game */}
        <Card className="p-4 border-destructive/30">
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { onButtonClick(); onNewGame(); }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {tr(UI.newGame, lang)}
          </Button>
        </Card>
      </div>
    </ScrollArea>
  );
}

function NarrateButton({ text, lang, tooltip }: { text: string; lang: Lang; tooltip: string }) {
  const settings = useGameStore((s) => s.settings);
  const [playing, setPlaying] = useState(false);

  const handleNarrate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!settings.voiceEnabled) return;
    const audio = getAudioEngine();
    audio.resume();
    audio.click();
    getHaptics().click();
    // Stop any current narration, then speak this text
    getTTS().stop();
    setPlaying(true);
    getTTS().speak(text, lang, settings.voiceGender, () => {
      setPlaying(false);
    });
  };

  if (!settings.voiceEnabled) return null;

  return (
    <TouchTooltip content={tooltip} side="left">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleNarrate}
        aria-label={tooltip}
      >
        <Volume2 className={`w-4 h-4 ${playing ? 'animate-pulse text-primary' : 'opacity-70'}`} />
      </Button>
    </TouchTooltip>
  );
}

function SettingRow({ icon: Icon, iconOff: IconOff, label, tooltip, enabled, onToggle, onClick }: {
  icon: any;
  iconOff: any;
  label: string;
  tooltip: string;
  enabled: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <TouchTooltip content={tooltip} side="top">
          <div className="flex items-center gap-3 cursor-help">
            <Icon className={`w-4 h-4 ${enabled ? 'opacity-70' : 'opacity-30'}`} />
            <span className="text-sm">{label}</span>
          </div>
        </TouchTooltip>
        <Switch checked={enabled} onClick={onClick} onCheckedChange={onToggle} />
      </div>
    </Card>
  );
}
