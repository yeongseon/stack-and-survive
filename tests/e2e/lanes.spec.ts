import { expect, test } from '@playwright/test';
import { baseline } from '../../packages/cloud-domain/src/index';

test('processing lanes follow actual protected and cached paths with no phantom SQL work', async ({ page }, info) => {
  const architecture = baseline(3, true, true);
  const positions = [{ x: -260, y: -100 }, { x: 0, y: 0 }, { x: 260, y: 100 }, { x: -220, y: 160 }, { x: 130, y: -150 }];
  architecture.resources.forEach((r, i) => Object.assign(r, positions[i]));
  await page.goto('/'); await page.evaluate(a => localStorage.setItem('stack-and-survive.architecture.v1', JSON.stringify({ saveVersion: 1, architecture: a })), architecture);
  await page.reload(); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-lanes', /idle/);
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Developer inspector' }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 76) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  await surface.scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-tick', '76');
  const lanes: { from: string; to: string; volume: number }[] = JSON.parse((await surface.getAttribute('data-lanes'))!);
  expect(lanes.map(({ from, to }) => ({ from, to }))).toEqual(architecture.connections);
  expect(lanes.find(lane => lane.from === 'compute' && lane.to === 'database')!.volume).toBeCloseTo(47.76);
  expect(lanes.find(lane => lane.from === 'cache')!.volume).toBeCloseTo(38.208);
  const flows: { from: string; to: string; kind: string; end: string }[] = JSON.parse((await surface.getAttribute('data-flows'))!);
  expect(flows.some(flow => flow.kind === 'bot' && flow.to === 'database')).toBe(false);
  expect(flows.some(flow => flow.to === 'cache' && flow.end === 'success')).toBe(true);
  await page.screenshot({ path: info.outputPath('processing-lanes.png') });
});

test('fixed topology redraws lanes on actual demand changes and reuses unchanged geometry', async ({ page }) => {
  await page.goto('/'); const surface = page.locator('[data-renderer="ready"]');
  await expect(surface).toHaveAttribute('data-lanes', /idle/);
  await page.getByLabel('Initial App instances').selectOption('4');
  await page.getByRole('button', { name: 'Start operation', exact: true }).click();
  await surface.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await surface.getAttribute('data-tick'))).toBeGreaterThanOrEqual(1);
  const initial: { from: string; to: string; volume: number; state: string }[] = JSON.parse((await surface.getAttribute('data-lanes'))!);
  expect(initial.find(l => l.from === 'internet')!.volume).toBe(100);
  const initialDraws = Number(await surface.getAttribute('data-structure-draws'));
  const frames = Number(await surface.getAttribute('data-frames'));
  await expect.poll(async () => Number(await surface.getAttribute('data-frames'))).toBeGreaterThan(frames + 10);
  expect(Number(await surface.getAttribute('data-structure-draws'))).toBe(initialDraws);
  await expect.poll(async () => Number(await surface.getAttribute('data-tick')), { timeout: 40000 }).toBeGreaterThanOrEqual(31);
  const changed: typeof initial = JSON.parse((await surface.getAttribute('data-lanes'))!);
  expect(changed.map(({ from, to }) => ({ from, to }))).toEqual(initial.map(({ from, to }) => ({ from, to })));
  expect(changed.find(l => l.from === 'internet')).toMatchObject({ volume: 220, state: 'busy' });
  expect(Number(await surface.getAttribute('data-structure-draws'))).toBeGreaterThan(initialDraws);
  await page.getByRole('button', { name: 'Pause operation', exact: true }).click();
});
