import assert from 'node:assert/strict';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = process.argv[2];
assert.ok(directory, 'Usage: node scripts/publish-tradeoff.mjs <successful capture directory>');
const manifest = JSON.parse(await readFile(resolve(directory, 'capture-manifest.json'), 'utf8'));
assert.equal(manifest.status, 'complete'); assert.deepEqual(manifest.errors, []); assert.equal(manifest.leaderboardPosts, 0);
const movie = resolve(directory, 'tradeoff.mp4');
assert.equal(createHash('sha256').update(await readFile(movie)).digest('hex'), manifest.movie.sha256);
const target = fileURLToPath(new URL('../docs/media/', import.meta.url));
await copyFile(movie, `${target}scaling-tradeoff.mp4`);
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '34', '-i', movie, '-frames:v', '1', '-update', '1', `${target}scaling-tradeoff-preview.jpg`], { stdio: 'inherit' });
await writeFile(`${target}scaling-tradeoff.json`, `${JSON.stringify({ ...manifest, rawVideo: basename(manifest.rawVideo), movie: { ...manifest.movie, file: 'scaling-tradeoff.mp4' },
  captureWorkspaceNote: 'Source commit names the runtime; see dirtyTree and bundle hashes for capture identity. This is a locally built candidate, not proof of deployment.',
}, null, 2)}\n`);
console.log('Published verified capture to docs/media; no remote upload or game asset change.');
