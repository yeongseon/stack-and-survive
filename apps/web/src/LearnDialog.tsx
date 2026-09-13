import type { RefObject } from 'react';
import type { View } from './controller';
import { primaryPressure } from './primary-pressure';
import { MissionPanel } from './MissionPanel';
import { glossary } from './help';
import type { GameSoundControls } from './useGameSound';
import type { WorldGuideControls } from './useWorldGuide';

export type LearnPage = 'how' | 'about' | 'learn';
export function LearnDialog({ dialogRef, page, view, onClose, restart, sound, guide }: {
  dialogRef: RefObject<HTMLDialogElement | null>; page: LearnPage; view: View; onClose: () => void; restart: () => void;
  sound: GameSoundControls;
  guide: WorldGuideControls;
}) {
  const r = view.snapshot?.requests;
  const pressure = primaryPressure(view);
  return <dialog ref={dialogRef} className="learn-dialog" aria-labelledby="learn-title" onClose={onClose}>
    <form method="dialog"><button autoFocus>Close</button></form>
    <h2 id="learn-title">{page === 'how' ? 'How to Play' : page === 'about' ? 'About Stack & Survive' : 'Learn'}</h2>
    <section aria-label="World guide settings"><h3>World guide</h3><p>A short, optional guide follows your actual traffic. It does not pause the operation or choose actions for you.</p>
      <button type="button" onClick={guide.replay}>Replay world guide</button>{guide.visible && <button type="button" onClick={guide.skip}>Skip world guide</button>}
      {guide.message && <p role="status">{guide.message}</p>}
    </section>
    <section className="sound-settings" aria-label="Sound and feedback settings">
      <h3>Sound &amp; feedback</h3>
      <button type="button" aria-pressed={!sound.settings.muted} onClick={sound.toggle}>{sound.settings.muted ? 'Enable sound' : 'Mute sound'}</button>
      <label>Volume<input type="range" min="0" max="1" step="0.05" value={sound.settings.volume} onChange={e => sound.volume(Number(e.currentTarget.value))} /></label>
      <label><input type="checkbox" checked={sound.settings.haptics} disabled={!sound.hapticsAvailable} onChange={e => sound.haptics(e.currentTarget.checked)} />Optional vibration{!sound.hapticsAvailable ? ' (unavailable on this browser)' : ''}</label>
      <p role="status">{sound.message}</p><small>All gameplay information remains visible when sound is muted.</small>
    </section>
    {page === 'learn' && <section aria-label="Resource capacities"><h3>Resource capacities</h3><p>App: 150 requests/s per active instance, up to four. SQL: Read capacity 180/s · Write capacity 70/s. Cache handles eligible reads; Order writes remain direct to SQL. Fixed SQL has no upgrade action. New App capacity costs +5 cr/min after 8s; Cache +8 cr/min after 5s; Edge +3 cr/min after 4s.</p></section>}
    {page === 'how' ? <>
      <p>Watch traffic reach your App and SQL. When pressure builds, click the + controls on the data-center floor.</p>
      <ol><li>Add App capacity when compute is overloaded. New instances need 8 seconds.</li><li>Add Cache to reduce SQL reads. It does not remove Order writes.</li><li>Add Protected Edge to filter bots before they reach App.</li></ol>
      <p>Costs are running credits, not purchase prices. Revenue does not refill budget. Pressure markers are not requests waiting to be served later.</p>
    </> : page === 'about' ? <p>A browser game about Azure infrastructure decisions. All capacities and costs are game assumptions, not Azure prices or specifications. The game does not deploy real resources. Official service icons identify Microsoft Azure services; no endorsement is implied.</p> : <>
      <h3>Why is this happening?</h3><p>{pressure.why}</p><p>Representative pressure markers are not a buffered queue. Dropped requests do not succeed later.</p>
      <MissionPanel view={view} /><h3>Detailed metrics</h3>
      <dl><dt>Revenue</dt><dd>{view.state.economy.revenue.toFixed(2)}</dd><dt>Net business value</dt><dd>{view.state.economy.netBusinessValue.toFixed(2)}</dd><dt>Infrastructure cost</dt><dd>{view.state.economy.infrastructureCost.toFixed(2)}</dd><dt>Latency</dt><dd>{view.snapshot?.metrics.averageLatency?.toFixed(0) ?? '—'} ms</dd><dt>SQL reads dropped/s</dt><dd>{r?.sql.readsDropped.toFixed(1) ?? '—'}</dd><dt>SQL writes dropped/s</dt><dd>{r?.sql.writesDropped.toFixed(1) ?? '—'}</dd></dl>
      <h3>Azure concepts</h3>{glossary.map(([name, text]) => <p key={name}><strong>{name}</strong> — {text}</p>)}
      <button onClick={() => { dialogRef.current?.close(); restart(); }}>Return to title / restart</button>
    </>}
  </dialog>;
}
