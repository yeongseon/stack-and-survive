import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const web=fileURLToPath(new URL('../../apps/web/',import.meta.url));
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {createServer}=await import(require.resolve('vite'));
const evidence=fileURLToPath(new URL('./dist/playable-evidence/',import.meta.url));
await mkdir(evidence,{recursive:true});
const server=await createServer({root:web,mode:'art-preview',server:{host:'127.0.0.1',port:43878,strictPort:true}});
let browser;
try {
  await server.listen();
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>errors.push(request.url()));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  const surface=page.locator('[data-renderer="ready"]');
  const step=page.getByRole('button',{name:'Step one tick',exact:true});
  const visual=async()=>JSON.parse(await surface.getAttribute('data-resource-states'));
  const layers=async()=>JSON.parse(await surface.getAttribute('data-v3-sprites'));
  const waitState=fn=>page.waitForFunction(fn);
  const shot=async name=>{await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${evidence}${name}.png`});};
  async function start(){
    await page.goto('http://127.0.0.1:43878/');
    await page.getByRole('button',{name:'Start Game',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.tycoon-header button:last-child')?.disabled);
    const skip=page.getByRole('button',{name:'Skip guide',exact:true});if(await skip.isVisible())await skip.click();
    await page.getByText('Tycoon QA',{exact:true}).click();await step.click();
  }
  async function advanceTo(time){while(Number(await page.getByTestId('elapsed').textContent())<time)await step.click();}
  async function build(id){
    await page.evaluate(()=>window.scrollTo(0,0));
    const targets=JSON.parse(await surface.getAttribute('data-world-targets'));
    const target=targets.find(item=>item.id===id);assert.ok(target,`Missing physical target ${id}`);
    await page.locator('canvas').click({position:{x:target.x,y:target.y}});
    await page.getByRole('button',{name:'Confirm expansion',exact:true}).click();
  }
  await start();
  await shot('baseline-1440');
  for(const target of ['cache','edge','app-bay'])await build(target);
  await step.click();
  await waitState(()=>JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).cache.lifecycle==='provisioning');
  assert.equal((await layers()).layers.filter(item=>item.key.startsWith('compute-module-')).length,1);
  await shot('construction-1440');
  for(let i=0;i<9;i++)await step.click();
  await waitState(()=>JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).app.bays.filter(b=>b==='active').length===2);
  assert.equal((await layers()).layers.filter(item=>item.key.startsWith('compute-module-')).length,2);
  await shot('active-1440');
  const conceal=await page.addStyleTag({content:'.tycoon-header,.game-hud,.facility-plaques,.world-service-badges,.business-feedback,.player-camera-controls{visibility:hidden!important}'});
  await shot('active-no-text-1440');await conceal.evaluate(el=>el.remove());
  await start();await advanceTo(31);
  await waitState(()=>JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).app.pressure==='overcapacity');
  await shot('app-overload-1440');
  await start();
  for(let i=0;i<3;i++){await build('app-bay');for(let n=0;n<9;n++)await step.click();}
  await advanceTo(90);
  await waitState(()=>JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).sql.readPressure==='overcapacity');
  assert.equal((await visual()).sql.writePressure,'healthy');
  assert.ok((await layers()).layers.some(item=>item.key==='database-read'));
  assert.ok(!(await layers()).layers.some(item=>item.key==='database-write'||item.key==='database-critical'));
  await shot('sql-read-pressure-1440');
  await build('edge');for(let i=0;i<6;i++)await step.click();
  await waitState(()=>JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).edge.showFilterEffect);
  assert.ok((await layers()).layers.some(item=>item.key==='edge-filter'));
  await shot('edge-filter-1440');
  await page.getByRole('button',{name:'Ⅱ Pause',exact:true}).click();
  await waitState(()=>!JSON.parse(document.querySelector('[data-resource-states]').dataset.resourceStates).live);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:844,height:390});await shot('landscape-paused-844');
  await page.getByRole('button',{name:'Fit architecture',exact:true}).click();await shot('landscape-fit-844');
  assert.ok(!(await layers()).layers.some(item=>item.key==='edge-filter'));
  await page.setViewportSize({width:1920,height:1080});await shot('fit-1920');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({actualGame:true,physicalBuilds:['cache','edge','app-bay'],observedStates:['construction','activation','App overload','SQL read-only overload','bot filtered','paused'],widths:[1440,844,1920],errors,evidence,distribution:'local-only art-preview; not public V3 release'}));
} finally {try {await browser?.close();} finally {await server.close();}}
