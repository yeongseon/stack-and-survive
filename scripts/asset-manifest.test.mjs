import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateAssetManifest } from './asset-manifest.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'stack-assets-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, content) => { mkdirSync(dirname(resolve(root, path)), { recursive: true }); writeFileSync(resolve(root, path), content); };
  const bytes = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>';
  put('apps/web/public/assets/props/rack.svg', bytes);
  put('apps/web/public/assets/ATTRIBUTION.md', 'Fixture attribution only; not a real imported asset.');
  put('art/licenses/fixture.txt', 'Fixture license text for tests only.');
  put('art/reviews/fixture.md', 'Fixture approval record for tests only.');
  const manifest = { version: 1, assetRoot: 'apps/web/public/assets', provenance: { fixture: {
    origin: 'external', author: 'Test fixture', sourceUrl: 'https://example.com/rack',
    archiveUrl: 'https://example.com/rack.zip', archiveSha256: 'a'.repeat(64),
    license: 'CC0-1.0', licenseEvidence: 'art/licenses/fixture.txt', review: 'approved', reviewEvidence: 'art/reviews/fixture.md',
    modifications: 'None', reproduce: 'fixture only, no executable command', toolchain: 'node fixture',
    attribution: 'apps/web/public/assets/ATTRIBUTION.md', restrictions: 'Test fixture, not a rights assertion',
  } }, assets: [{ id: 'rack', path: 'apps/web/public/assets/props/rack.svg', sha256: digest(bytes), provenance: 'fixture', archivePath: 'rack.svg', role: 'Background rack' }] };
  return { root, put, manifest, bytes };
}
test('current inventory passes integrity but explicitly fails release rights readiness', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const manifest = JSON.parse(readFileSync(resolve(root, 'art/asset-manifest.json'), 'utf8'));
  const integrity = validateAssetManifest(manifest, root);
  assert.deepEqual(integrity.errors, []); assert.equal(integrity.warnings.length, 10);
  assert.equal(validateAssetManifest(manifest, root, { release: true }).errors.length, 10);
});
test('accepts a reviewed free asset declaration without network or execution', t => {
  const { root, manifest } = fixture(t);
  assert.deepEqual(validateAssetManifest(manifest, root, { release: true }), { errors: [], warnings: [] });
});
test('rejects unreviewed, paid, unknown or malformed new external provenance', t => {
  const { root, manifest } = fixture(t);
  for (const patch of [{ license: 'paid-pack' }, { license: 'CC-BY-NC-4.0' }, { review: 'rights-pending' }, { author: '' }, { sourceUrl: 'http://example.com' }, { archiveSha256: 'bad' }, { reviewEvidence: '../outside' }]) {
    const changed = structuredClone(manifest); Object.assign(changed.provenance.fixture, patch);
    assert.ok(validateAssetManifest(changed, root).errors.length > 0, JSON.stringify(patch));
  }
  for (const invalid of [null, [], {}, { ...manifest, version: 2 }, { ...manifest, assets: [null] }]) assert.ok(validateAssetManifest(invalid, root).errors.length > 0);
});
test('CC-BY needs explicit attribution as well as local rights evidence', t => {
  const { root, manifest } = fixture(t); manifest.provenance.fixture.license = 'CC-BY-4.0';
  assert.match(validateAssetManifest(manifest, root).errors.join(), /CC-BY/);
  manifest.provenance.fixture.attributionText = 'Test Author, https://example.com/rack, CC-BY-4.0, unchanged';
  assert.deepEqual(validateAssetManifest(manifest, root).errors, []);
});
test('finds hash drift, missing outputs and unmanifested runtime files', t => {
  const { root, manifest, put } = fixture(t);
  put(manifest.assets[0].path, 'changed');
  assert.match(validateAssetManifest(manifest, root).errors.join(), /SHA-256 mismatch/);
  rmSync(resolve(root, manifest.assets[0].path));
  assert.ok(validateAssetManifest(manifest, root).errors.length > 0);
  put('apps/web/public/assets/props/unreviewed.svg', '<svg/>');
  assert.match(validateAssetManifest(manifest, root).errors.join(), /Unmanifested runtime file/);
});
test('rejects duplicate IDs, duplicate paths, traversal and symlinks', t => {
  const { root, manifest } = fixture(t);
  let changed = structuredClone(manifest); changed.assets.push({ ...changed.assets[0] });
  assert.match(validateAssetManifest(changed, root).errors.join(), /duplicate asset id/);
  changed = structuredClone(manifest); changed.assets.push({ ...changed.assets[0], id: 'another' });
  assert.match(validateAssetManifest(changed, root).errors.join(), /duplicate output path/);
  for (const path of ['../outside.svg', '/tmp/private.svg', 'apps/web/public/assets/../outside.svg', 'apps\\web\\public\\assets\\x.svg']) {
    changed = structuredClone(manifest); changed.assets[0].path = path;
    assert.ok(validateAssetManifest(changed, root).errors.length > 0);
  }
  symlinkSync(resolve(root, 'art/licenses/fixture.txt'), resolve(root, 'apps/web/public/assets/alias.svg'));
  assert.match(validateAssetManifest(manifest, root).errors.join(), /Symlink/);
});
test('original assets pin editable source bytes and unselected rights cannot be approved', t => {
  const { root, manifest, put, bytes } = fixture(t); const p = manifest.provenance.fixture;
  Object.assign(p, { origin: 'original', license: 'LicenseRef-Project-Unselected', review: 'rights-pending' });
  Object.assign(manifest.assets[0], { sourcePath: 'art/rack.svg', sourceSha256: digest(bytes) }); put('art/rack.svg', bytes);
  assert.deepEqual(validateAssetManifest(manifest, root).errors, []);
  put('art/rack.svg', 'changed'); assert.match(validateAssetManifest(manifest, root).errors.join(), /source SHA-256/);
  put('art/rack.svg', bytes); p.review = 'approved'; assert.match(validateAssetManifest(manifest, root).errors.join(), /Unselected license/);
});
test('validates PNG header dimensions and alpha-bound metadata against output', t => {
  const { root, manifest, put } = fixture(t);
  rmSync(resolve(root, manifest.assets[0].path));
  const bytes = Buffer.alloc(24); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.write('IHDR', 12); bytes.writeUInt32BE(16, 16); bytes.writeUInt32BE(16, 20);
  Object.assign(manifest.assets[0], { path: 'apps/web/public/assets/props/rack.png', sha256: digest(bytes), boundsKey: 'rack' });
  put(manifest.assets[0].path, bytes);
  const bounds = { rack: { sha256: digest(bytes), bytes: bytes.length, sourceWidth: 16, sourceHeight: 16, left: 0, top: 0, width: 16, height: 16 } };
  put('art/buildings/bounds.json', JSON.stringify(bounds)); assert.deepEqual(validateAssetManifest(manifest, root).errors, []);
  bounds.rack.width = 17; put('art/buildings/bounds.json', JSON.stringify(bounds));
  assert.match(validateAssetManifest(manifest, root).errors.join(), /Bounds exceed/);
});
test('existing Microsoft retention exception cannot grandfather arbitrary new assets', t => {
  const { root, manifest } = fixture(t);
  Object.assign(manifest.provenance.fixture, { license: 'LicenseRef-Microsoft-Azure-Icons', review: 'rights-pending' });
  assert.match(validateAssetManifest(manifest, root).errors.join(), /New external asset/);
});
test('retained Azure identity binds exact ID archive member and pinned archive', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const manifest = JSON.parse(readFileSync(resolve(root, 'art/asset-manifest.json'), 'utf8'));
  for (const change of [m => { m.assets[5].id = 'another-badge'; }, m => { m.assets[5].archivePath = 'other.svg'; }, m => { m.provenance['azure-v24'].archiveSha256 = 'a'.repeat(64); }]) {
    const changed = structuredClone(manifest); change(changed);
    assert.match(validateAssetManifest(changed, root).errors.join(), /New external asset/);
  }
});
test('rejects symlinked inventory root before walking outside declared asset tree', t => {
  const { root, manifest } = fixture(t);
  rmSync(resolve(root, 'apps/web/public/assets'), { recursive: true });
  symlinkSync(resolve(root, 'art'), resolve(root, 'apps/web/public/assets'), 'dir');
  assert.match(validateAssetManifest(manifest, root).errors.join(), /inventory root must be a nonsymlink/);
});
