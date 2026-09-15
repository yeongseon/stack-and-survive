import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';
import { enhanceLandscape } from './landscape-session';

export function SettingsPanel({ sound, guide }: { sound: GameSoundControls; guide: WorldGuideControls }) {
  const tryFullscreen = () => void enhanceLandscape(document.documentElement);
  const isFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;
  const exitFullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); };
  return <div className="settings-panel">
    <section aria-label="Sound and feedback settings">
      <h3>Sound &amp; feedback</h3>
      <button type="button" aria-pressed={!sound.settings.muted} onClick={sound.toggle}>{sound.settings.muted ? '🔇 Enable sound' : '🔊 Mute sound'}</button>
      <label className="settings-range">Volume<input type="range" min="0" max="1" step="0.05" value={sound.settings.volume} onChange={e => sound.volume(Number(e.currentTarget.value))} /></label>
      <label className="settings-checkbox"><input type="checkbox" checked={sound.settings.haptics} disabled={!sound.hapticsAvailable} onChange={e => sound.haptics(e.currentTarget.checked)} />Vibration{!sound.hapticsAvailable ? ' (unavailable)' : ''}</label>
    </section>
    <section aria-label="World guide">
      <h3>World guide</h3>
      <button type="button" onClick={guide.replay}>Replay guide</button>
      {guide.visible && <button type="button" onClick={guide.skip}>Skip guide</button>}
    </section>
    <section aria-label="Display">
      <h3>Display</h3>
      <button type="button" onClick={isFullscreen ? exitFullscreen : tryFullscreen}>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
    </section>
  </div>;
}
