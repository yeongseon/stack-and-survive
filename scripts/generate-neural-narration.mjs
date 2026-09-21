import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = process.argv.includes('--allow-network');
assert.ok(allowed, 'Network opt-in required: --allow-network sends only showcase/story.json narration to Microsoft Edge TTS. No private text, credentials or game data.');
assert.ok(process.argv.slice(2).every(arg => arg === '--allow-network' || arg.startsWith('--cli=')), 'Usage: node scripts/generate-neural-narration.mjs --allow-network --cli=/absolute/path/to/edge-tts');
const cliArgument = process.argv.find(arg => arg.startsWith('--cli='));
assert.ok(cliArgument && cliArgument.slice(6), 'Provide the pinned edge-tts 7.2.7 CLI path');
const cli = resolve(cliArgument.slice(6));
const version = execFileSync(cli, ['--version'], { encoding: 'utf8', timeout: 10000 }).trim();
assert.match(version, /\b7\.2\.7\b/, 'Use the reviewed pinned media tool, not a new unreviewed version');
const storyBytes = await readFile(`${root}showcase/story.json`), story = JSON.parse(storyBytes);
assert.equal(story.slides.length, 8);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const parent = `${root}test-results-submission`; await mkdir(parent, { recursive: true });
const output = await mkdtemp(`${parent}/neural-narration-`);
const voice = 'en-US-GuyNeural';
const manifest = { version: 1, kind: 'synthetic', provider: 'Microsoft Edge online text-to-speech via edge-tts (third-party client, not Azure Speech provisioning)',
  voice, rate: '+0%', pitch: '+0Hz', tool: version, storySha256: hash(storyBytes), createdAt: new Date().toISOString(),
  disclosure: 'Stock neural synthetic voice; not the developer, not voice cloning. Only the public narration text is sent to the provider. Human listening, usage terms and event review remain necessary.', slides: [] };
for (const slide of story.slides) {
  assert.match(slide.id, /^slide-[1-8]$/); assert.ok(typeof slide.narration === 'string' && slide.narration.length < 1500);
  const text = `${output}/${slide.id}.txt`, mp3 = `${output}/${slide.id}.mp3`, wav = `${output}/${slide.id}.wav`;
  await writeFile(text, slide.narration);
  execFileSync(cli, ['--voice', voice, '--rate=+0%', '--pitch=+0Hz', '--file', text, '--write-media', mp3], { timeout: 90000, stdio: 'inherit' });
  const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', mp3], { encoding: 'utf8' }));
  const duration = Number(metadata.format.duration);
  assert.ok(duration > 0 && duration <= slide.duration - .3, `${slide.id}: ${duration}s exceeds ${slide.duration}s allocation; shorten the script or reallocate slide timing, never truncate or time-stretch speech`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '1', wav], { stdio: 'inherit' });
  manifest.slides.push({ id: slide.id, duration, textSha256: hash(Buffer.from(slide.narration)), wavSha256: hash(await readFile(wav)) });
  console.log(`${slide.id}: ${duration.toFixed(2)}s / ${slide.duration}s`);
}
await writeFile(`${output}/narration-source.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output, voice, slides: 8, sourceManifest: 'narration-source.json' }, null, 2));
