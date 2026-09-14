import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
import { guideHint } from './world-guide';
import { blackFridayChallenge, type Challenge } from '@stack-and-survive/scenarios/challenge';
import type { Architecture } from '@stack-and-survive/schema';
import type { RunReport } from './run-report';
import './player-console.css';

export function TycoonGame({ challenge = blackFridayChallenge, titleContent, onResult, nextLevel, resultContent, runReport }: {
  challenge?: Challenge; titleContent?: ReactNode; onResult?: (result: NonNullable<View['result']>, finalArchitecture: Architecture) => void; nextLevel?: () => void; resultContent?: ReactNode;
  runReport?: { result: NonNullable<View['result']>; data: RunReport } | null;
}) {
  const [controller] = useState(() => createController(undefined, undefined, true, challenge));
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const sound = useGameSound(controller);
  const guide = useWorldGuide();
  const [entered, setEntered] = useState(false);
  const [page, setPage] = useState<LearnPage>('how');
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const learnButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!entered) startButton.current?.focus(); else learnButton.current?.focus(); }, [entered]);
  useEffect(() => () => controller.destroy(), [controller]);
  const open = (next: typeof page) => { dialogOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setPage(next); dialog.current?.showModal(); };
  const runtime = view.state.runtime;
  const currentChallenge = view.challenge ?? blackFridayChallenge;
  const scenarioName = currentChallenge.workload.id === 'black-friday' ? 'Black Friday' : currentChallenge.workload.id;
  const start = () => { guide.newAttempt(); sound.unlock(); setEntered(true); controller.beginGame(); };
  const restart = () => { controller.reset(); setEntered(false); };
  const reportedResult = useRef<View['result']>(null);
  useEffect(() => {
    if (view.result && reportedResult.current !== view.result) { reportedResult.current = view.result; onResult?.(view.result, view.state.runtime.architecture); }
    if (!view.result) reportedResult.current = null;
  }, [view.result, view.state.runtime.architecture, onResult]);
  return <main className={`tycoon-game${entered ? ' diorama-game' : ''}`} onClick={event => { if (event.target instanceof Element && event.target.closest('button')) sound.click(); }}>
    {!entered ? <section className="title-screen" aria-label="Game introduction" data-time={diagnosticsEnabled ? runtime.time : undefined} data-budget={diagnosticsEnabled ? view.state.economy.remainingBudget : undefined}>
      <TitleWorld />
      <div className="title-heading"><p className="title-eyebrow">A REAL-TIME CLOUD INFRASTRUCTURE GAME</p>
        <h1><span className="title-stack">STACK</span> <em>&amp;</em> SURVIVE</h1><p className="title-tagline">Build. Scale. Keep the business flowing.</p>
        <p className="title-description">Your customers are arriving. Make every infrastructure decision count.</p>
      </div>
      <div className="title-bottom">{titleContent}<nav className="title-actions" aria-label="Introduction">
        <button type="button" aria-label="How to Play" onClick={() => open('how')}>How to Play<small>Learn the basics</small></button>
        <button ref={startButton} type="button" aria-label="Start Game" className="start-game" onClick={start}>▶ Start Game<small>One business. {currentChallenge.workload.duration === 180 ? 'Three minutes.' : `${currentChallenge.workload.duration} seconds.`}</small></button>
        <button type="button" aria-label="About" onClick={() => open('about')}>About<small>The idea &amp; the technology</small></button>
      </nav><p className="title-footnote">SAME WORKLOAD. DIFFERENT ARCHITECTURES. DIFFERENT OUTCOMES.</p></div>
    </section> : <>
      <header className="tycoon-header"><h1>STACK <em>&amp;</em> SURVIVE</h1><nav aria-label="Game controls"><button ref={learnButton} type="button" onClick={() => open('learn')}>ⓘ Learn</button><button type="button" disabled={runtime.status !== 'RUNNING' && runtime.status !== 'PAUSED'} onClick={() => runtime.status === 'PAUSED' ? controller.resume() : controller.pause()}>{runtime.status === 'PAUSED' ? '▶ Resume' : 'Ⅱ Pause'}</button></nav></header>
      <GameHUD view={view} />
      <WorldGuide view={view} guide={guide} returnFocus={() => learnButton.current?.focus()} />
      <GameFloor controller={controller} view={view} guideTarget={guide.visible ? guideHint(view, guide.stage).target : null} />
      {view.countdown !== null && <div className="welcome-countdown" role="status">{scenarioName} begins in <strong>{view.countdown}</strong></div>}
      {view.notice && diagnosticsEnabled && <p className="tycoon-notice">{view.notice}</p>}
      {view.result && <GameResult result={view.result} architecture={runtime.architecture} report={runReport?.result === view.result ? runReport.data : null} restart={restart} review={() => open('learn')} nextLevel={view.result.objectiveMet ? nextLevel : undefined} records={resultContent} />}
      {view.error && <section role="alert" className="tycoon-result"><p>{view.error}</p><button type="button" onClick={() => controller.recoverRenderer()}>Rebuild graphics</button><button type="button" onClick={restart}>Return to title</button></section>}
      {diagnosticsEnabled && <details className="tycoon-qa"><summary>Tycoon QA</summary><button onClick={() => controller.inspectNextTick()}>Step one tick</button><output data-testid="elapsed">{runtime.time}</output><pre data-testid="diagnostics">{JSON.stringify(view)}</pre></details>}
    </>}
    <LearnDialog guide={guide} sound={sound} dialogRef={dialog} page={page} view={view} restart={restart} onClose={() => { if (dialogOpener.current?.isConnected) dialogOpener.current.focus(); else startButton.current?.focus(); }} />
  </main>;
}
