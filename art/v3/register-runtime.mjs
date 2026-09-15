import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { coreGeometry, facilityNames, facilitySvg, overlayNames, overlaySvg, deploymentNames, deploymentSvg } from './core-facilities.mjs';
import { environmentNames, environmentSvg } from './environment-kit.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const inventory=JSON.parse(await readFile(`${root}art/v3/dist/review-inventory.json`,'utf8'));
const manifest=JSON.parse(await readFile(`${root}art/asset-manifest.json`,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(JSON.stringify(inventory.geometry)!==JSON.stringify(coreGeometry))throw new Error('Re-export current V3 geometry first');
const files=[];
const expected=new Map([...facilityNames.map(name=>[name,facilitySvg(name)]),...[1,2,3,4].map(count=>[`app-${count}`,facilitySvg('app-service',count)]),
  ...overlayNames.flatMap(name=>name.startsWith('app-')?[0,1,2,3].map(bay=>[`${name}-${bay}`,overlaySvg(name,bay)]):[[name,overlaySvg(name)]]),
  ...deploymentNames.map(name=>[name,deploymentSvg(name)]),...environmentNames.map(name=>[`env-${name}`,environmentSvg(name)])]);
if(inventory.records.length!==expected.size||new Set(inventory.records.map(record=>record.name)).size!==expected.size)throw new Error('Incomplete or duplicate V3 export');
for(const record of inventory.records){
  if(!/^[a-z0-9-]+$/.test(record.name))throw new Error('Unsafe V3 name');
  if(!expected.has(record.name)||sha(expected.get(record.name))!==record.sourceSha256)throw new Error(`Re-export changed source ${record.name}`);
  const png=await readFile(`${root}art/v3/dist/${record.name}.png`);
  const svg=await readFile(`${root}art/v3/dist/${record.name}.svg`);
  if(sha(png)!==record.sha256||sha(svg)!==record.sourceSha256)throw new Error(`Unverified output ${record.name}`);
  files.push({record,png,svg});
}
manifest.provenance['original-v3']={origin:'original',author:'Stack & Survive project (AI-assisted original hero-facility and indoor-kit art)',sourceUrl:'https://github.com/yeongseon/stack-and-survive',license:'LicenseRef-Project-Unselected',licenseEvidence:'art/v3/PROVENANCE.md',review:'rights-pending',reviewEvidence:'docs/PAGES_DEMO_EXCEPTION.md',modifications:'Original editable geometry rasterized to transparent PNG; no third-party game artwork or Azure icon paths embedded.',reproduce:'node art/v3/export-review.mjs && node art/v3/register-runtime.mjs',toolchain:'Node22; Playwright1.63 Chromium; 640x640 DPR1 PNG; exact exported bytes reviewed before release.',attribution:'apps/web/public/assets/ATTRIBUTION.md',restrictions:'Owner explicitly expanded the existing Pages demo exception to original V3 assets. No general project art license, Microsoft permission or employer/IP clearance is inferred; issue164 remains open.'};
manifest.assets=manifest.assets.filter(asset=>asset.provenance!=='original-v3');
for(const {record} of files)manifest.assets.push({id:`v3-${record.name}`,path:`apps/web/public/assets/v3/${record.name}.png`,sha256:record.sha256,provenance:'original-v3',sourcePath:`art/v3/sources/${record.name}.svg`,sourceSha256:record.sourceSha256,role:`Original V3 ${record.name}; renderer selects from authoritative state`});
// Register the approved inventory before introducing runtime files; do not auto-approve future byte changes.
await writeFile(`${root}art/asset-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
await mkdir(`${root}art/v3/sources`,{recursive:true});await mkdir(`${root}apps/web/public/assets/v3`,{recursive:true});
for(const {record,png,svg} of files){await writeFile(`${root}art/v3/sources/${record.name}.svg`,svg);await writeFile(`${root}apps/web/public/assets/v3/${record.name}.png`,png);}
await writeFile(`${root}art/v3/runtime-inventory.json`,JSON.stringify({geometry:coreGeometry,records:inventory.records},null,2)+'\n');
console.log(JSON.stringify({registered:files.length,manifestSha256:sha(await readFile(`${root}art/asset-manifest.json`)),review:'rights-pending; demo exception only'}));
