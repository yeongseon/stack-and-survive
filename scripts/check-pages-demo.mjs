import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateAssetManifest } from './asset-manifest.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bytes = readFileSync(new URL('../art/asset-manifest.json', import.meta.url));
const approved = '890384dc95525752b9d61d9ecc176746ca3e1d892b0862681308a1be4815c3b1';
if (createHash('sha256').update(bytes).digest('hex') !== approved) throw new Error('Pages demo exception does not cover this asset manifest. Obtain explicit review; do not bypass.');
const result = validateAssetManifest(JSON.parse(bytes.toString()), root);
if (result.errors.length) throw new Error(result.errors.join('\n'));
console.warn('OWNER-DIRECTED DEMO EXCEPTION ONLY. Asset rights remain pending; general release is NOT approved.');
console.log('Existing demo inventory verified against explicit exception. See docs/PAGES_DEMO_EXCEPTION.md.');
