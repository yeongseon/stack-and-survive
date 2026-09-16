import { useEffect, useRef, useState } from 'react';
import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';
import { enhanceLandscape } from './landscape-session';

export function SettingsPanel({ sound, guide }: { sound: GameSoundControls; guide: WorldGuideControls }) {
  const [isFullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const changed = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', changed);
    return () => { active.current = false; document.removeEventListener('fullscreenchange', changed); };
  }, []);
  const toggleFullscreen = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const notice = document.fullscreenElement ? (await document.exitFullscreen(), null) : await enhanceLandscape(document.documentElement);
      if (active.current) { setFullscreen(!!document.fullscreenElement); setMessage(notice ?? 'Display updated. Landscape play remains available.'); }
    } catch { if (active.current) setMessage('Fullscreen was declined. Windowed landscape play still works.'); }
    finally { if (active.current) setBusy(false); }
  };
  return <div className="settings-panel">
    <section aria-label="Sound and feedback settings">
      <h3>Sound &amp; feedback</h3>
      <button type="button" aria-pressed={!sound.settings.muted} onClick={sound.toggle}>{sound.settings.muted ? '🔇 Enable sound' : '🔊 Mute sound'}</button>
      <label className="settings-range">Volume<input type="range" min="0" max="1" step="0.05" value={sound.settings.volume} onChange={e => sound.volume(Number(e.currentTarget.value))} /></label>
      <label className="settings-checkbox"><input type="checkbox" checked={sound.settings.haptics} disabled={!sound.hapticsAvailable} onChange={e => sound.haptics(e.currentTarget.checked)} />Vibration{!sound.hapticsAvailable ? ' (unavailable)' : ''}</label>
      <p role="status">{sound.message}</p>
    </section>
    <section aria-label="World guide">
      <h3>World guide</h3>
      <button type="button" onClick={guide.replay}>Replay guide</button>
      {guide.visible && <button type="button" onClick={guide.skip}>Skip guide</button>}
      {guide.message && <p role="status">{guide.message}</p>}
    </section>
    <section aria-label="Display">
      <h3>Display</h3>
      <button type="button" disabled={busy || (!isFullscreen && !document.fullscreenEnabled)} onClick={() => void toggleFullscreen()}>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
      <p>Phone play uses landscape. Rotate manually if automatic orientation is unavailable.</p>
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
