import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.ok(process.argv[2], 'Usage: node scripts/publish-current-images.mjs <complete capture directory>');
const directory = resolve(process.argv[2]);
const capture = JSON.parse(await readFile(`${directory}/capture-manifest.json`, 'utf8'));
const run = JSON.parse(await readFile(`${directory}/actual-run.json`, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(capture.status, 'complete'); assert.deepEqual(capture.errors, []); assert.equal(capture.publicScorePosts, 0);
assert.equal(hash(await readFile(`${directory}/actual-run.json`)), capture.actualRunSha256);
const names = ['title', 'opening', 'construction', 'cache', 'app-scaling', 'warning', 'spike', 'edge', 'gameplay', 'recovery', 'sql-scaling', 'final-wave', 'join', 'learn', 'result', 'landscape-result', 'overload', 'pause', 'settings'];
assert.deepEqual(capture.frames.map(frame => frame.name), names);
const browser = await chromium.launch({ headless: true });
const images = [];
try {
  const page = await browser.newPage();
  for (const frame of capture.frames) {
    const png = await readFile(`${directory}/${frame.name}.png`);
    const data = await page.evaluate(async src => {
      const image = new Image(); image.src = src; await image.decode();
      const ratio = Math.min(1, 1200 / image.width, 750 / image.height);
      const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', .85);
    }, `data:image/png;base64,${png.toString('base64')}`);
    assert.ok(data.startsWith('data:image/webp;base64,'));
    const bytes = Buffer.from(data.split(',')[1], 'base64');
    await writeFile(`${root}docs/images/${frame.name}.webp`, bytes);
    images.push({ name: frame.name, sourceSha256: hash(png), sha256: hash(bytes), observation: frame.observation, readouts: frame.before });
  }
} finally { await browser.close(); }
await writeFile(`${root}docs/images/capture-manifest.json`, `${JSON.stringify({ ...capture, captureDirectory: basename(directory), rawVideo: basename(capture.rawVideo),
  finalResult: { score: run.score, elapsed: run.elapsed, status: run.status, objectiveMet: run.objectiveMet, availability: run.availability }, images }, null, 2)}\n`);
console.log('Published 19 verified screenshots. Rebuild the deck PDF and video if their images changed.');
