import { useEffect, useRef, useState } from 'react';
import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';
import { SettingsPanel } from './SettingsPanel';

export function PauseMenu({ onResume, onHowToPlay, onReturnToTitle, onInspect, sound, guide }: {
  onResume: () => void; onHowToPlay: () => void; onReturnToTitle: () => void; onInspect: () => void;
  sound: GameSoundControls; guide: WorldGuideControls;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => { const element = modal.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => { primary.current?.focus({ preventScroll: true }); }, [showSettings]);
  const exit = (action: () => void) => { modal.current?.close(); action(); };
  return <dialog ref={modal} className="pause-overlay" aria-label="Game paused" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')].filter(element => element.checkVisibility());
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onCancel={e => {
    e.preventDefault(); if (showSettings) setShowSettings(false); else exit(onResume);
  }}>
    <div className="pause-menu">
      {showSettings ? <>
        <h2>Settings</h2>
        <SettingsPanel sound={sound} guide={guide} />
        <button ref={primary} type="button" className="pause-menu-item" onClick={() => setShowSettings(false)}>Back</button>
      </> : <>
        <h2>PAUSED</h2>
        <button ref={primary} type="button" className="pause-menu-item pause-resume" aria-label="▶ Resume" onClick={() => exit(onResume)}>Resume</button>
        <button type="button" className="pause-menu-item" onClick={() => setShowSettings(true)}>Settings</button>
        <button type="button" className="pause-menu-item" onClick={() => exit(onHowToPlay)}>How to Play</button>
        <button type="button" className="pause-menu-item" onClick={() => exit(onInspect)}>Inspect paused world</button>
        <button type="button" className="pause-menu-item pause-danger" onClick={() => exit(onReturnToTitle)}>Return to Title</button>
      </>}
    </div>
  </dialog>;
}
