import { useEffect, useRef, useState } from 'react';
import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';

export function PlayerSettings({ sound, guide, about }: { sound: GameSoundControls; guide: WorldGuideControls; about: () => void }) {
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const update = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', update);
    return () => { active.current = false; document.removeEventListener('fullscreenchange', update); };
  }, []);
  const toggleFullscreen = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      if (active.current) { setFullscreen(!!document.fullscreenElement); setMessage('Display updated. Landscape is recommended on phones.'); }
    } catch {
      if (active.current) setMessage('Fullscreen is unavailable or was declined. Windowed landscape play still works.');
    } finally { if (active.current) setBusy(false); }
  };
  return <div className="player-settings">
    <section aria-label="Sound and feedback settings"><h3>Sound &amp; feedback</h3>
      <button type="button" aria-pressed={!sound.settings.muted} onClick={sound.toggle}>{sound.settings.muted ? 'Enable sound' : 'Mute sound'}</button>
      <label>Volume<input type="range" min="0" max="1" step="0.05" value={sound.settings.volume} onChange={event => sound.volume(Number(event.currentTarget.value))} /></label>
      <label className="settings-check"><input type="checkbox" checked={sound.settings.haptics} disabled={!sound.hapticsAvailable} onChange={event => sound.haptics(event.currentTarget.checked)} />Optional vibration</label>
      {!sound.hapticsAvailable && <small>Vibration is unavailable on this browser.</small>}
      <p role="status">{sound.message}</p>
    </section>
    <section aria-label="World guide settings"><h3>World guide</h3>
      <label className="settings-check"><input type="checkbox" checked={guide.visible} onChange={event => event.currentTarget.checked ? guide.replay() : guide.skip()} />Show gameplay tips</label>
      {guide.message && <p role="status">{guide.message}</p>}
    </section>
    <section aria-label="Display settings"><h3>Display</h3>
      <button type="button" disabled={busy || (!fullscreen && !document.fullscreenEnabled)} onClick={() => void toggleFullscreen()}>{fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</button>
      <p>Phone play uses landscape. Rotate manually if your browser cannot lock orientation.</p>
      {!document.fullscreenEnabled && <small>Fullscreen is not supported here. All gameplay works in the browser window.</small>}
      {message && <p role="status">{message}</p>}
    </section>
    <button type="button" onClick={about}>About / Credits</button>
  </div>;
}
