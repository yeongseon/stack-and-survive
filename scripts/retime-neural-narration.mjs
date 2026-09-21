import { readFile, writeFile, copyFile, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.ok(process.argv[2], 'Usage: node scripts/retime-neural-narration.mjs <approved narration directory>');
const previous = resolve(process.argv[2]);
const source = JSON.parse(await readFile(`${previous}/narration-source.json`, 'utf8'));
const bytes = await readFile(`${root}showcase/story.json`), story = JSON.parse(bytes);
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(source.version, 1); assert.equal(source.kind, 'synthetic'); assert.equal(source.voice, 'en-US-GuyNeural');
assert.equal(source.rate, '+0%'); assert.equal(source.pitch, '+0Hz');
assert.equal(story.slides.length, 8); assert.equal(source.slides.length, 8);
assert.deepEqual(source.slides.map(slide => slide.id), story.slides.map(slide => slide.id));
const files = [];
for (const slide of story.slides) {
  const previousSlide = source.slides.find(item => item.id === slide.id);
  assert.equal(previousSlide.textSha256, hash(Buffer.from(slide.narration)), 'Words changed: regenerate speech instead of relabeling it');
  const file = `${previous}/${slide.id}.wav`, audio = await readFile(file);
  assert.equal(previousSlide.wavSha256, hash(audio), 'Approved audio bytes changed');
  const duration = Number(JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', file], { encoding: 'utf8' })).format.duration);
  assert.ok(duration > 0 && duration <= slide.duration - .3, 'Existing speech does not fit revised allocation');
  files.push({ id: slide.id, file });
}
const parent = `${root}test-results-submission`; await mkdir(parent, { recursive: true });
const output = await mkdtemp(`${parent}/neural-narration-retimed-`);
for (const file of files) await copyFile(file.file, `${output}/${file.id}.wav`);
await writeFile(`${output}/narration-source.json`, `${JSON.stringify({ ...source, previousStorySha256: source.storySha256,
  storySha256: hash(bytes), retimedAt: new Date().toISOString(), reuse: 'Exact approved WAV bytes and narration words preserved; only slide allocation/cover changed. No provider request or audio tempo change.' }, null, 2)}\n`);
console.log(JSON.stringify({ output, voice: source.voice, unchangedAudioFiles: 8 }, null, 2));
