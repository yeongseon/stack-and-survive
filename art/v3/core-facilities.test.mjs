import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bayOrigins, facilityNames, facilitySvg } from './core-facilities.mjs';

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
    assert.equal((source.match(/<ellipse /g) ?? []).length, count * 2);
    if (count) assert.ok(source.length > facilitySvg('app-service', count - 1).length);
  }
  for (const count of [-1, 5, .5, NaN]) assert.throws(() => facilitySvg('app-service', count));
  assert.throws(() => facilitySvg('unknown'));
});
