import {test} from 'node:test';
import assert from 'node:assert/strict';
import {environmentNames,environmentSvg} from './environment-kit.mjs';

test('twenty cohesive indoor pieces remain distinct reproducible and self-contained',()=>{
  assert.equal(environmentNames.length,20);
  const sources=environmentNames.map(environmentSvg);
  assert.equal(new Set(sources).size,20);
  for(const [i,source] of sources.entries()){
    assert.equal(source,environmentSvg(environmentNames[i]));
    assert.doesNotMatch(source,/data-active-module|<text|NaN|Infinity|<(?:script|image|foreignObject)\b/);
    const ids=new Set([...source.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
    for(const match of source.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.has(match[1]));
  }
  assert.throws(()=>environmentSvg('forklift'));
  assert.throws(()=>environmentSvg('tree'));
});
