import type Phaser from 'phaser';
import type { Resource } from '@stack-and-survive/schema';
import { buildingAssets, buildingLayers, moduleAsset } from './building-assets';
import type { Point } from './editor';

export function spriteModules(resource: Resource, pending: boolean) {
  const active = resource.kind === 'compute' && resource.remaining === 0 ? resource.instances : 0;
  return { active, ghost: resource.kind === 'compute' && resource.remaining === 0 && pending };
}

export class BuildingSprites {
  private entries = new Map<string, { kind: Resource['kind']; group: Phaser.GameObjects.Container; body: Phaser.GameObjects.Image; modules: Phaser.GameObjects.Image[] }>();
  constructor(private scene: Phaser.Scene) {}

  update(resource: Resource, point: Point, pending: boolean, rank: number): boolean {
    const asset = buildingAssets[resource.kind];
    if (!asset || !this.scene.textures.exists(asset.texture)
      || (resource.kind === 'compute' && !this.scene.textures.exists(moduleAsset.texture))) {
      this.entries.get(resource.id)?.group.setVisible(false);
      return false;
    }
    let entry = this.entries.get(resource.id);
    if (entry && entry.kind !== resource.kind) {
      entry.group.destroy(true); this.entries.delete(resource.id); entry = undefined;
    }
    if (!entry) {
      const body = this.scene.add.image(0, 0, asset.texture).setOrigin(asset.originX, asset.originY).setDisplaySize(asset.width, asset.height);
      const group = this.scene.add.container(0, 0, [body]);
      const modules: Phaser.GameObjects.Image[] = [];
      if (resource.kind === 'compute') {
        for (let i = 0; i < 4; i++) {
          const module = this.scene.add.image(-30 + i * 20, 8, moduleAsset.texture)
            .setOrigin(moduleAsset.originX, moduleAsset.originY).setDisplaySize(moduleAsset.width, moduleAsset.height);
          group.add(module); modules.push(module);
        }
      }
      entry = { kind: resource.kind, group, body, modules }; this.entries.set(resource.id, entry);
    }
    entry.group.setPosition(point.x, point.y).setDepth(buildingLayers.body + rank).setVisible(true);
    entry.body.setAlpha(resource.remaining > 0 ? .25 : 1);
    const state = spriteModules(resource, pending);
    entry.modules.forEach((module, i) => {
      module.setVisible(i < state.active || (state.ghost && i === state.active));
      module.setAlpha(i < state.active ? 1 : .28);
    });
    return true;
  }

  diagnostics() {
    return [...this.entries].map(([id, entry]) => ({ id, texture: entry.body.texture.key, visible: entry.group.visible,
      depth: entry.group.depth, bodyAlpha: entry.body.alpha,
      bodyWidth: entry.body.displayWidth, bodyHeight: entry.body.displayHeight, originX: entry.body.originX, originY: entry.body.originY,
      modules: entry.modules.filter(module => module.visible).map(module => ({ alpha: module.alpha, texture: module.texture.key })) }));
  }

  retain(ids: readonly string[]) {
    for (const [id, entry] of this.entries) {
      if (!ids.includes(id)) { entry.group.destroy(true); this.entries.delete(id); }
    }
  }
  destroy() { for (const entry of this.entries.values()) entry.group.destroy(true); this.entries.clear(); }
}
