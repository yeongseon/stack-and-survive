import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createWorld, project } from './model';
import { mountPhaser, mountPlayCanvas, type Renderer, type RenderStats } from './renderers';
import './style.css';

function App() {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef(createWorld());
  const [engine, setEngine] = useState('phaser');
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState('Loading');
  const [stats, setStats] = useState<RenderStats>({ frames: 0, fps: 0, packets: 0 });
  const [, refresh] = useState(0);
  useEffect(() => {
    let disposed = false; let renderer: Renderer | undefined;
    const node = host.current!;
    const surface = document.createElement('div'); surface.className = 'surface'; node.append(surface);
    surface.dataset.generation = String(generation);
    const current = createWorld(); world.current = current;
    setStatus('Loading'); setStats({ frames: 0, fps: 0, packets: 0 });
    const report = (s: RenderStats) => { if (!disposed) setStats(s); };
    const mount = engine === 'phaser' ? mountPhaser : mountPlayCanvas;
    const changed = () => { if (!disposed) refresh(x => x + 1); };
    mount(surface, current, report, changed).then(value => {
      if (disposed) { value.destroy(); surface.remove(); }
      else { renderer = value; setStatus('Ready'); }
    }).catch(error => {
      surface.remove();
      if (!disposed) setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    });
    return () => { disposed = true; renderer?.destroy(); surface.remove(); };
  }, [engine, generation]);
  const w = world.current;
  const act = (f: () => void) => { f(); refresh(x => x + 1); };
  const width = host.current?.clientWidth ?? 0; const height = host.current?.clientHeight ?? 0;
  const diagnostic = { engine, status, generation, viewport: { width, height }, ...stats, camera: w.camera, selected: w.selected,
    overloaded: w.overloaded, links: w.links, nodes: w.buildings.map(n => ({ ...n, screen: project(n, w.camera, width, height) })) };
  return <main>
    <header><div><p className="eyebrow">STACK &amp; SURVIVE / M0 EXPERIMENT</p><h1>Architecture, in motion.</h1></div>
      <span className="badge">ENGINE LAB · NOT THE GAME</span></header>
    <section className="toolbar" aria-label="Experiment controls">
      <label>Renderer <select aria-label="Renderer" value={engine} onChange={e => setEngine(e.target.value)}>
        <option value="phaser">Phaser 3 · 2D</option><option value="playcanvas">PlayCanvas · orthographic 3D</option>
      </select></label>
      <button type="button" onClick={() => setGeneration(x => x + 1)}>Reset / remount</button>
      <button type="button" aria-pressed={w.overloaded} onClick={() => act(() => { w.overloaded = !w.overloaded; })}>SQL overload</button>
      <button type="button" aria-pressed={w.connectionMode} onClick={() => act(() => { w.connectionMode = !w.connectionMode; w.connectionSource = null; })}>Connect nodes</button>
      <button type="button" onClick={() => act(() => { w.links = []; w.connectionSource = null; w.message = 'Connections cleared. Connect source → target.'; })}>Clear connections</button>
    </section>
    <div className="layout"><section className="board" aria-label="Architecture experiment">
      <div ref={host} className="host" data-testid="engine-host" />
      <div className="labels" aria-hidden="true">{w.buildings.map(n => {
        const p = project(n, w.camera, width, height);
        return <span key={n.id} style={{ left: p.x, top: p.y + 54 * w.camera.zoom }}>{n.label}{n.id === 'sql' && w.overloaded ? ' · ! OVERLOADED' : ''}</span>;
      })}</div>
      <div className="legend">120 representative packets · Synthetic fixture · No scoring or capacity model</div>
    </section><aside>
      <p className="eyebrow">LIVE RENDERER OBSERVATIONS</p>
      <h2 data-testid="engine-status">{status}</h2>
      <dl><dt>Selected</dt><dd data-testid="selected">{w.selected ?? 'None'}</dd>
        <dt>SQL fixture</dt><dd data-testid="sql-state">{w.overloaded ? '! OVERLOADED' : 'HEALTHY'}</dd>
        <dt>Active packets</dt><dd>{stats.packets}</dd><dt>Recent FPS</dt><dd>{stats.fps.toFixed(1)}</dd>
        <dt>Rendered frames</dt><dd>{stats.frames}</dd><dt>Zoom</dt><dd>{w.camera.zoom.toFixed(2)}×</dd>
        <dt>Connections</dt><dd>{w.links.length}</dd></dl>
      <p className="note">FPS is a short local sample, not a benchmark or engine ranking.</p>
      <output>{w.message}</output>
      <h3>Try the same actions</h3><ol><li>Click a building to select it.</li><li>Drag a building to move it.</li><li>Drag empty ground to pan.</li><li>Scroll to zoom.</li><li>Clear links, enable Connect, click source then target.</li><li>Toggle SQL overload, then remount.</li></ol>
      <p className="note">Shared pointer controls keep the comparison constant. Touch drag is supported; pinch gestures are not part of this spike.</p>
    </aside></div>
    <details><summary>Read-only test diagnostics</summary><pre data-testid="diagnostics">{JSON.stringify(diagnostic, null, 2)}</pre></details>
    <footer>YOUR ARCHITECTURE IS YOUR DEFENSE. <span>Phaser / PlayCanvas · Selection pending owner approval</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
