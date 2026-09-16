import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const bytes = path => readFile(new URL(path, root));
const json = async path => JSON.parse(await bytes(path));
const sha = content => createHash('sha256').update(content).digest('hex');
function png(content, width, height) {
  assert.deepEqual([...content.subarray(0,8)], [137,80,78,71,13,10,26,10]);
  assert.equal(content.toString('ascii',12,16), 'IHDR');
  assert.equal(content.readUInt32BE(16),width);
  assert.equal(content.readUInt32BE(20),height);
}

test('three real small candidate renders have distinct output hashes', async () => {
  const hashes = [];
  for (const candidate of ['A','B','C']) {
    const content = await bytes(`iterations/04/candidates/04${candidate}.png`);
    const receipt = await json(`iterations/04/candidates/04${candidate}.json`);
    png(content,1200,675);
    assert.equal(sha(content),receipt.outputSha256);
    assert.equal(receipt.candidate,candidate);
    hashes.push(sha(content));
  }
  assert.equal(new Set(hashes).size,3);
});

test('selected whole-room render pins eight unchanged external model sources', async () => {
  const receipt = await json('iterations/04/render.json');
  const content = await bytes('iterations/04/environment.png');
  png(content,2400,1350);
  assert.equal(sha(content),receipt.outputSha256);
  assert.equal(receipt.heroBaked,false);
  assert.equal(receipt.productionChanges,0);
  assert.equal(receipt.importedGeometry.length,8);
  const selection = await json('source/selection.json');
  for (const item of receipt.importedGeometry) {
    const source = selection.find(record => record.pack === item.pack && record.name === item.model);
    assert.ok(source);
    const original = await bytes(`../../candidates/external/${item.pack}/selected/${item.model}.glb`);
    assert.equal(sha(original),source.sha256);
  }
});

test('final room has exactly the requested 18 valid same-state capture pairs', async () => {
  const captures = await json('iterations/04/comparison/captures.json');
  const expected = [1440,1920,844].flatMap(width => ['normal','fit','close','construction','cache-edge-active','pressure'].map(state => `${width}-${state}`));
  assert.deepEqual(captures.map(capture => `${capture.viewport.width}-${capture.name}`).sort(),expected.sort());
  const environment = sha(await bytes('iterations/04/environment.png'));
  for (const capture of captures) {
    assert.equal(capture.overlaySha256,environment);
    assert.ok(Number(capture.before.tick)>0);
    for (const key of ['tick','resourceStates','playerCamera','worldNodes','worldTargets','flows']) assert.equal(capture.before[key],capture.after[key]);
    assert.deepEqual(capture.errors,[]);
    for (const side of ['current','proposed']) {
      const content = await bytes(`iterations/04/comparison/${capture[side]}`);
      png(content,capture.viewport.width,capture.viewport.height);
      assert.equal(sha(content),capture[`${side}Sha256`]);
    }
  }
});
