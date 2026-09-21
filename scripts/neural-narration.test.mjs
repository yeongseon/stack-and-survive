import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (script, args) => spawnSync(process.execPath, [`scripts/${script}`, ...args], { cwd: root, encoding: 'utf8', timeout: 10000 });
test('network synthesis requires explicit opt-in before invoking any CLI', () => {
  const result = run('generate-neural-narration.mjs', ['--cli=/does-not-exist']);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Network opt-in required/);
});
test('renderer rejects ambiguous audio sources', () => {
  const result = run('render-project-video.mjs', ['--voice', '--narration-dir=/does-not-exist']);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Choose synthetic voice OR presenter recordings/);
});
test('title cover preserves total timing and contains no spoken words', async () => {
  const story = JSON.parse(await readFile(join(root, 'showcase/story.json'), 'utf8'));
  assert.deepEqual(story.cover, { id: 'cover', duration: 2, narration: '' });
  assert.equal(story.slides.length, 8); assert.equal(story.slides[0].duration, 14);
  assert.equal(story.cover.duration + story.slides.reduce((sum, slide) => sum + slide.duration, 0), 120);
});
test('retiming rejects changed narration words before copying or processing audio', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'retiming-check-'));
  try {
    const story = JSON.parse(await readFile(join(root, 'showcase/story.json'), 'utf8'));
    const source = { version: 1, kind: 'synthetic', voice: 'en-US-GuyNeural', rate: '+0%', pitch: '+0Hz',
      slides: story.slides.map(slide => ({ id: slide.id, textSha256: 'different-words', wavSha256: 'not-read' })) };
    await writeFile(join(directory, 'narration-source.json'), JSON.stringify(source));
    const result = run('retime-neural-narration.mjs', [directory]);
    assert.notEqual(result.status, 0); assert.match(result.stderr, /Words changed: regenerate speech/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('synthetic recordings cannot use stale text or mismatched audio bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'narration-check-'));
  try {
    const storyBytes = await readFile(join(root, 'showcase/story.json'));
    const story = JSON.parse(storyBytes);
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    const source = { version: 1, kind: 'synthetic', voice: 'en-US-GuyNeural', rate: '+0%', pitch: '+0Hz', provider: 'Test fixture', storySha256: 'wrong',
      slides: story.slides.map(slide => ({ id: slide.id, textSha256: hash(Buffer.from(slide.narration)), wavSha256: 'wrong-audio' })) };
    await writeFile(join(directory, 'narration-source.json'), JSON.stringify(source));
    const stale = run('render-project-video.mjs', [`--narration-dir=${directory}`]);
    assert.notEqual(stale.status, 0); assert.match(stale.stderr, /AssertionError/);
    source.storySha256 = hash(storyBytes);
    await writeFile(join(directory, 'narration-source.json'), JSON.stringify(source));
    await writeFile(join(directory, 'slide-1.wav'), 'not a valid matching recording');
    const tampered = run('render-project-video.mjs', [`--narration-dir=${directory}`]);
    assert.notEqual(tampered.status, 0); assert.match(tampered.stderr, /wrong-audio/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
