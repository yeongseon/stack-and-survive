import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { facilityNames, facilitySvg, overlayNames, overlaySvg, deploymentNames, deploymentSvg, coreGeometry } from './core-facilities.mjs';
import { environmentNames, environmentSvg } from './environment-kit.mjs';

const output = fileURLToPath(new URL('./dist/', import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 1 });
  const records = [];
  const entries = [...facilityNames.map(name => [name, facilitySvg(name)]), ...[1,2,3,4].map(count => [`app-${count}`, facilitySvg('app-service', count)]),
    ...overlayNames.flatMap(name=>name.startsWith('app-')?[0,1,2,3].map(bay=>[`${name}-${bay}`,overlaySvg(name,bay)]):[[name,overlaySvg(name)]]),
    ...deploymentNames.map(name=>[name,deploymentSvg(name)]),...environmentNames.map(name=>[`env-${name}`,environmentSvg(name)])];
  for (const [name, source] of entries) {
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${source}`);
    const bounds = await page.locator('svg > g').evaluate(group => {
      const b = group.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height };
    });
    if (bounds.x < 2 || bounds.y < 2 || bounds.x + bounds.width > 638 || bounds.y + bounds.height > 638) throw new Error(`${name}: art exceeds safe raster bounds`);
    const png = await page.locator('svg').screenshot({ omitBackground: true });
    const alpha = await page.evaluate(async data => {
      const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let visible = 0, transparent = 0;
      for (let i = 3; i < pixels.length; i += 4) { if (pixels[i]) visible++; else transparent++; }
      return { width: image.width, height: image.height, visible, transparent };
    }, png.toString('base64'));
    if (!alpha.visible || !alpha.transparent || alpha.width !== 640 || alpha.height !== 640) throw new Error(`${name}: invalid transparent raster`);
    await writeFile(`${output}/${name}.svg`, source);
    await writeFile(`${output}/${name}.png`, png);
    records.push({ name, bounds, ...alpha, bytes: png.length, sha256: createHash('sha256').update(png).digest('hex'), sourceSha256: createHash('sha256').update(source).digest('hex') });
  }
  await writeFile(`${output}/review-inventory.json`, JSON.stringify({ status: 'source-study-not-runtime-approved', geometry: coreGeometry, records }, null, 2) + '\n');
  console.log(JSON.stringify({ output, rasters: records.length, dimensions: '640x640', transparent: true, status: 'source study only; runtime manifest unchanged' }));
} finally { await browser.close(); }
