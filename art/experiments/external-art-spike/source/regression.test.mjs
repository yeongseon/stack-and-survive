import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const art = new URL('../../../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'external-art-regression-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await cp(art, join(directory, 'art'), { recursive: true,
    filter: path => !path.includes('/v3') && !path.includes('/buildings') });
  return { art: join(directory, 'art'), experiment: join(directory, 'art/experiments/external-art-spike') };
}
const childEnvironment = { ...process.env };
delete childEnvironment.NODE_TEST_CONTEXT;
const runVerifier = root => spawnSync(process.execPath, ['--test', join(root.experiment, 'source/verify.mjs')], { encoding: 'utf8', env: childEnvironment });
const runEvidence = root => spawnSync('uv', ['run', '--with', 'Pillow==11.3.0', 'python', '-O', join(root.experiment, 'source/evidence.py')], { encoding: 'utf8' });

test('modified colormap bytes fail the real provenance verifier', async t => {
  const root = await fixture(t);
  await writeFile(join(root.art, 'candidates/external/kenney-factory/selected/Textures/colormap.png'), 'altered texture');
  const result = runVerifier(root);
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
});

test('wrong capture height fails even when PNG headers and hashes match metadata', async t => {
  const root = await fixture(t);
  const metadata = join(root.experiment, 'comparison/captures.json');
  const captures = JSON.parse(await readFile(metadata, 'utf8'));
  const capture = captures[0];
  capture.viewport.height += 1;
  for (const side of ['current', 'proposed']) {
    const path = join(root.experiment, 'comparison', capture[side]);
    const bytes = await readFile(path);
    bytes.writeUInt32BE(capture.viewport.height, 20);
    await writeFile(path, bytes);
    capture[`${side}Sha256`] = sha(bytes);
  }
  await writeFile(metadata, JSON.stringify(captures));
  const result = runVerifier(root);
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
});

test('wrong overlay dimensions fail even when overlay hashes are repinned', async t => {
  const root = await fixture(t);
  const path = join(root.experiment, 'renders/environment/external-overlay.png');
  const bytes = await readFile(path);
  bytes.writeUInt32BE(1200, 16);
  await writeFile(path, bytes);
  const metadata = join(root.experiment, 'comparison/captures.json');
  const captures = JSON.parse(await readFile(metadata, 'utf8'));
  for (const capture of captures) capture.overlaySha256 = sha(bytes);
  await writeFile(metadata, JSON.stringify(captures));
  const result = runVerifier(root);
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
});

test('optimized Python rejects stale screenshot hashes before producing a board', async t => {
  const root = await fixture(t);
  const metadata = join(root.experiment, 'comparison/captures.json');
  const captures = JSON.parse(await readFile(metadata, 'utf8'));
  captures[0].currentSha256 = '0'.repeat(64);
  await writeFile(metadata, JSON.stringify(captures));
  const result = runEvidence(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /hash mismatch/i);
});

test('optimized Python rejects capture viewport mismatch', async t => {
  const root = await fixture(t);
  const metadata = join(root.experiment, 'comparison/captures.json');
  const captures = JSON.parse(await readFile(metadata, 'utf8'));
  captures[0].viewport.width = 1200;
  await writeFile(metadata, JSON.stringify(captures));
  const result = runEvidence(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /dimension mismatch/i);
});

test('acquisition records the execution clock as local archive verification time', async t => {
  const root = await fixture(t);
  const code = `import datetime, runpy, sys
class Clock(datetime.datetime):
    @classmethod
    def now(cls, tz=None):
        return cls(2031, 2, 3, 4, 5, 6, tzinfo=datetime.timezone.utc)
datetime.datetime = Clock
sys.argv = [sys.argv[1], sys.argv[2]]
runpy.run_path(sys.argv[0], run_name='__main__')`;
  const archiveRoot = process.env.ART_ARCHIVE_DIR;
  assert.ok(archiveRoot, 'Set ART_ARCHIVE_DIR to the directory holding the three hash-pinned ZIPs');
  const result = spawnSync('uv', ['run', '--python', '3.11', 'python', '-c', code,
    join(root.experiment, 'source/acquire.py'), archiveRoot], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const receipt = JSON.parse(await readFile(join(root.experiment, 'source/acquisition.json'), 'utf8'));
  assert.equal(receipt.verifiedAt, '2031-02-03T04:05:06+00:00');
  assert.equal(receipt.verification, 'local-archive-sha256');
});
