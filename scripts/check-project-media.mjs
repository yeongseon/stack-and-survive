import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const media = `${root}docs/media/`, manifest = JSON.parse(await readFile(`${media}project-introduction-120s.json`, 'utf8'));
const movie = await readFile(`${media}${manifest.file}`);
assert.equal(createHash('sha256').update(movie).digest('hex'), manifest.sha256);
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', `${media}${manifest.file}`], { encoding: 'utf8' }));
const video = probe.streams.find(stream => stream.codec_type === 'video');
assert.equal(Number(probe.format.duration), 120); assert.equal(video.nb_frames, '3000');
assert.equal(video.codec_name, 'h264'); assert.equal(video.width, 1440); assert.equal(video.height, 1000);
assert.equal(manifest.publicScorePosts, 0); assert.equal(manifest.runDuration, 180); assert.equal(manifest.runtimeClean, true);
const narrated = manifest.audio.startsWith('Offline');
if (narrated) {
  assert.equal(probe.streams.find(stream => stream.codec_type === 'audio')?.codec_name, 'aac');
  assert.equal(Number(probe.streams.find(stream => stream.codec_type === 'audio').duration), 120);
  assert.ok(probe.streams.some(stream => stream.codec_type === 'subtitle'));
}
let elapsed = 0;
for (const segment of manifest.segments) {
  assert.equal(segment.start, elapsed); elapsed += segment.duration;
  if (narrated) assert.ok(segment.voiceSeconds <= segment.duration - .15);
}
assert.equal(elapsed, 120); assert.equal(manifest.segments[0].type, 'card');
assert.ok(manifest.segments.some(segment => segment.kicker.includes('NOT A LIVE MODEL DEMO')));
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', `${media}${manifest.file}`, '-f', 'null', '-'], { stdio: 'inherit' });
const captures = JSON.parse(await readFile(`${root}docs/images/capture-manifest.json`, 'utf8'));
assert.equal(captures.status, 'complete'); assert.equal(captures.sourceCommit, manifest.sourceCommit); assert.equal(captures.images.length, 19);
assert.deepEqual(captures.errors, []);
assert.equal(captures.finalResult.score, manifest.score); assert.equal(captures.finalResult.elapsed, 180);
assert.equal(captures.finalResult.availability, manifest.runAvailability);
assert.ok(manifest.runAvailability >= 0 && manifest.runAvailability <= 1);
for (const image of captures.images) {
  const bytes = await readFile(`${root}docs/images/${image.name}.webp`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
}
const output = `${root}test-results-submission/project-media-check`; await mkdir(output, { recursive: true });
const server = createServer((request, response) => {
  if (request.url === '/movie.mp4') {
    const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '');
    if (match) { const start = Number(match[1]), end = match[2] ? Math.min(Number(match[2]), movie.length - 1) : movie.length - 1;
      if (start > end || start >= movie.length) { response.writeHead(416); response.end(); return; }
      response.writeHead(206, { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${movie.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 }); response.end(movie.subarray(start, end + 1));
    } else { response.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': movie.length, 'Accept-Ranges': 'bytes' }); response.end(movie); }
  } else { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><html lang="en"><title>Project video verification</title><body style="margin:0;background:#081e2b"><video style="display:block;width:100%" controls muted preload="auto" src="/movie.mp4"></video></body></html>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  assert.equal(await page.locator('video').evaluate(element => element.duration), 120);
  for (const [index, segment] of manifest.segments.entries()) {
    await page.locator('video').evaluate((element, time) => new Promise((resolve, reject) => {
      element.addEventListener('seeked', () => resolve(), { once: true }); element.addEventListener('error', () => reject(new Error('Video decode failed')), { once: true }); element.currentTime = time;
    }), segment.start + 1);
    await expect.poll(() => page.locator('video').evaluate(element => element.readyState)).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: `${output}/chapter-${index + 1}.png` });
  }
  await page.locator('video').evaluate(async element => { element.currentTime = 0; await element.play(); });
  await page.waitForFunction(() => document.querySelector('video').currentTime > 1);
  await page.locator('video').evaluate(element => element.pause());
  const images = await browser.newPage({ viewport: { width: 1500, height: 1600 } });
  await images.setContent('<body style="margin:0;padding:10px;background:#081e2b;color:white;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font:14px sans-serif"></body>');
  for (const image of captures.images) {
    const bytes = await readFile(`${root}docs/images/${image.name}.webp`);
    await images.evaluate(async ({ name, data }) => {
      const figure = document.createElement('figure'); figure.style.margin = '0';
      const caption = document.createElement('figcaption'); caption.textContent = name;
      const picture = new Image(); picture.style.width = '100%'; picture.src = data;
      await picture.decode(); figure.append(caption, picture); document.body.append(figure);
    }, { name: image.name, data: `data:image/webp;base64,${bytes.toString('base64')}` });
  }
  await images.screenshot({ path: `${output}/all-current-images.png`, fullPage: true });
  await images.close();
  assert.deepEqual(errors, []);
  console.log(`PASS ${manifest.sourceCommit.slice(0, 7)}: 120s/3000frames, ${narrated ? 'AAC narration + subtitles' : 'silent'}, full decode, 19 image hashes, browser playback + 8 chapter seeks`);
} finally { try { await browser.close(); } finally { await new Promise(resolve => server.close(resolve)); } }
