import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bayOrigins, facilityNames, facilitySvg, overlayNames, overlaySvg, deploymentNames, deploymentSvg, coreGeometry } from './core-facilities.mjs';

test('six deterministic original facility sources contain no remote or executable content', () => {
  assert.equal(new Set(facilityNames).size, 6);
  const sources = facilityNames.map(name => facilitySvg(name));
  assert.equal(new Set(sources).size, 6);
  for (const [index, source] of sources.entries()) {
    assert.equal(source, facilitySvg(facilityNames[index]));
    assert.match(source, /viewBox="0 0 640 640"/);
    assert.doesNotMatch(source, /<(?:script|image|foreignObject)\b|(?:href|onload)=|NaN|Infinity/i);
  }
});

test('App populations add one independent module at each of four physical bays', () => {
  assert.equal(bayOrigins.length, 4);
  for (let count = 0; count <= 4; count++) {
    const source = facilitySvg('app-service', count);
    assert.equal((source.match(/data-active-module="true"/g) ?? []).length, count);
    assert.equal((source.match(/<ellipse /g) ?? []).length, count * 2);
    if (count) assert.ok(source.length > facilitySvg('app-service', count - 1).length);
  }
  for (const count of [-1, 5, .5, NaN]) assert.throws(() => facilitySvg('app-service', count));
  assert.throws(() => facilitySvg('unknown'));
});

test('independent overlays never include active modules or fabricated metrics', () => {
  for(const name of overlayNames) for(let bay=0;bay<4;bay++) {
    const source=overlaySvg(name,bay);
    assert.equal(source,overlaySvg(name,bay));
    assert.doesNotMatch(source,/data-active-module|<text|NaN|Infinity|<(?:script|image|foreignObject)\b/);
    assert.match(source,/viewBox="0 0 640 640"/);
  }
  assert.notEqual(overlaySvg('sql-read-warning'),overlaySvg('sql-write-warning'));
  assert.throws(()=>overlaySvg('app-construction',4));
  assert.throws(()=>overlaySvg('unknown'));
});

test('every material reference resolves inside its standalone source',()=>{
  for(const source of [...facilityNames.map(name=>facilitySvg(name)),...overlayNames.map(name=>overlaySvg(name)),...deploymentNames.map(name=>deploymentSvg(name))]) {
    const ids=new Set([...source.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
    for(const match of source.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.has(match[1]),`Missing material ${match[1]}`);
  }
});

test('deployment studies remain distinct inactive construction, never reused active art',()=>{
  const sources=deploymentNames.map(name=>deploymentSvg(name));
  assert.equal(new Set(sources).size,6);
  for(const [i,source] of sources.entries()) {
    assert.equal(source,deploymentSvg(deploymentNames[i]));
    assert.doesNotMatch(source,/data-active-module|<text|NaN|Infinity|<(?:script|image|foreignObject)\b/);
    assert.notEqual(source,facilitySvg(deploymentNames[i].startsWith('edge')?'protected-edge':'redis-cache'));
  }
  assert.throws(()=>deploymentSvg('cache-active'));
});

test('explicit layer geometry maps the standalone module onto all four bay positions',()=>{
  assert.deepEqual(coreGeometry.canvas,{width:640,height:640});
  assert.deepEqual(coreGeometry.origin,{x:320,y:398});
  assert.equal(coreGeometry.appBays.length,4);
  const standaloneOrigin=[320+(-29+28)*1.35,398+(-29-28)*.65];
  for(const bay of coreGeometry.appBays){
    const [x,y]=bayOrigins[bay.index];
    assert.ok(Math.abs(standaloneOrigin[0]+bay.moduleOffset.x-(320+(x-y)*1.35))<1e-9);
    assert.ok(Math.abs(standaloneOrigin[1]+bay.moduleOffset.y-(398+(x+y)*.65))<1e-9);
    for(const point of [bay.center,...bay.footprint])assert.ok(point.every(value=>Number.isFinite(value)&&value>=0&&value<=640));
  }
});
