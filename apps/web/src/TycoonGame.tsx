import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createController, type View } from './controller';
import { diagnosticsEnabled } from './mode';
import { GameFloor } from './GameFloor';
import { LearnDialog, type LearnPage } from './LearnDialog';
import { GameHUD } from './GameHUD';
import { GameResult } from './GameResult';
import { TitleWorld } from './TitleWorld';
import { useGameSound } from './useGameSound';
import { useWorldGuide } from './useWorldGuide';
import { WorldGuide } from './WorldGuide';
import { PauseMenu } from './PauseMenu';
import { SettingsPanel } from './SettingsPanel';
import { guideHint } from './world-guide';
import { blackFridayChallenge, type Challenge } from '@stack-and-survive/scenarios/challenge';
import type { Architecture } from '@stack-and-survive/schema';
import type { RunReport } from './run-report';
import { createPlayerNavigation } from './player-navigation';
import { createLandscapeClock, enhanceLandscape, requiresLandscape } from './landscape-session';
import { v3 } from './art-v3';
import './player-console.css';
import { MissionBrief } from './MissionBrief';
import { missionBrief } from './mission-brief';
import './onboarding.css';

export function TycoonGame({ challenge = blackFridayChallenge, titleContent, onResult, nextLevel, resultContent, leaderboardContent, runReport }: {
  challenge?: Challenge; titleContent?: ReactNode; onResult?: (result: NonNullable<View['result']>, finalArchitecture: Architecture) => void; nextLevel?: () => void; resultContent?: ReactNode; leaderboardContent?: ReactNode;
  runReport?: { result: NonNullable<View['result']>; data: RunReport } | null;
}) {
  const [clock] = useState(createLandscapeClock);
  const [controller] = useState(() => createController(clock, undefined, true, challenge));
  const [navigation] = useState(createPlayerNavigation);
  const [portrait, setPortrait] = useState(() => requiresLandscape(innerWidth, innerHeight));
  const [orientationGate, setOrientationGate] = useState(false);
  const [enhancementMessage, setEnhancementMessage] = useState<string | null>(null);
  const [worldReady, setWorldReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ready = useCallback(() => setWorldReady(true), []);
  const opened = useRef(false);
  const interruptedRunning = useRef(false);
  const gateOpen = useRef(false);
  const enhancementGeneration = useRef(0);
  const gateRef = useRef<HTMLElement>(null);
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const sound = useGameSound(controller);
  const guide = useWorldGuide();
  const [entered, setEntered] = useState(false);
  const [titleSettings, setTitleSettings] = useState(false);
  const [pauseMenuVisible, setPauseMenuVisible] = useState(false);
  const pauseOpen = useRef(false);
  const restorePause = useRef(false);
  const helpFromPause = useRef(false);
  useEffect(() => {
    const update = () => {
      const unsuitable = requiresLandscape(innerWidth, innerHeight);
      setPortrait(unsuitable);
      if (unsuitable && opened.current && !controller.getSnapshot().result) {
        if (!gateOpen.current) restorePause.current = pauseOpen.current || helpFromPause.current;
        pauseOpen.current = false; setPauseMenuVisible(false); helpFromPause.current = false; dialog.current?.close();
        if (!gateOpen.current) interruptedRunning.current = controller.getSnapshot().state.runtime.status === 'RUNNING';
        gateOpen.current = true; clock.hold(true); controller.pause(); setOrientationGate(true);
      }
    };
    const visibility = () => {
      setHidden(document.hidden);
      clock.hold(gateOpen.current || (document.hidden && controller.getSnapshot().state.runtime.status === 'PREPARATION'));
    };
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    const keydown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || pauseOpen.current || (e.target instanceof Element && e.target.closest('input,textarea,select,[contenteditable="true"],.resource-action-card,.title-settings-panel'))) return;
      if (e.key === 'Escape' && opened.current && !dialog.current?.open && !gateOpen.current && !controller.getSnapshot().error) {
        e.preventDefault();
        const snap = controller.getSnapshot();
        if (snap.state.runtime.status === 'RUNNING' || snap.state.runtime.status === 'PAUSED') { controller.pause(); pauseOpen.current = true; setPauseMenuVisible(true); }
      }
    };
    window.addEventListener('resize', update); document.addEventListener('visibilitychange', visibility); motion.addEventListener('change', updateMotion); window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('resize', update); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', updateMotion); window.removeEventListener('keydown', keydown); };
  }, [clock, controller]);
  useEffect(() => {
    if (!entered || !worldReady || !opening || portrait || orientationGate || hidden || view.error) return;
    navigation.fit();
    const from = navigation.getSnapshot().state;
    const target = { centerX: 1210, centerY: 620, userZoom: 1.45 };
    let cancelled = false, frame = 0;
    const finish = () => { if (cancelled) return; navigation.setPresentation(target); setOpening(false); controller.beginGame(); };
    if (reducedMotion) { finish(); return; }
    const started = performance.now();
    const animate = (now: number) => {
      if (cancelled || requiresLandscape(innerWidth, innerHeight) || document.hidden) return;
      const progress = Math.max(0, Math.min(1, (now - started - 750) / 1050));
      const eased = progress * progress * (3 - 2 * progress);
      navigation.setPresentation({ centerX: from.centerX + (target.centerX - from.centerX) * eased, centerY: from.centerY + (target.centerY - from.centerY) * eased, userZoom: from.userZoom + (target.userZoom - from.userZoom) * eased });
      if (progress === 1) finish(); else frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [entered, worldReady, opening, portrait, orientationGate, hidden, reducedMotion, view.error, navigation, controller]);
  const [page, setPage] = useState<LearnPage>('how');
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const learnButton = useRef<HTMLButtonElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const titlePanel = useRef<HTMLDivElement>(null);
  const rebuildButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (titleSettings) titlePanel.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [titleSettings]);
  useEffect(() => {
    if (view.error || view.result) { pauseOpen.current = false; helpFromPause.current = false; restorePause.current = false; setPauseMenuVisible(false); dialog.current?.close(); }
    if (view.error) rebuildButton.current?.focus();
  }, [view.error, view.result]);
  useEffect(() => { if (!entered) startButton.current?.focus(); else learnButton.current?.focus(); }, [entered]);
  useEffect(() => () => { enhancementGeneration.current++; controller.destroy(); }, [controller]);
  useEffect(() => { if (orientationGate) gateRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [orientationGate, portrait]);
  const open = (next: typeof page) => { dialogOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setPage(next); dialog.current?.showModal(); };
  const runtime = view.state.runtime;
  const currentChallenge = view.challenge ?? blackFridayChallenge;
  const brief = missionBrief(currentChallenge.workload);
  const enhance = () => {
    const generation = ++enhancementGeneration.current;
    if (matchMedia('(pointer: coarse)').matches) void enhanceLandscape(document.documentElement).then(message => {
      if (generation === enhancementGeneration.current) setEnhancementMessage(message);
    });
  };
  const start = (enhanceDisplay = true) => {
    if (opened.current) return;
    if (enhanceDisplay) enhance();
    if (requiresLandscape(innerWidth, innerHeight)) { gateOpen.current = true; setOrientationGate(true); return; }
    guide.newAttempt(); sound.unlock(); clock.hold(false); navigation.fit(); opened.current = true;
    gateOpen.current = false; setOrientationGate(false); setWorldReady(false); setOpening(true); setEntered(true);
  };
  const continueLandscape = () => {
    enhance();
    if (requiresLandscape(innerWidth, innerHeight)) return;
    gateOpen.current = false; setOrientationGate(false); clock.hold(false);
    if (!entered) start(false); else if (!opening && interruptedRunning.current && controller.getSnapshot().state.runtime.status === 'PAUSED') controller.resume();
    else if (restorePause.current && !controller.getSnapshot().error) { pauseOpen.current = true; setPauseMenuVisible(true); }
    restorePause.current = false;
    interruptedRunning.current = false;
  };
  const hidePause = () => { pauseOpen.current = false; setPauseMenuVisible(false); pauseButton.current?.focus({preventScroll:true}); };
  const restart = () => { pauseOpen.current = false; restorePause.current = false; helpFromPause.current = false; setPauseMenuVisible(false); setTitleSettings(false); enhancementGeneration.current++; setEnhancementMessage(null); opened.current = false; gateOpen.current = false; interruptedRunning.current = false; clock.hold(false); controller.reset(); navigation.fit(); setOpening(false); setWorldReady(false); setOrientationGate(false); setEntered(false); };
  const reportedResult = useRef<View['result']>(null);
  useEffect(() => {
    if (view.result && reportedResult.current !== view.result) { reportedResult.current = view.result; onResult?.(view.result, view.state.runtime.architecture); }
    if (!view.result) reportedResult.current = null;
  }, [view.result, view.state.runtime.architecture, onResult]);
  return <main className={`tycoon-game${entered ? ' diorama-game' : ''}${v3 ? ' hero-art-review' : ''}`} onClick={event => { if (event.target instanceof Element && event.target.closest('button')) sound.click(); }}>
    {!entered ? <section className="title-screen" inert={orientationGate} aria-label="Game introduction" data-time={diagnosticsEnabled ? runtime.time : undefined} data-budget={diagnosticsEnabled ? view.state.economy.remainingBudget : undefined}>
      <TitleWorld />
      <div className="title-heading"><p className="title-eyebrow">A REAL-TIME CLOUD INFRASTRUCTURE GAME</p>
        <h1><span className="title-stack">STACK</span> <em>&amp;</em> SURVIVE</h1><p className="title-tagline">Build. Scale. Keep the business flowing.</p>
        <p className="title-description">Your customers are arriving. Make every infrastructure decision count.</p>
      </div>
      <MissionBrief scenario={currentChallenge.workload} />
      <div className="title-bottom">{titleContent}<nav className="title-actions" aria-label="Introduction">
        <button type="button" aria-label="How to Play" onClick={() => open('how')}>How to Play<small>Learn the basics</small></button>
        <button ref={startButton} type="button" aria-label="Start Game" className="start-game" onClick={() => start()}>▶ Start Game<small>One business. {currentChallenge.workload.duration === 180 ? 'Three minutes.' : `${currentChallenge.workload.duration} seconds.`}</small></button>
        <button type="button" aria-label="About" onClick={() => open('about')}>About<small>The idea &amp; the technology</small></button>
      </nav><button ref={settingsButton} type="button" className="title-settings-btn" aria-label="Settings" aria-expanded={titleSettings} onClick={() => setTitleSettings(!titleSettings)}>&#9881; Settings</button>
      {titleSettings && <div ref={titlePanel} className="title-settings-panel" role="region" aria-label="Player settings" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setTitleSettings(false);settingsButton.current?.focus();}}}><SettingsPanel sound={sound} guide={guide} /><button type="button" onClick={()=>{setTitleSettings(false);settingsButton.current?.focus();}}>Close settings</button></div>}
      <p className="title-footnote">SAME WORKLOAD. DIFFERENT ARCHITECTURES. DIFFERENT OUTCOMES.</p></div>
    </section> : <>
      <div className="game-command-hud">
        <header className="tycoon-header" inert={!!view.result || opening || orientationGate}><h1>STACK <em>&amp;</em> SURVIVE</h1><nav aria-label="Game controls"><button ref={learnButton} type="button" onClick={() => open('learn')}>ⓘ Learn</button><button ref={pauseButton} type="button" disabled={runtime.status !== 'RUNNING' && runtime.status !== 'PAUSED'} onClick={() => { if (runtime.status === 'PAUSED') { controller.resume(); hidePause(); } else { controller.pause(); pauseOpen.current=true; setPauseMenuVisible(true); } }}>{runtime.status === 'PAUSED' ? '▶ Resume' : 'Ⅱ Pause'}</button></nav></header>
        <GameHUD view={view} />
      </div>
      {pauseMenuVisible && runtime.status === 'PAUSED' && !view.result && !view.error && !orientationGate && <PauseMenu sound={sound} guide={guide} onResume={() => { hidePause(); if(!gateOpen.current&&!controller.getSnapshot().error)controller.resume(); }} onInspect={hidePause} onHowToPlay={() => { helpFromPause.current=true; hidePause(); open('how'); }} onReturnToTitle={restart} />}
      <WorldGuide view={view} guide={guide} returnFocus={() => learnButton.current?.focus()} />
      <GameFloor controller={controller} view={view} navigation={navigation} onReady={ready} blocked={opening || orientationGate} guideTarget={guide.visible ? guideHint(view, guide.stage).target : null} />
      {opening && !orientationGate && <div className="opening-caption" role="status" data-testid="opening-reveal"><small>{brief.name}</small><strong>Protect customers for {brief.duration} seconds.</strong><span>Build App · Cache · Edge before waves arrive.</span></div>}
      {view.countdown !== null && <div className="welcome-countdown" role="status"><span className="countdown-name">{brief.name} opens in</span><strong>{view.countdown}</strong><span className="countdown-forecast">Starting: {brief.opening} req/s<br />Final: {brief.final} req/s · {brief.bots}% bots</span></div>}
      {view.notice && diagnosticsEnabled && <p className="tycoon-notice">{view.notice}</p>}
      {view.result && <GameResult result={view.result} architecture={runtime.architecture} report={runReport?.result === view.result ? runReport.data : null} restart={restart} review={() => open('learn')} nextLevel={view.result.objectiveMet ? nextLevel : undefined} records={resultContent} leaderboard={leaderboardContent} />}
      {view.error && <section role="alert" className="tycoon-result"><p>{view.error}</p><button ref={rebuildButton} type="button" onClick={() => controller.recoverRenderer()}>Rebuild graphics</button><button type="button" onClick={restart}>Return to title</button></section>}
      {diagnosticsEnabled && <details className="tycoon-qa"><summary>Tycoon QA</summary><button onClick={() => controller.inspectNextTick()}>Step one tick</button><output data-testid="elapsed">{runtime.time}</output><pre data-testid="diagnostics">{JSON.stringify(view)}</pre></details>}
    </>}
    {orientationGate && <section ref={gateRef} className="landscape-gate" role="dialog" aria-modal="true" aria-label="Landscape play required" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); restart(); return; }
      if (event.key !== 'Tab') return;
      const buttons = event.currentTarget.querySelectorAll('button');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}><div><span className="rotate-device" aria-hidden="true">↻</span><h2>{portrait ? 'Rotate your device' : 'Ready for landscape play'}</h2><p>Designed for landscape play. One data center, one fixed geography.</p><p>{entered ? 'Your operation is held. Continue when you are ready.' : 'The operation has not started. No budget or time has been spent.'}</p>{enhancementMessage && <p role="status">{enhancementMessage}</p>}<button type="button" onClick={continueLandscape}>{portrait ? 'Try landscape / fullscreen' : 'Continue in landscape'}</button><button type="button" onClick={restart}>Return to title</button></div></section>}
    <LearnDialog guide={guide} sound={sound} dialogRef={dialog} page={page} view={view} restart={restart} onClose={() => { if(gateOpen.current)gateRef.current?.querySelector<HTMLButtonElement>('button')?.focus();else if(controller.getSnapshot().error)rebuildButton.current?.focus();else if(helpFromPause.current){helpFromPause.current=false;pauseOpen.current=true;setPauseMenuVisible(true);}else if (dialogOpener.current?.isConnected) dialogOpener.current.focus(); else startButton.current?.focus(); }} />
  </main>;
}
