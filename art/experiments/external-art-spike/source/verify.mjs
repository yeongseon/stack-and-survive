import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const experiment = new URL('../', import.meta.url);
const art = new URL('../../../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, experiment), 'utf8'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('selected source bytes match exact provenance records', async () => {
  const selection = await json('source/selection.json');
  assert.equal(selection.length, 15);
  for (const item of selection) {
    const bytes = await readFile(new URL(`candidates/external/${item.pack}/selected/${item.name}.glb`, art));
    assert.equal(digest(bytes), item.sha256);
    assert.equal(bytes.length, item.bytes);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(item.runtime, null);
    assert.equal(item.review, 'candidate');
  }
});

test('all selected pack colormaps match pinned archive member hashes', async () => {
  const textures = await json('source/textures.json');
  const packs = await json('source/packs.json');
  assert.equal(textures.length, packs.length);
  assert.deepEqual(textures.map(item => item.pack).sort(), packs.map(item => item.id).sort());
  for (const texture of textures) {
    assert.equal(texture.path, 'Textures/colormap.png');
    assert.equal(texture.archiveMember, 'Models/GLB format/Textures/colormap.png');
    const bytes = await readFile(new URL(`candidates/external/${texture.pack}/selected/${texture.path}`, art));
    assert.equal(digest(bytes), texture.sha256, `Colormap hash mismatch: ${texture.pack}`);
    assert.equal(bytes.length, texture.bytes);
  }
});

test('all screenshot pairs prove unchanged operating state and valid dimensions', async () => {
  const captures = await json('comparison/captures.json');
  assert.equal(captures.length, 18);
  assert.equal(new Set(captures.map(item => `${item.viewport.width}-${item.name}`)).size, 18);
  for (const item of captures) {
    assert.ok(Number(item.before.tick) > 0);
    for (const field of ['tick', 'resourceStates', 'playerCamera', 'worldNodes', 'worldTargets', 'flows']) {
      assert.equal(item.before[field], item.after[field]);
    }
    assert.deepEqual(item.errors, []);
    for (const side of ['current', 'proposed']) {
      const bytes = await readFile(new URL(`comparison/${item[side]}`, experiment));
      assert.equal(digest(bytes), item[`${side}Sha256`]);
      assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
      assert.equal(bytes.readUInt32BE(16), item.viewport.width);
      assert.equal(bytes.readUInt32BE(20), item.viewport.height);
    }
    const state = JSON.parse(item.before.resourceStates);
    if (item.name === 'pressure') assert.equal(state.app.pressure, 'overcapacity');
    if (item.name === 'construction') assert.equal(state.cache.lifecycle, 'provisioning');
    if (item.name === 'cache-edge-active') {
      assert.equal(state.cache.lifecycle, 'active'); assert.equal(state.edge.lifecycle, 'active');
    }
  }
});

test('render PNG has the expected dimensions and placement anchors avoid hero midground', async () => {
  const layout = await json('source/layouts/environment.json');
  const render = await json('renders/environment/render.json');
  assert.deepEqual(render.canvas, [2400, 1350]);
  assert.equal(render.instances, 18);
  assert.equal(render.transparent, true);
  const [left, top, right, bottom] = layout.protectedMidground;
  for (const [, , x, y] of layout.placements) assert.ok(x < left || x > right || y < top || y > bottom);
  const bytes = await readFile(new URL('renders/environment/external-overlay.png', experiment));
  assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(8), 13);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), render.canvas[0]);
  assert.equal(bytes.readUInt32BE(20), render.canvas[1]);
  assert.equal(bytes[25], 6);
  for (const item of await json('comparison/captures.json')) assert.equal(digest(bytes), item.overlaySha256);
});
