import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateAssetManifest } from './asset-manifest.mjs';
import '../art/v3/check-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bytes = readFileSync(new URL('../art/asset-manifest.json', import.meta.url));
const approved = '0c4b7e818db39b6528223bc6dabc95ab496d1fbc6ac1343cc07879a42ded5d89';
if (createHash('sha256').update(bytes).digest('hex') !== approved) throw new Error('Pages demo exception does not cover this asset manifest. Obtain explicit review; do not bypass.');
const result = validateAssetManifest(JSON.parse(bytes.toString()), root);
if (result.errors.length) throw new Error(result.errors.join('\n'));
console.warn('OWNER-DIRECTED DEMO EXCEPTION ONLY. Asset rights remain pending; general release is NOT approved.');
console.log('Existing demo inventory verified against explicit exception. See docs/PAGES_DEMO_EXCEPTION.md.');
