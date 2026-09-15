import approvedInventory from '../../../art/v3/runtime-inventory.json' with { type: 'json' };
import { assetUrl } from './asset-url';

const localReview = import.meta.env?.DEV && import.meta.env?.MODE === 'art-preview';
export const v3 = localReview && typeof __V3_REVIEW__ !== 'undefined' ? __V3_REVIEW__
  : import.meta.env?.PROD && import.meta.env?.MODE !== 'qa' ? approvedInventory : null;
export const v3Unit = .3;
export function v3Texture(name: string) { return `v3-${name}`; }
const source = (name: string) => localReview ? `/__art-v3/${name}.png` : assetUrl(`assets/v3/${name}.png`);
export const v3Images = v3?.records.map(record => ({ texture: v3Texture(record.name), src: source(record.name) })) ?? [];
const records = new Map(v3?.records.map(record => [record.name, record]));
export function v3Asset(name: string) {
  const record = records.get(name);
  if (!record || !v3) throw new Error(`Missing verified V3 review asset: ${name}`);
  const { origin, canvas } = v3.geometry;
  return { texture: v3Texture(name), src: source(name), width: canvas.width * v3Unit, height: canvas.height * v3Unit,
    originX: origin.x / canvas.width, originY: origin.y / canvas.height, footprintWidth: 116, footprintDepth: 96,
    visible: { x: (record.bounds.x - origin.x) * v3Unit, y: (record.bounds.y - origin.y) * v3Unit, width: record.bounds.width * v3Unit, height: record.bounds.height * v3Unit } };
}
