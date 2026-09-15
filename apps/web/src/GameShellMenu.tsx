import { useEffect, useRef, useState } from 'react';
import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';
import { PlayerSettings } from './PlayerSettings';
import './game-shell-menu.css';

export type ShellPage = 'pause' | 'settings';
export function GameShellMenu({ page, paused, close, resume, restart, help, sound, guide }: {
  page: ShellPage; paused: boolean; close: () => void; resume: () => void; restart: () => void;
  help: (page: 'how' | 'about') => void; sound: GameSoundControls; guide: WorldGuideControls;
}) {
  const [current, setCurrent] = useState(page);
  const dialog = useRef<HTMLDialogElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const exit = (action: () => void) => { dialog.current?.close(); action(); };
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => { primary.current?.focus({ preventScroll: true }); }, [current]);
  return <dialog ref={dialog} className="game-shell-menu" aria-labelledby="shell-title" onCancel={event => {
    event.preventDefault();
    if (current === 'settings' && paused) setCurrent('pause');
    else if (current === 'pause') exit(resume);
    else exit(close);
  }}>
    <p className="shell-eyebrow">STACK &amp; SURVIVE</p>
    <h2 id="shell-title">{current === 'pause' ? 'Paused' : 'Settings'}</h2>
    {current === 'pause' ? <>
      <p className="shell-note">Your operation is stopped. Take your time.</p>
      <div className="shell-actions">
        <button ref={primary} className="shell-primary" type="button" aria-label="▶ Resume" onClick={() => exit(resume)}>Resume operation →</button>
        <button type="button" onClick={() => setCurrent('settings')}>Settings</button>
        <button type="button" onClick={() => exit(() => help('how'))}>How to Play</button>
        <button type="button" onClick={() => exit(close)}>Inspect paused world</button>
        <button type="button" onClick={() => exit(restart)}>Return to Title</button>
      </div>
    </> : <>
      <button ref={primary} className="shell-back" type="button" onClick={() => paused ? setCurrent('pause') : exit(close)}>{paused ? 'Back to pause menu' : 'Close settings'}</button>
      <PlayerSettings sound={sound} guide={guide} about={() => exit(() => help('about'))} />
    </>}
  </dialog>;
}
