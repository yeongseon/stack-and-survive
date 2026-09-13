import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootPath = 'apps/web/public/assets';
const retainedAzure = {
  'badge-app': ['app-service.svg', 'Icons/app services/10035-icon-service-App-Services.svg', '529d83fc80637a96b6d27f6cfac7536e1c5f9b1b67f58aef4e2e3d6f47fd4925'],
  'badge-sql': ['azure-sql.svg', 'Icons/databases/10130-icon-service-SQL-Database.svg', 'a26124a2b188ccf910520c935c726f7364e0f5935d7a4319ebcab9c80a40e475'],
  'badge-cache': ['managed-redis.svg', 'Icons/databases/03675-icon-service-Azure-Managed-Redis.svg', 'fa4b65d5946115084be1e842ecb934ab7f01b3019a450d19640ea3c3eaf9bab0'],
  'badge-edge': ['application-gateway.svg', 'Icons/networking/10076-icon-service-Application-Gateways.svg', '531e668e47cf61872b2811ec67dcc103cee2ecc1d272f07132d6196d68ba6c19'],
  'azure-terms': ['Microsoft_Terms_of_Use.pdf', 'Microsoft_Terms_of_Use.pdf', '983e83cef1a8f85164760b076a96df54cb50af345861cb1d8344040037d0531c'],
};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export function validateAssetManifest(manifest, root, { release = false } = {}) {
  const errors = [], warnings = [];
  const fail = message => { throw new Error(message); };
  const ensure = (condition, message) => { if (!condition) fail(message); };
  const canonicalRoot = realpathSync(root);
  const safeFile = (path, asset = false) => {
    ensure(text(path) && !isAbsolute(path) && !path.includes('\\') && !path.split('/').some(p => !p || p === '.' || p === '..'), 'Unsafe or empty local path');
    if (asset) ensure(path.startsWith(`${rootPath}/`), 'Runtime asset must be below assetRoot');
    const full = resolve(canonicalRoot, path);
    const actual = realpathSync(full);
    ensure(actual.startsWith(`${canonicalRoot}${sep}`) && actual === full, 'Symlink or escaped local path');
    ensure(lstatSync(full).isFile(), 'Expected a regular file');
    return readFileSync(full);
  };
  try {
    ensure(object(manifest) && manifest.version === 1 && manifest.assetRoot === rootPath, 'Unsupported manifest version/root');
    ensure(object(manifest.provenance) && Array.isArray(manifest.assets) && manifest.assets.length > 0 && manifest.assets.length <= 1000, 'Invalid provenance/assets collection');
  } catch (error) { return { errors: [error.message], warnings }; }
  const ids = new Set(), paths = new Set(), used = new Set();
  for (const [index, asset] of manifest.assets.entries()) {
    try {
      ensure(object(asset), 'Asset must be an object');
      ensure(text(asset.id) && /^[a-z0-9-]+$/.test(asset.id) && !ids.has(asset.id), 'Invalid or duplicate asset id'); ids.add(asset.id);
      ensure(text(asset.path) && !paths.has(asset.path), 'Missing or duplicate output path'); paths.add(asset.path);
      ensure(hash(asset.sha256) && text(asset.role), 'Missing SHA-256 or intended role');
      const bytes = safeFile(asset.path, true);
      ensure(sha(bytes) === asset.sha256, 'Output SHA-256 mismatch');
      ensure(['.png', '.svg', '.pdf', '.webp', '.ogg', '.wav', '.mp3'].some(ext => asset.path.endsWith(ext)), 'Unsupported runtime asset type');
      ensure(text(asset.provenance) && Object.hasOwn(manifest.provenance, asset.provenance), 'Unknown provenance');
      const p = manifest.provenance[asset.provenance]; used.add(asset.provenance);
      ensure(object(p) && ['original', 'external'].includes(p.origin), 'Invalid origin');
      for (const field of ['author', 'sourceUrl', 'license', 'licenseEvidence', 'reviewEvidence', 'modifications', 'reproduce', 'toolchain', 'attribution', 'restrictions']) ensure(text(p[field]), `Missing provenance ${field}`);
      ensure(new URL(p.sourceUrl).protocol === 'https:', 'Source must use HTTPS');
      safeFile(p.licenseEvidence); safeFile(p.reviewEvidence); safeFile(p.attribution);
      ensure(['approved', 'rights-pending'].includes(p.review), 'Unknown review status');
      if (p.origin === 'external') {
        ensure(text(asset.archivePath) && !asset.archivePath.startsWith('/') && !asset.archivePath.includes('\\') && !asset.archivePath.split('/').includes('..'), 'Missing or unsafe archive source path');
        ensure(hash(p.archiveSha256) && new URL(p.archiveUrl).protocol === 'https:', 'Missing pinned download archive');
        const legacy = Object.hasOwn(retainedAzure, asset.id) ? retainedAzure[asset.id] : null;
        const retained = p.license === 'LicenseRef-Microsoft-Azure-Icons' && p.review === 'rights-pending' && legacy
          && asset.path === `${rootPath}/azure-icons/${legacy[0]}` && asset.archivePath === `Azure_Public_Service_Icons/${legacy[1]}` && asset.sha256 === legacy[2]
          && p.archiveUrl === 'https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V24.zip'
          && p.archiveSha256 === '921594ccd1bf3d9c0a1bd7b6d924e050551a59342f2b353bb74bdcf761c35141';
        if (!retained) ensure(['CC0-1.0', 'CC-BY-4.0'].includes(p.license) && p.review === 'approved', 'New external asset needs reviewed CC0/CC-BY license');
      } else {
        ensure(['LicenseRef-Project-Unselected', 'CC0-1.0', 'CC-BY-4.0'].includes(p.license), 'Unsupported original license declaration');
        ensure(asset.sourcePath !== asset.path, 'Original source must be separate from output');
        ensure(hash(asset.sourceSha256) && sha(safeFile(asset.sourcePath)) === asset.sourceSha256, 'Original source SHA-256 mismatch');
        ensure(p.license !== 'LicenseRef-Project-Unselected' || p.review === 'rights-pending', 'Unselected license cannot be approved');
      }
      if (p.license === 'CC-BY-4.0') ensure(text(p.attributionText), 'CC-BY requires explicit author/source/license/modification attribution text');
      if (p.review === 'rights-pending') {
        warnings.push(`${asset.id}: rights pending; integrity success is NOT redistribution approval`);
        if (release) fail('Release requires explicit reviewed rights for every asset');
      }
      if (asset.path.endsWith('.png')) {
        ensure(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii', 12, 16) === 'IHDR', 'Invalid PNG header');
      }
      if (asset.boundsKey !== undefined) {
        ensure(text(asset.boundsKey), 'Invalid bounds key');
        const metadata = JSON.parse(safeFile('art/buildings/bounds.json').toString());
        const b = metadata[asset.boundsKey];
        ensure(object(b) && b.sha256 === asset.sha256 && b.bytes === bytes.length, 'Bounds hash/bytes mismatch');
        for (const field of ['sourceWidth', 'sourceHeight', 'left', 'top', 'width', 'height']) ensure(Number.isInteger(b[field]) && b[field] >= 0, `Invalid bounds ${field}`);
        ensure(b.width > 0 && b.height > 0 && b.sourceWidth > 0 && b.sourceHeight > 0 && b.left + b.width <= b.sourceWidth && b.top + b.height <= b.sourceHeight, 'Bounds exceed source dimensions');
        ensure(asset.path.endsWith('.png') && bytes.readUInt32BE(16) === b.sourceWidth && bytes.readUInt32BE(20) === b.sourceHeight, 'PNG dimensions disagree with bounds');
      }
    } catch (error) { errors.push(`asset[${index}] ${asset?.id ?? 'unknown'}: ${error.message}`); }
  }
  for (const key of Object.keys(manifest.provenance)) if (!used.has(key)) errors.push(`Unused provenance: ${key}`);
  const inventory = dir => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, item.name); const local = relative(canonicalRoot, path).split(sep).join('/');
      if (item.isSymbolicLink()) errors.push(`Symlink in runtime inventory: ${local}`);
      else if (item.isDirectory()) inventory(path);
      else if (local !== `${rootPath}/ATTRIBUTION.md` && !paths.has(local)) errors.push(`Unmanifested runtime file: ${local}`);
    }
  };
  try {
    const assetRoot = resolve(canonicalRoot, rootPath);
    ensure(realpathSync(assetRoot) === assetRoot && lstatSync(assetRoot).isDirectory(), 'Runtime inventory root must be a nonsymlink directory');
    inventory(assetRoot);
  } catch (error) { errors.push(`Inventory: ${error.message}`); }
  return { errors, warnings: [...new Set(warnings)] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some(a => a !== '--release')) throw new Error('Usage: node scripts/asset-manifest.mjs [--release]');
    const root = fileURLToPath(new URL('../', import.meta.url));
    const result = validateAssetManifest(JSON.parse(readFileSync(resolve(root, 'art/asset-manifest.json'), 'utf8')), root, { release: args.includes('--release') });
    for (const message of result.warnings) console.warn(`WARNING ${message}`);
    for (const message of result.errors) console.error(`ERROR ${message}`);
    if (result.errors.length) process.exitCode = 1;
    else console.log('Asset inventory and declared integrity verified; rights review is separate.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
