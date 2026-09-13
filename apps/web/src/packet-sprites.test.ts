import { expect, it } from 'vitest';
import { packetTexture } from './packet-sprites';
it('uses bounded reusable textures and only switches to real endpoint states at arrival', () => {
  const flow = { from: 'internet', to: 'edge', kind: 'bot', volume: 140, end: 'filtered' } as const;
  expect(packetTexture(flow, .5)).toBe('packet-bot-packet');
  expect(packetTexture(flow, .9)).toBe('packet-bot-edge-filter');
  expect(packetTexture({ ...flow, to: 'compute' }, .9)).toBe('packet-bot-intake-limit');
  expect(packetTexture({ ...flow, to: 'cache', kind: 'browse', end: 'success' }, .9)).toBe('packet-browse-cache-hit');
});
