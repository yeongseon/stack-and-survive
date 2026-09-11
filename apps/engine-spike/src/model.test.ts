import { describe, expect, it } from 'vitest';
import { addLink, createWorld, packets, project, unproject } from './model';

describe('shared synthetic fixture', () => {
  it('creates independent worlds', () => {
    const a = createWorld(); a.buildings[1].x = 75;
    expect(createWorld().buildings[1].x).toBe(0);
  });
  it('round-trips screen coordinates after pan and zoom', () => {
    const p = { x: 110, y: -90 }; const camera = { x: 33, y: 81, zoom: 1.4 };
    const restored = unproject(project(p, camera, 960, 540), camera, 960, 540);
    expect(restored.x).toBeCloseTo(p.x); expect(restored.y).toBeCloseTo(p.y);
  });
  it('rejects duplicate and invalid edges and permits reconnecting', () => {
    const w = createWorld(); expect(addLink(w, 'app', 'sql')).toBe(false);
    expect(addLink(w, 'sql', 'app')).toBe(false);
    w.links = []; expect(addLink(w, 'internet', 'app')).toBe(true);
    expect(w.links).toHaveLength(1);
  });
  it('moves 120 representative packets along only connected routes', () => {
    const w = createWorld(); expect(packets(w, 0)).toHaveLength(120);
    expect(packets(w, 1)).not.toEqual(packets(w, 0));
    w.links = []; expect(packets(w, 1)).toEqual([]);
  });
});
