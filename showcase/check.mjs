import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const source = new URL('./slides.html', import.meta.url);
const story = JSON.parse(await readFile(new URL('./story.json', import.meta.url), 'utf8'));
assert.equal(story.slides.length, 8);
assert.equal(story.cover.id, 'cover'); assert.equal(story.cover.duration, 2); assert.equal(story.cover.narration, '');
const sequence = [story.cover, ...story.slides];
assert.equal(sequence.reduce((sum, slide) => sum + slide.duration, 0), 120);
const forbidden = /LOCAL PRODUCTION CAPTURE|capture|source [a-f0-9]{7}|automated|EDIT:|not a live model demo|revolutionary|next-generation|powered by AI|unlock|seamless|reimagine/i;
const output = new URL('../test-results-showcase/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [820, 1180]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(request.url()));
    await page.goto(source.href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    });
    assert.equal(await page.locator('.slide').count(), 9);
    await page.locator('#cover').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#cover h1').textContent(), 'Stack & Survive');
    for (let index = 1; index <= sequence.length; index++) {
      const slide = page.locator(`#${sequence[index - 1].id}`);
      await slide.waitFor({ state: 'visible' });
      assert.equal(await page.locator('.slide:visible').count(), 1);
      assert.equal(await page.locator('#position').textContent(), `${index} / 9`);
      assert.equal(forbidden.test(await slide.innerText()), false, `Internal/marketing wording on slide ${index}`);
      assert.equal(new URL(page.url()).hash, `#${sequence[index - 1].id}`);
      const overflow = await slide.evaluate(element => {
        const controls = document.querySelector('.deck-controls').getBoundingClientRect();
        return [...element.querySelectorAll('h1,h2,p,li,img,.service,.signature,.note')]
          .filter(node => {
            const r = node.getBoundingClientRect();
            return r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > controls.top + 1;
          }).map(node => node.textContent || node.getAttribute('alt'));
      });
      assert.deepEqual(overflow, [], `${width} slide ${index} overlaps viewport or controls`);
      await page.screenshot({ path: fileURLToPath(new URL(`${width}-${sequence[index - 1].id}.png`, output)) });
      if (index < sequence.length) await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#position').textContent(), '1 / 9');
    await page.keyboard.press('PageDown');
    assert.equal(await page.locator('#position').textContent(), '2 / 9');
    await page.keyboard.press('PageUp');
    await page.getByRole('button', { name: 'Next slide', exact: true }).click();
    await page.getByRole('button', { name: 'Previous slide', exact: true }).click();
    assert.equal(await page.locator('#position').textContent(), '1 / 9');
    await page.locator('h1').focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#position').textContent(), '9 / 9');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#position').textContent(), '8 / 9');
    await page.goto(`${source.href}#slide-3`);
    assert.equal(await page.locator('#position').textContent(), '4 / 9');
    await page.evaluate(() => { location.hash = '#slide-5'; });
    await page.locator('#slide-5').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#position').textContent(), '6 / 9');
    for (const href of await page.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))) {
      const target = new URL(href, source);
      if (target.protocol === 'file:') await access(target);
    }
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.slide:visible').count(), 9);
    const clipped = await page.locator('.slide').evaluateAll(slides => slides.flatMap(slide => {
      const bounds = slide.getBoundingClientRect();
      return [...slide.querySelectorAll('h1,h2,p,li,img,.service,.signature,.note')].filter(node => {
        const r = node.getBoundingClientRect();
        return r.bottom > bounds.bottom + 1 || r.right > bounds.right + 1 || r.top < bounds.top - 1;
      }).map(node => `${slide.id}: ${node.textContent || node.getAttribute('alt')}`);
    }));
    assert.deepEqual(clipped, [], `Print clipping at ${width}`);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}x${height}: title cover + eight slides, timing, navigation, images, print and clean wording`);
    await page.close();
  }
  const noScript = await browser.newPage({ javaScriptEnabled: false });
  await noScript.goto(source.href);
  assert.equal(await noScript.locator('.slide:visible').count(), 9);
  assert.equal(await noScript.locator('.deck-controls').isVisible(), false);
  assert.deepEqual(await noScript.locator('.slide').evaluateAll(slides => slides.map(slide => slide.id)),
    sequence.map(slide => slide.id));
  await noScript.close();
  console.log('PASS no-JavaScript reading order; screenshots in test-results-showcase/');
} finally {
  await browser.close();
}
