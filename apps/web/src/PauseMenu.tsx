import { useState } from 'react';
import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';
import { SettingsPanel } from './SettingsPanel';

export function PauseMenu({ onResume, onHowToPlay, onReturnToTitle, sound, guide }: {
  onResume: () => void; onHowToPlay: () => void; onReturnToTitle: () => void;
  sound: GameSoundControls; guide: WorldGuideControls;
}) {
  const [showSettings, setShowSettings] = useState(false);
  return <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Game paused" onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); if (showSettings) setShowSettings(false); else onResume(); }
  }}>
    <div className="pause-menu">
      {showSettings ? <>
        <h2>Settings</h2>
        <SettingsPanel sound={sound} guide={guide} />
        <button type="button" className="pause-menu-item" autoFocus onClick={() => setShowSettings(false)}>Back</button>
      </> : <>
        <h2>PAUSED</h2>
        <button type="button" className="pause-menu-item pause-resume" autoFocus onClick={onResume}>Resume</button>
        <button type="button" className="pause-menu-item" onClick={() => setShowSettings(true)}>Settings</button>
        <button type="button" className="pause-menu-item" onClick={onHowToPlay}>How to Play</button>
        <button type="button" className="pause-menu-item pause-danger" onClick={onReturnToTitle}>Return to Title</button>
      </>}
    </div>
  </div>;
}
