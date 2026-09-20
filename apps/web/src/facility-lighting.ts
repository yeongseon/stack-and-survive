import type Phaser from 'phaser';
import type { Kind, Resource } from '@stack-and-survive/schema';
import type { Point } from './editor';
import type { resourceVisualState, PressureState } from './resource-visual-state';
import { activeBuildingScale, resourceArtBounds } from './building-assets';

type Visual = ReturnType<typeof resourceVisualState>;
export type LightState = { mode: 'pending' | 'idle' | 'healthy' | 'warning' | 'critical' | 'boosted'; color: number; alpha: number };
export function facilityLight(kind: Kind, visual: Visual): LightState | null {
  const state = kind === 'compute' ? visual.app : kind === 'database' ? visual.sql : visual[kind];
  if (state.lifecycle === 'absent') return null;
  if (state.lifecycle === 'provisioning') return { mode: 'pending', color: 0x8eb5ce, alpha: .09 };
  if (!state.onPath || visual.reading === 'unmeasured') return { mode: 'idle', color: 0x7193a8, alpha: .08 };
  const pressure: PressureState = state.pressure;
  if (pressure === 'overcapacity') return { mode: 'critical', color: 0xff695d, alpha: .31 };
  if (pressure === 'warning') return { mode: 'warning', color: 0xffb454, alpha: .24 };
  if (kind === 'edge' && visual.edge.boost === 'active') return { mode: 'boosted', color: 0xffd487, alpha: .24 };
  return { mode: 'healthy', color: kind === 'cache' ? 0x4decc2 : 0x46ceff, alpha: .17 };
}

export class FacilityLighting {
  private entries = new Map<string, { shadow: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; state: LightState }>();
  private signature = '';
  constructor(private scene: Phaser.Scene) {
    if (!scene.textures.exists('facility-soft-disc')) {
      const painter = scene.make.graphics({ x: 0, y: 0 });
      for (let i = 12; i >= 1; i--) {
        painter.fillStyle(0xffffff, .05); painter.fillEllipse(64, 32, i * 10, i * 4.6);
      }
      painter.generateTexture('facility-soft-disc', 128, 64); painter.destroy();
    }
  }
  update(resources: Resource[], points: Point[], visual: Visual, width: number, enabled: boolean) {
    const signature = JSON.stringify([enabled, width, points, visual.reading, resources.map(resource => [resource.id, resource.kind, resource.tier, resource.remaining, facilityLight(resource.kind, visual)])]);
    if (signature === this.signature) return;
    this.signature = signature;
    const current = new Set<string>();
    if (enabled) resources.forEach((resource, index) => {
      const state = facilityLight(resource.kind, visual);
      if (!state) return;
      current.add(resource.id);
      let entry = this.entries.get(resource.id);
      if (!entry) {
        entry = { shadow: this.scene.add.image(0, 0, 'facility-soft-disc').setDepth(1).setTint(0x010918),
          glow: this.scene.add.image(0, 0, 'facility-soft-disc').setDepth(2), state };
        this.entries.set(resource.id, entry);
      }
      const scale = activeBuildingScale(resource, width);
      const bounds = resourceArtBounds(resource.kind, scale, true);
      const point = points[index];
      entry.state = state;
      entry.shadow.setPosition(point.x + 12 * scale, point.y + 20 * scale)
        .setDisplaySize(bounds.width * 1.25, 60 * scale).setAlpha(resource.remaining > 0 ? .2 : .55).setVisible(true);
      entry.glow.setPosition(point.x, point.y + 9 * scale).setDisplaySize(bounds.width * 1.65, 105 * scale)
        .setTint(state.color).setAlpha(visual.reading === 'last-tick' ? state.alpha * .8 : state.alpha).setVisible(true);
    });
    for (const [id, entry] of this.entries) if (!current.has(id)) {
      entry.glow.destroy(); entry.shadow.destroy(); this.entries.delete(id);
    }
  }
  diagnostics() { return [...this.entries].map(([id, entry]) => ({ id, ...entry.state, glowDepth: entry.glow.depth, shadowDepth: entry.shadow.depth })); }
  destroy() { for (const entry of this.entries.values()) { entry.glow.destroy(); entry.shadow.destroy(); } this.entries.clear(); }
}
