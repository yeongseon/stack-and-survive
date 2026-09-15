import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { facilityNames, facilitySvg, overlayNames, overlaySvg, deploymentNames, deploymentSvg, coreGeometry } from './core-facilities.mjs';

const root=fileURLToPath(new URL('./',import.meta.url));
const webRequire=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {createServer}=await import(webRequire.resolve('vite'));
const inventory=JSON.parse(await readFile(`${root}/dist/review-inventory.json`,'utf8'));
const expected=new Map([...facilityNames.map(name=>[name,facilitySvg(name)]),...[1,2,3,4].map(count=>[`app-${count}`,facilitySvg('app-service',count)]),
  ...overlayNames.flatMap(name=>name.startsWith('app-')?[0,1,2,3].map(bay=>[`${name}-${bay}`,overlaySvg(name,bay)]):[[name,overlaySvg(name)]]),
  ...deploymentNames.map(name=>[name,deploymentSvg(name)])]);
assert.equal(inventory.records.length,expected.size,'Run export-review.mjs before reviewing');
assert.equal(new Set(inventory.records.map(record=>record.name)).size,expected.size,'Duplicate export entries');
assert.deepEqual(inventory.geometry,coreGeometry,'Export geometry differs from current source');
for(const record of inventory.records){
  assert.ok(expected.has(record.name),'Unexpected export name');
  assert.equal(record.sourceSha256,createHash('sha256').update(expected.get(record.name)).digest('hex'),`Export is stale against current generator: ${record.name}`);
  for(const [extension,key] of [['png','sha256'],['svg','sourceSha256']]){
    const content=await readFile(`${root}/dist/${record.name}.${extension}`);
    assert.equal(createHash('sha256').update(content).digest('hex'),record[key],`Stale or altered review asset: ${record.name}.${extension}`);
  }
}
await mkdir(`${root}/dist/evidence`,{recursive:true});
const server=await createServer({root,configFile:false,server:{host:'127.0.0.1',port:0}});
let browser;
try {
  await server.listen();
  const address=server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const base=`http://127.0.0.1:${address.port}`;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  page.on('console',message=>{if(message.type()==='error')failures.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`);});
  page.on('requestfailed',request=>failures.push(`${request.url()} ${request.failure()?.errorText}`));
  const decoded=()=>page.locator('.facility img').evaluateAll(async images=>{await Promise.all(images.map(image=>image.decode()));return images.every(image=>image.naturalWidth===640&&image.naturalHeight===640);});
  for(const width of [1440,390,1920]) {
    await page.setViewportSize({width,height:width===390?844:900});
    await page.goto(`${base}/scene.html?raster=1`);
    assert.equal(await page.locator('.facility').count(),5);
    assert.ok(await decoded(),'Every raster must decode at its exported size');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal review overflow');
    await page.screenshot({path:`${root}/dist/evidence/scene-${width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Hide labels',exact:true}).click();
    assert.ok(await page.locator('figcaption').evaluateAll(labels=>labels.every(label=>getComputedStyle(label).visibility==='hidden')));
    await page.screenshot({path:`${root}/dist/evidence/silhouettes-${width}.png`,fullPage:true});
    for(const count of [1,2,3,4]) {
      await page.locator('#modules').selectOption(String(count));
      for(const state of ['normal','build','read','write']) {
        await page.locator('#state').selectOption(state);
        assert.ok(await decoded());
        const paths=await page.locator('[data-facility="app-service"] img').evaluateAll(images=>images.map(image=>new URL(image.src).pathname.split('/').at(-1)));
        assert.equal(paths[0],`app-${count}.png`);
        assert.equal(paths.includes(`app-construction-${count}.png`),state==='build'&&count<4);
        assert.equal(paths.length,1+Math.max(0,4-count));
      }
    }
    await page.locator('#modules').selectOption('2');await page.locator('#state').selectOption('build');await decoded();
    await page.screenshot({path:`${root}/dist/evidence/construction-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`${base}/preview.html`);
  await page.locator('figure img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  assert.equal(await page.locator('figure').count(),25);
  assert.equal(await page.locator('[id]').evaluateAll(elements=>new Set(elements.map(e=>e.id)).size===elements.length),true);
  await page.screenshot({path:`${root}/dist/evidence/source-and-state-sheet.png`,fullPage:true});
  assert.deepEqual(failures,[]);
  console.log(JSON.stringify({rasters:41,figures:25,widths:[1440,390,1920],stateCases:48,errors:failures,evidence:`${root}/dist/evidence`,humanAcceptance:'not performed'}));
} finally {try {await browser?.close();} finally {await server.close();}}
