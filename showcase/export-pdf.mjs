import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(new URL('./slides.html', import.meta.url).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  const output = fileURLToPath(new URL('./stack-and-survive-showcase.pdf', import.meta.url));
  await page.pdf({ path: output, printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
  console.log(`Exported ${await page.locator('.slide').count()} showcase slides: ${output}`);
} finally {
  await browser.close();
}
