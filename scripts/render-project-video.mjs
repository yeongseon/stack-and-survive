import { chromium } from '@playwright/test';
import { readFile, writeFile, copyFile, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const story = JSON.parse(await readFile(`${root}showcase/story.json`, 'utf8'));
const images = JSON.parse(await readFile(`${root}docs/images/capture-manifest.json`, 'utf8'));
const voice = process.argv.includes('--voice');
assert.ok(process.argv.slice(2).every(arg => arg === '--voice' || arg.startsWith('--narration-dir=')), 'Use --voice or --narration-dir=/absolute/path; the renderer now uses the deck, not a capture directory');
const narrationArgument = process.argv.find(arg => arg.startsWith('--narration-dir='));
if (narrationArgument) assert.ok(narrationArgument.slice('--narration-dir='.length).trim(), 'Narration directory must not be empty');
const narrationDirectory = narrationArgument ? resolve(narrationArgument.slice('--narration-dir='.length)) : null;
assert.ok(!(voice && narrationDirectory), 'Choose synthetic voice OR presenter recordings, not both');
if (voice) assert.equal(process.platform, 'darwin', '--voice uses an already installed macOS voice');
assert.equal(story.slides.length, 8);
assert.equal(story.slides.reduce((sum, slide) => sum + slide.duration, 0), 120);
assert.equal(images.status, 'complete'); assert.equal(images.publicScorePosts, 0);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const probe = file => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], { encoding: 'utf8' }));
const parent = `${root}test-results-submission`; await mkdir(parent, { recursive: true });
const output = await mkdtemp(`${parent}/personal-story-`);
const files = ['showcase/slides.html', 'showcase/slides.css', 'showcase/slides.js', 'showcase/story.json'];
const sourceFiles = await Promise.all(files.map(async file => ({ file, sha256: sha256(await readFile(`${root}${file}`)) })));
const toolchain = { node: process.version, platform: process.platform, chromium: '', ffmpeg: execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' }).split('\n')[0], voice: voice ? 'macOS Samantha, 155 words/minute' : narrationDirectory ? 'Presenter-supplied per-slide WAV recordings' : 'none' };
const forbidden = /LOCAL PRODUCTION CAPTURE|capture|source [a-f0-9]{7}|automated|EDIT:|not a live model demo|revolutionary|next-generation|powered by AI|unlock|seamless|reimagine/i;
const browser = await chromium.launch({ headless: true });
const segments = [], usedImages = [];
try {
  toolchain.chromium = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(new URL('../showcase/slides.html', import.meta.url).href);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); document.body.classList.add('video-mode'); });
  let elapsed = 0;
  for (const [index, slide] of story.slides.entries()) {
    await page.evaluate(id => { location.hash = `#${id}`; }, slide.id);
    const element = page.locator(`#${slide.id}`); await element.waitFor({ state: 'visible' });
    const text = await element.innerText(); assert.equal(forbidden.test(text), false, 'Audience frame contains internal or marketing labels');
    assert.equal(forbidden.test(slide.narration), false, 'Narration contains internal or marketing labels');
    const overflow = await element.evaluate(element => [...element.querySelectorAll('h1,h2,p,img,.service,.signature,.note')].some(node => {
      const r = node.getBoundingClientRect(); return r.x < 0 || r.y < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1;
    }));
    assert.equal(overflow, false, `Video slide ${slide.id} overflows`);
    await page.screenshot({ path: `${output}/slide-${index + 1}.png` });
    for (const url of await element.locator('img').evaluateAll(nodes => nodes.map(node => node.src))) {
      const file = fileURLToPath(url).slice(root.length), bytes = await readFile(new URL(url));
      const matching = images.images.find(image => file === `docs/images/${image.name}.webp`);
      assert.ok(matching && matching.sha256 === sha256(bytes), `Image provenance mismatch: ${file}`);
      if (!usedImages.some(image => image.file === file)) usedImages.push({ file, sha256: sha256(bytes) });
    }
    segments.push({ ...slide, start: elapsed, title: await element.locator('h1,h2').innerText(), visibleText: text }); elapsed += slide.duration;
  }
} finally { await browser.close(); }

const stamp = seconds => { const ms = Math.round(seconds * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const subtitles = [], transcript = [];
for (const [index, slide] of segments.entries()) {
  ffmpeg(['-loop', '1', '-i', `${output}/slide-${index + 1}.png`, '-t', String(slide.duration), '-r', '25', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', `${output}/video-${index}.mp4`]);
  if (voice || narrationDirectory) {
    let recording;
    if (voice) {
      await writeFile(`${output}/voice-${index}.txt`, slide.narration);
      recording = `${output}/voice-${index}.aiff`;
      execFileSync('say', ['-v', 'Samantha', '-r', '155', '-f', `${output}/voice-${index}.txt`, '-o', recording], { stdio: 'inherit' });
    } else recording = resolve(narrationDirectory, `slide-${index + 1}.wav`);
    slide.voiceSeconds = Number(probe(recording).format.duration);
    assert.ok(slide.voiceSeconds > 0 && slide.voiceSeconds <= slide.duration - .3, `Slide ${index + 1} voice is ${slide.voiceSeconds}s; shorten the delivery, never truncate or speed it up`);
    ffmpeg(['-i', recording, '-af', 'adelay=150,apad', '-t', String(slide.duration), '-ar', '48000', '-ac', '1', `${output}/audio-${index}.wav`]);
  }
  const sentences = slide.narration.match(/[^.!?]+[.!?]+/g) ?? [slide.narration];
  const words = sentences.reduce((sum, sentence) => sum + sentence.trim().split(/\s+/).length, 0);
  let offset = slide.start + .15;
  for (const sentence of sentences) {
    const duration = (slide.voiceSeconds ?? slide.duration - .3) * sentence.trim().split(/\s+/).length / words;
    subtitles.push(`${subtitles.length + 1}\n${stamp(offset)} --> ${stamp(offset + duration)}\n${sentence.trim()}\n`); offset += duration;
  }
  transcript.push(`## ${stamp(slide.start).slice(0, 8)}–${stamp(slide.start + slide.duration).slice(0, 8)} · ${slide.title.replaceAll('\n', ' ')}\n\n${slide.narration}\n`);
}
await writeFile(`${output}/video-list.txt`, segments.map((_, index) => `file 'video-${index}.mp4'`).join('\n'));
await writeFile(`${output}/captions.srt`, subtitles.join('\n'));
ffmpeg(['-f', 'concat', '-safe', '0', '-i', `${output}/video-list.txt`, '-c', 'copy', '-movflags', '+faststart', `${output}/silent.mp4`]);
const narrated = voice || !!narrationDirectory;
if (narrated) {
  await writeFile(`${output}/audio-list.txt`, segments.map((_, index) => `file 'audio-${index}.wav'`).join('\n'));
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', `${output}/audio-list.txt`, '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-t', '120', '-ar', '48000', '-ac', '1', `${output}/narration.wav`]);
}
const final = `${output}/project-introduction.mp4`;
ffmpeg(['-i', `${output}/silent.mp4`, ...(narrated ? ['-i', `${output}/narration.wav`] : []), '-i', `${output}/captions.srt`, '-map', '0:v', ...(narrated ? ['-map', '1:a'] : []), '-map', `${narrated ? 2 : 1}:s`, '-c:v', 'copy', ...(narrated ? ['-c:a', 'aac', '-b:a', '128k'] : []), '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-t', '120', '-movflags', '+faststart', final]);
const metadata = probe(final), video = metadata.streams.find(stream => stream.codec_type === 'video');
assert.equal(Number(metadata.format.duration), 120); assert.equal(video.nb_frames, '3000');
ffmpeg(['-i', final, '-f', 'null', '-']);
const manifest = { version: 2, story: 'Personal Azure learning experience; not a commercial or agent demonstration',
  screenshotSourceCommit: images.sourceCommit, screenshotCapturedAt: images.capturedAt, sourceFiles, usedImages,
  mode: 'Eight static annotated slides built from actual screenshots. Not live gameplay footage. No model invocation or public score submission.',
  segments, file: 'project-introduction-120s.mp4', sha256: sha256(await readFile(final)), bytes: Number(metadata.format.size), duration: 120, width: 1440, height: 900, frames: 3000,
  audio: voice ? 'Synthetic offline macOS Samantha draft narration, 155 words/minute; not the developer recording his own voice. Prefer presenter recordings for final delivery.' : narrationDirectory ? 'Presenter-supplied recordings; identity, consent and rights must be checked by the owner.' : 'Silent presentation with transcript and subtitles.',
  narrated, captions: 'Selectable English subtitles and sidecar SRT. Sentence timing is approximate; human listening and alignment review required.',
  provenance: 'Production/build/source labels intentionally appear only here and in documentation, never in audience slides or video. Hashes are integrity comparisons, not signatures.',
  toolchain, validation: 'Exact120seconds/3000frames/full decode; all voice segments fit without truncation or tempo changes. No proven learning or live AI claim.' };
const published = `${root}docs/media/`;
await copyFile(final, `${published}${manifest.file}`);
await copyFile(`${output}/captions.srt`, `${published}project-introduction-120s.srt`);
ffmpeg(['-i', `${output}/slide-1.png`, '-frames:v', '1', '-update', '1', `${published}project-introduction-preview.jpg`]);
await writeFile(`${published}project-introduction-120s.json`, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(`${published}PROJECT_INTRO_NARRATION.md`, `# Why I built Stack & Survive — 120-second narration\n\nThe same eight-slide personal story drives the deck, PDF and video. ${manifest.audio} Provenance is kept in the JSON manifest, not audience-facing frames. Rehearse in your own voice before submission.\n\n${transcript.join('\n')}`);
console.log(JSON.stringify({ output, duration: 120, bytes: manifest.bytes, slides: 8, narrated, voice: toolchain.voice }, null, 2));
