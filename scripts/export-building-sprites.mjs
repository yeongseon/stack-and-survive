import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../apps/web/public/assets/buildings/', import.meta.url));
const sources = fileURLToPath(new URL('../art/buildings/', import.meta.url));
const polygon = (points, fill, stroke = '#7794a7') => `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>`;
const box = (x, y, w, d, h, top = 'url(#roof)', front = 'url(#metal)', side = 'url(#side)') => [
  polygon(`${x},${y-h} ${x+w},${y+w*.42-h} ${x+w-d},${y+(w+d)*.42-h} ${x-d},${y+d*.42-h}`, top),
  polygon(`${x-d},${y+d*.42-h} ${x+w-d},${y+(w+d)*.42-h} ${x+w-d},${y+(w+d)*.42} ${x-d},${y+d*.42}`, front),
  polygon(`${x+w-d},${y+(w+d)*.42-h} ${x+w},${y+w*.42-h} ${x+w},${y+w*.42} ${x+w-d},${y+(w+d)*.42}`, side),
].join('');
const light = (x, y, w, color) => `<rect x="${x}" y="${y}" width="${w}" height="3" rx="1" fill="${color}"/><rect x="${x-1}" y="${y-1}" width="${w+2}" height="5" rx="2" fill="${color}" opacity=".13"/>`;
const bolts = (x, y, count, step) => Array.from({ length: count }, (_, i) => `<circle cx="${x}" cy="${y+i*step}" r="1.8" fill="#d1dce2"/><circle cx="${x+.5}" cy="${y+i*step+.5}" r=".7" fill="#465a6b"/>`).join('');
const rack = (x,y,w,h,color='#5bc8ff') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#112a40" stroke="#7594ac"/>${Array.from({length:5},(_,i)=>`<path d="M${x+3} ${y+5+i*(h-8)/5}h${w-6}" stroke="#42617c"/>${light(x+w-7,y+3+i*(h-8)/5,3,color)}`).join('')}`;
const fan = (x,y,r) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.46}" fill="#243c50" stroke="#b7c5ca" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="${r*.65}" ry="${r*.3}" fill="none" stroke="#7893a2"/><path d="M${x-r*.65} ${y}h${r*1.3}M${x} ${y-r*.3}v${r*.6}" stroke="#7893a2"/>`;
const defs = `<defs>
<linearGradient id="roof" x2="1" y2="1"><stop stop-color="#e4eced"/><stop offset=".45" stop-color="#acbfc8"/><stop offset="1" stop-color="#829aaa"/></linearGradient>
<linearGradient id="metal" x2="0" y2="1"><stop stop-color="#abc0d0"/><stop offset=".4" stop-color="#5c7c95"/><stop offset="1" stop-color="#34526c"/></linearGradient>
<linearGradient id="side" x2="1" y2="1"><stop stop-color="#496f8a"/><stop offset="1" stop-color="#183c5c"/></linearGradient>
<linearGradient id="cylinder"><stop stop-color="#344f73"/><stop offset=".32" stop-color="#a1bfd6"/><stop offset=".55" stop-color="#678faf"/><stop offset="1" stop-color="#243e64"/></linearGradient>
<linearGradient id="memory"><stop stop-color="#183e4e"/><stop offset=".5" stop-color="#3a9c9d"/><stop offset="1" stop-color="#195664"/></linearGradient>
</defs>`;
const app = box(125,145,58,56,20) + box(123,130,46,42,73)
  + box(126,55,31,29,16) + fan(129,39,14)
  + rack(88,91,23,44) + rack(119,104,22,37)
  + bolts(79,85,4,17) + bolts(151,97,4,17)
  + light(90,78,38,'#81d4ff') + light(122,149,22,'#b4f2ff')
  + `<path d="M159 87v43l-11 5" stroke="#d1a750" stroke-width="3" fill="none"/><path d="M164 88v46l-14 6" stroke="#1e344b" stroke-width="3" fill="none"/>`
  + box(178,145,14,12,33) + rack(169,122,12,25);
const module = box(128,142,35,30,9) + box(128,127,27,22,46) + fan(132,78,9)
  + rack(108,96,23,34) + bolts(103,94,3,12) + light(112,90,18,'#82cfff');
const sql = box(128,153,57,57,15)
  + `<ellipse cx="128" cy="155" rx="43" ry="20" fill="#263b57"/>`
  + [0,1,2].map(i=>{const y=144-i*31;return `<path d="M86 ${y-29}v27c0 11 84 11 84 0v-27Z" fill="url(#cylinder)" stroke="#708ca8"/><ellipse cx="128" cy="${y-29}" rx="42" ry="18" fill="url(#roof)" stroke="#b3cada"/><path d="M88 ${y-3}c10 14 70 14 80 0" fill="none" stroke="#79c6ff" stroke-width="3"/><path d="M95 ${y-24}v15M104 ${y-22}v15" stroke="#d7edfa" opacity=".65"/>`;}).join('')
  + `<ellipse cx="128" cy="52" rx="28" ry="12" fill="#244867" stroke="#87d4ff" stroke-width="3"/><ellipse cx="128" cy="52" rx="17" ry="7" fill="#98e7ff"/>`
  + bolts(86,63,5,20) + box(175,141,14,12,39) + rack(167,112,11,30,'#a4c4ff');
const redis = box(128,150,53,48,14,'#abdbd6','url(#metal)','url(#side)')
  + [0,1,2].map(i=>box(100+i*27,117+i*9,20,25,37,'#b6f2df','url(#memory)','#24646c')+light(82+i*27,93+i*9,23,'#71ffdd')+rack(80+i*27,105+i*9,15,20,'#68efca')).join('')
  + `<path d="M81 154l46 18 48-16" stroke="#50d9c3" stroke-width="4" fill="none"/>` + bolts(88,135,2,9);
const edge = box(129,154,65,64,12)
  + box(82,132,20,18,67) + box(169,132,20,18,67)
  + box(88,65,91,17,16,'#e1dbc6','#a59e8b','#655f56')
  + rack(66,83,14,47,'#f4ce75') + rack(153,96,14,40,'#f4ce75')
  + light(78,59,75,'#b8e0f2') + `<path d="M102 130l28 11 25-10" fill="none" stroke="#efc56e" stroke-width="4"/>`
  + `<path d="M102 153l27 11 28-10M105 161l24 10 27-10" fill="none" stroke="#a4c5d1" stroke-width="2"/>`
  + bolts(62,83,4,13) + bolts(185,100,3,14);

await mkdir(target, { recursive: true }); await mkdir(sources, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 2 });
  const manifest = {};
  for (const [name, artwork] of Object.entries({ 'app-service': app, 'app-module': module, 'azure-sql': sql, redis, 'protected-edge': edge })) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${defs}${artwork}</svg>`;
    await writeFile(`${sources}/${name}.svg`, svg);
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.locator('svg').screenshot({ path: `${target}/${name}.png`, omitBackground: true, animations: 'disabled' });
    manifest[name] = await page.evaluate(async source => {
      const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 512, 512);
      const pixels = context.getImageData(0, 0, 512, 512).data;
      let left = 512, top = 512, right = -1, bottom = -1;
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        if (pixels[(y * 512 + x) * 4 + 3] > 0) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
      if (right < 0) throw new Error('Empty sprite');
      return { sourceWidth: 512, sourceHeight: 512, left, top, width: right - left + 1, height: bottom - top + 1 };
    }, svg);
    const png = await readFile(`${target}/${name}.png`);
    manifest[name].bytes = png.length;
    manifest[name].sha256 = createHash('sha256').update(png).digest('hex');
    console.log(`Exported ${name}.png (512x512 transparent PNG from original 256-unit SVG)`);
  }
  await writeFile(`${sources}/bounds.json`, `${JSON.stringify(manifest, null, 2)}\n`);
} finally { await browser.close(); }
