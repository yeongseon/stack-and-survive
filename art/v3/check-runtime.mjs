import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { coreGeometry, facilityNames, facilitySvg, overlayNames, overlaySvg, deploymentNames, deploymentSvg } from './core-facilities.mjs';
import { environmentNames, environmentSvg } from './environment-kit.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const inventory=JSON.parse(await readFile(`${root}art/v3/runtime-inventory.json`,'utf8'));
const manifest=JSON.parse(await readFile(`${root}art/asset-manifest.json`,'utf8'));
const expected=new Map([...facilityNames.map(name=>[name,facilitySvg(name)]),...[1,2,3,4].map(count=>[`app-${count}`,facilitySvg('app-service',count)]),
  ...overlayNames.flatMap(name=>name.startsWith('app-')?[0,1,2,3].map(bay=>[`${name}-${bay}`,overlaySvg(name,bay)]):[[name,overlaySvg(name)]]),
  ...deploymentNames.map(name=>[name,deploymentSvg(name)]),...environmentNames.map(name=>[`env-${name}`,environmentSvg(name)])]);
assert.deepEqual(inventory.geometry,coreGeometry,'Runtime geometry must match editable source');
assert.equal(inventory.records.length,expected.size);
assert.equal(new Set(inventory.records.map(record=>record.name)).size,expected.size);
assert.equal(manifest.assets.filter(asset=>asset.provenance==='original-v3').length,expected.size);
for(const record of inventory.records){
  assert.ok(expected.has(record.name),'Unknown runtime V3 image');
  const entry=manifest.assets.find(asset=>asset.id===`v3-${record.name}`);
  assert.ok(entry,`Unmanifested runtime image ${record.name}`);
  assert.equal(entry.path,`apps/web/public/assets/v3/${record.name}.png`);
  assert.equal(entry.sourcePath,`art/v3/sources/${record.name}.svg`);
  assert.equal(record.sourceSha256,sha(expected.get(record.name)),`Stale editable source: ${record.name}`);
  assert.equal(entry.sourceSha256,record.sourceSha256);
  assert.equal(entry.sha256,record.sha256);
  const png=await readFile(`${root}${entry.path}`),source=await readFile(`${root}${entry.sourcePath}`);
  assert.equal(sha(png),record.sha256);assert.equal(sha(source),record.sourceSha256);
  assert.equal(png.readUInt32BE(16),640);assert.equal(png.readUInt32BE(20),640);
  assert.equal(record.bytes,png.length);
  const b=record.bounds;
  assert.ok([b.x,b.y,b.width,b.height].every(Number.isFinite)&&b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&b.x+b.width<=640&&b.y+b.height<=640);
}
console.log(`Verified ${expected.size} V3 runtime images, editable sources, manifest hashes and layer geometry. Rights review remains separate.`);
