import { chromium } from '@playwright/test';
import { readFile, writeFile, copyFile, mkdtemp } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(process.argv[2] ?? '');
assert.ok(process.argv[2], 'Usage: node scripts/render-project-video.mjs <complete capture directory> [--voice]');
const capture = JSON.parse(await readFile(`${directory}/capture-manifest.json`, 'utf8'));
assert.equal(capture.status, 'complete'); assert.deepEqual(capture.errors, []); assert.equal(capture.publicScorePosts, 0);
const run = JSON.parse(await readFile(`${directory}/actual-run.json`, 'utf8'));
assert.equal(run.elapsed, 180); assert.equal(run.status, 'COMPLETED');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(await readFile(`${directory}/actual-run.json`)), capture.actualRunSha256);
const voice = process.argv.includes('--voice');
if (voice) assert.equal(process.platform, 'darwin', '--voice uses installed macOS Samantha; no network voice service is called');
const expectedImages = ['title', 'opening', 'construction', 'cache', 'app-scaling', 'warning', 'spike', 'edge', 'gameplay', 'recovery', 'sql-scaling', 'final-wave', 'join', 'learn', 'result', 'landscape-result', 'overload', 'pause', 'settings'];
assert.deepEqual(capture.frames.map(frame => frame.name), expectedImages, 'Capture must provide the complete current image set exactly once');
const output = await mkdtemp(`${directory}/project-video-`);
const toolchain = { node: process.version, platform: process.platform,
  ffmpeg: execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split('\n')[0],
  ffprobe: execFileSync('ffprobe', ['-version'], { encoding: 'utf8' }).split('\n')[0],
  os: voice ? execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim() : process.platform,
  voice: voice ? 'Installed macOS Samantha; OS-provided voice version not separately exposed by say' : 'none', chromium: '' };
const segments = [
  { duration: 12, type: 'card', kicker: '01 / PROJECT INTRODUCTION', title: 'Architecture is a decision.\nMake it playable.',
    points: ['Stack & Survive', 'A browser strategy game for exploring cloud tradeoffs', 'Same workload. Different architectures. Different outcomes.'],
    narration: 'Cloud diagrams explain the components. But beginners also need to see why those components work together. Stack and Survive makes those decisions playable.' },
  { duration: 12, type: 'card', kicker: '02 / THE CHALLENGE', title: 'Keep the business flowing.',
    points: ['180 seconds of Black Friday demand', 'Eight phases: spikes, bots and recovery windows', 'Balance availability, lost sales and running cost'],
    narration: 'You operate a data center through one hundred eighty seconds of Black Friday. Traffic spikes, bots arrive, and every infrastructure choice affects customers and cost.' },
  { duration: 20, type: 'game', marker: 'construction-start', kicker: '03 / REAL GAMEPLAY EXCERPT', title: 'Build now. Capacity arrives later.',
    subtitle: 'App scaling changes capacity after construction. Cache helps eligible reads, not writes.',
    narration: 'Start small, then build before the next wave. Adding an App machine takes eight seconds. Cache reduces eligible database reads, but order writes still reach SQL. Scale in or change tiers when your needs change. The current state, not the animation, determines capacity.' },
  { duration: 18, type: 'game', marker: 'bot-start', kicker: '04 / EDIT: LATER BOT ATTACK', title: 'Protect the right layer.',
    subtitle: 'Actual 440 req/s phase · representative packets · simulated money, not Azure pricing',
    narration: 'During the bot attack, Protected Edge filters malicious requests, with a tradeoff in legitimate traffic. More App machines do not fix every database bottleneck. Watch the next wave, read the pressure, and choose which layer needs attention.' },
  { duration: 14, type: 'game', marker: 'final-start', kicker: '05 / EDIT: FINAL WAVE', title: 'Survive changing demand.',
    subtitle: 'The final 20 seconds reach 600 req/s and 45% bots. This video cuts time; the game does not.',
    narration: 'The final wave reaches six hundred requests per second. This is edited footage of a real run, not accelerated simulation. Clear the full operation, then inspect what your decisions achieved.' },
  { duration: 14, type: 'game', marker: 'result', kicker: '06 / EDIT: ACTUAL COMPLETED RESULT', title: `${run.score.toLocaleString('en-US')} points. One real completed run.`,
    subtitle: 'Local-only automated run · score unchanged · no public submission · no human study claim',
    narration: `This full run scored ${run.score} points. Compare availability, cost and architecture. Try a different strategy, then follow Microsoft Learn links to explore the real services.` },
  { duration: 20, type: 'card', kicker: '07 / IMPLEMENTED AGENT DESIGN — NOT A LIVE MODEL DEMO', title: 'From a decision\nto a checked blueprint.',
    points: ['Finished run → fixed Azure mapping → Bicep candidate', 'Compiler + architecture checks → bounded repair', 'Exact verified file → human review, never deployment'],
    narration: 'The implemented Export Agent connects finished runs to infrastructure as code. It can select mapping and validation tools, then repair a candidate using compiler feedback. These are real tool boundaries, not a chatbot controlling the game. Live Azure model verification is still pending. Nothing is deployed.' },
  { duration: 10, type: 'card', kicker: '08 / TRY IT', title: 'Play. Question. Learn.',
    points: ['React + Phaser + deterministic TypeScript engine', 'Local gameplay works without an account', 'yeongseon.github.io/stack-and-survive/'],
    narration: 'Play first. Question the tradeoff. Then explore Microsoft Learn. Try Stack and Survive, and see what you would change in the next architecture.' },
];
assert.equal(segments.reduce((sum, segment) => sum + segment.duration, 0), 120);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const browser = await chromium.launch({ headless: true });
toolchain.chromium = browser.version();
try {
  for (const [index, segment] of segments.entries()) {
    const game = segment.type === 'game';
    const page = await browser.newPage({ viewport: { width: 1440, height: game ? 100 : 1000 }, deviceScaleFactor: 1 });
    const footer = `LOCAL PRODUCTION CAPTURE ${capture.sourceCommit.slice(0, 7)} · EDITED REAL GAMEPLAY · ${voice ? 'SYNTHETIC ENGLISH NARRATION' : 'SILENT CAPTIONED EDIT'}`;
    await page.setContent(`<html lang="en"><body style="margin:0;background:#081e2b;color:#eef6f4;box-sizing:border-box;font-family:Arial,sans-serif;${game ? 'padding:10px 26px' : 'padding:72px 88px;height:1000px;display:flex;flex-direction:column;border-top:10px solid #7cd1d7;background:radial-gradient(ellipse at 90% 0%,#194456,#081e2b 65%)'}">
      <div style="font-size:${game ? 11 : 17}px;letter-spacing:.16em;color:#a8d3d7">${escape(segment.kicker)}</div>
      <h1 style="white-space:pre-line;line-height:1.08;font-size:${game ? 22 : 76}px;margin:${game ? '5px 0' : '50px 0 30px'};color:#f1ce95">${escape(segment.title)}</h1>
      ${game ? `<div style="font-size:16px">${escape(segment.subtitle)}</div>` : `<ul style="padding-left:28px;font-size:28px;line-height:1.6;margin:10px 0 40px">${segment.points.map(point => `<li>${escape(point)}</li>`).join('')}</ul><p style="margin-top:auto;font-size:18px;line-height:1.5;color:#c2d4db">Game numbers are abstractions, not Azure performance or pricing.<br>No resources are deployed. User learning and live AI acceptance remain unverified.</p>`}
      <div style="font-size:${game ? 9 : 12}px;color:#9cb9c4;${game ? 'margin-top:5px' : 'margin-top:24px'}">${footer}</div></body></html>`);
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `Card ${index} overflows`);
    await page.screenshot({ path: `${output}/card-${index}.png` }); await page.close();
  }
} finally { await browser.close(); }
const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const probe = file => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], { encoding: 'utf8' }));
const rawDuration = Number(probe(capture.rawVideo).format.duration);
let elapsed = 0;
const srt = [], narration = [];
const timestamp = seconds => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')},${String(Math.round((seconds % 1) * 1000)).padStart(3, '0')}`;
for (const [index, segment] of segments.entries()) {
  segment.start = elapsed; elapsed += segment.duration;
  segment.sourceStart = segment.type === 'game' ? capture.markers[segment.marker] : null;
  if (segment.type === 'game') {
    assert.ok(Number.isFinite(segment.sourceStart) && segment.sourceStart >= 0 && segment.sourceStart + segment.duration <= rawDuration, 'Clip exceeds real source');
    ffmpeg(['-ss', String(segment.sourceStart), '-i', capture.rawVideo, '-loop', '1', '-i', `${output}/card-${index}.png`, '-filter_complex', '[0:v]fps=25,pad=1440:1000:0:0:color=0x081e2b[game];[game][1:v]overlay=0:900:shortest=1,format=yuv420p[out]', '-map', '[out]', '-frames:v', String(segment.duration * 25), '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', `${output}/video-${index}.mp4`]);
  } else ffmpeg(['-loop', '1', '-i', `${output}/card-${index}.png`, '-t', String(segment.duration), '-r', '25', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', `${output}/video-${index}.mp4`]);
  if (voice) {
    const textFile = `${output}/voice-${index}.txt`; await writeFile(textFile, segment.narration);
    execFileSync('say', ['-v', 'Samantha', '-r', '175', '-f', textFile, '-o', `${output}/voice-${index}.aiff`], { stdio: 'inherit' });
    segment.voiceSeconds = Number(probe(`${output}/voice-${index}.aiff`).format.duration);
    assert.ok(segment.voiceSeconds <= segment.duration - .15, `Narration ${index} too long (${segment.voiceSeconds}s); shorten text, never truncate it`);
    ffmpeg(['-i', `${output}/voice-${index}.aiff`, '-af', 'adelay=150,apad', '-t', String(segment.duration), '-ar', '48000', '-ac', '1', `${output}/audio-${index}.wav`]);
  }
  const sentences = segment.narration.match(/[^.!?]+[.!?]+/g) ?? [segment.narration];
  const total = sentences.reduce((sum, sentence) => sum + sentence.trim().split(/\s+/).length, 0);
  let offset = segment.start + .15;
  const spoken = segment.voiceSeconds ?? segment.duration - .3;
  for (const sentence of sentences) {
    const duration = spoken * sentence.trim().split(/\s+/).length / total;
    srt.push(`${srt.length + 1}\n${timestamp(offset)} --> ${timestamp(offset + duration)}\n${sentence.trim()}\n`); offset += duration;
  }
  narration.push(`## ${timestamp(segment.start).slice(0, 8)}–${timestamp(elapsed).slice(0, 8)} · ${segment.kicker}\n\n${segment.narration}\n`);
}
await writeFile(`${output}/video-list.txt`, segments.map((_, i) => `file 'video-${i}.mp4'`).join('\n'));
ffmpeg(['-f', 'concat', '-safe', '0', '-i', `${output}/video-list.txt`, '-c', 'copy', '-movflags', '+faststart', `${output}/silent.mp4`]);
await writeFile(`${output}/captions.srt`, srt.join('\n'));
if (voice) {
  await writeFile(`${output}/audio-list.txt`, segments.map((_, i) => `file 'audio-${i}.wav'`).join('\n'));
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', `${output}/audio-list.txt`, '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-t', '120', '-ar', '48000', '-ac', '1', `${output}/narration.wav`]);
  ffmpeg(['-i', `${output}/silent.mp4`, '-i', `${output}/narration.wav`, '-i', `${output}/captions.srt`, '-map', '0:v', '-map', '1:a', '-map', '2:s', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-t', '120', '-movflags', '+faststart', `${output}/project-introduction.mp4`]);
} else await copyFile(`${output}/silent.mp4`, `${output}/project-introduction.mp4`);
const final = `${output}/project-introduction.mp4`, metadata = probe(final);
assert.equal(Number(metadata.format.duration), 120); assert.equal(metadata.streams.find(stream => stream.codec_type === 'video').nb_frames, '3000');
ffmpeg(['-i', final, '-f', 'null', '-']);
const published = `${root}docs/media/`; await copyFile(final, `${published}project-introduction-120s.mp4`);
await copyFile(`${output}/captions.srt`, `${published}project-introduction-120s.srt`);
ffmpeg(['-i', `${output}/card-0.png`, '-frames:v', '1', '-update', '1', `${published}project-introduction-preview.jpg`]);
const imageManifest = [];
const imageBrowser = await chromium.launch({ headless: true });
try {
const imagePage = await imageBrowser.newPage();
for (const frame of capture.frames) {
  const destination = `${root}docs/images/${frame.name}.webp`;
  const png = await readFile(`${directory}/${frame.name}.png`);
  const encoded = await imagePage.evaluate(async data => {
    const image = new Image(); image.src = data; await image.decode();
    const factor = Math.min(1, 1200 / image.width, 750 / image.height);
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * factor); canvas.height = Math.round(image.height * factor);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', .85);
  }, `data:image/png;base64,${png.toString('base64')}`);
  assert.ok(encoded.startsWith('data:image/webp;base64,'));
  await writeFile(destination, Buffer.from(encoded.split(',')[1], 'base64'));
  imageManifest.push({ name: frame.name, sourceSha256: sha256(await readFile(`${directory}/${frame.name}.png`)), sha256: sha256(await readFile(destination)), observation: frame.observation, readouts: frame.before });
}
} finally { await imageBrowser.close(); }
await writeFile(`${root}docs/images/capture-manifest.json`, `${JSON.stringify({ ...capture, captureDirectory: basename(directory), rawVideo: basename(capture.rawVideo),
  finalResult: { score: run.score, elapsed: run.elapsed, status: run.status, objectiveMet: run.objectiveMet, availability: run.availability }, images: imageManifest }, null, 2)}\n`);
await writeFile(`${published}project-introduction-120s.json`, `${JSON.stringify({ sourceCommit: capture.sourceCommit, capturedAt: capture.capturedAt, captureDirtyTree: capture.dirtyTree, runtimeClean: capture.runtimeClean, captureBundles: capture.bundles,
  mode: capture.mode, publicScorePosts: 0, score: run.score, runDuration: run.elapsed, runAvailability: run.availability, captureDirectory: basename(directory), actualRunSha256: capture.actualRunSha256,
  rawVideo: basename(capture.rawVideo), rawVideoSha256: sha256(await readFile(capture.rawVideo)), segments,
  file: 'project-introduction-120s.mp4', sha256: sha256(await readFile(final)), bytes: Number(metadata.format.size), duration: 120, width: 1440, height: 1000, frames: 3000, toolchain,
  audio: voice ? 'Offline macOS Samantha synthetic English narration, 175 words/minute, no music, game sound muted. Not human voice or hearing acceptance.' : 'Silent captioned edit; narration transcript provided.',
  captions: 'English SRT and optional embedded track; word-weighted sentence timing, not speech-alignment certification. Visible chapter captions are burned in.',
  validation: 'Full ffmpeg decode passed; exact120seconds/3000frames; each voice segment fits its allotted time. Human narration/listening and rights/event review remain required.',
}, null, 2)}\n`);
await writeFile(`${published}PROJECT_INTRO_NARRATION.md`, `# Two-minute project introduction — ${capture.sourceCommit.slice(0, 7)}\n\nProject introduction + labeled edited real gameplay + agent-design explanation + closing. ${voice ? 'Offline synthetic English narration (macOS Samantha); not a human presenter.' : 'Silent with narration transcript.'} No live AI demo or cloud deployment is claimed. Full operation=${run.elapsed}s; this edit=${120}s. Actual local score=${run.score}.\n\n${narration.join('\n')}`);
console.log(JSON.stringify({ output, published: final, duration: 120, bytes: metadata.format.size, images: imageManifest.length, voice }, null, 2));
