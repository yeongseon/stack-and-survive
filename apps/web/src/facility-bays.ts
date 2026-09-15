import { v3, v3Unit } from './art-v3';

const geometry = v3?.geometry;
export const facilityBays = Object.freeze(geometry ? geometry.appBays.map(bay => ({ x: (bay.center[0] - geometry.origin.x) * v3Unit, y: (bay.center[1] - geometry.origin.y) * v3Unit })) : [
  { x: 0, y: -44 }, { x: 55, y: -16 }, { x: -55, y: -16 }, { x: 0, y: 12 },
]);
export const facilityModuleScale = v3 ? 1 : 2.8;
