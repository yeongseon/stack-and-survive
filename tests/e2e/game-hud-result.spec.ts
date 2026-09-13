import { expect, test } from '@playwright/test';
test('compact HUD and outcome preserve actual result values and narrow retry access', async ({ page }, info) => {
  await page.goto('/?tycoon'); await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByRole('button', { name: 'Ⅱ Pause', exact: true })).toBeEnabled({ timeout: 20000 });
  const hud = page.getByRole('region', { name: 'Business status' });
  await expect(hud.getByRole('meter')).toHaveCount(3);
  await page.getByText('Tycoon QA', { exact: true }).click();
  while (Number(await page.getByTestId('elapsed').textContent()) < 50) await page.getByRole('button', { name: 'Step one tick', exact: true }).click();
  const result = page.getByRole('region', { name: 'Business result' });
  await expect(result).toContainText('App Service Saturation'); await expect(result).toContainText('Score 1073');
  await expect(result.getByRole('button', { name: 'Play again' })).toBeFocused();
  const state = JSON.parse((await page.getByTestId('diagnostics').textContent())!);
  await expect(result).toContainText(`${state.result.economy.netBusinessValue.toFixed(1)} cr`);
  for (const width of [320,390,1024,1440,1920]) {
    await page.setViewportSize({ width, height: 740 });
    const rect = (await result.boundingBox())!;
    expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x+rect.width).toBeLessThanOrEqual(width);
    expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.y+rect.height).toBeLessThanOrEqual(740);
  }
  await page.screenshot({ path: info.outputPath('game-outcome.png') });
  await result.getByRole('button', { name: 'Review business' }).click();
  await expect(page.getByRole('dialog')).toContainText('Write capacity 70/s');
  await page.keyboard.press('Escape'); await expect(result.getByRole('button', { name: 'Review business' })).toBeFocused();
  await result.getByRole('button', { name: 'Play again' }).click(); await expect(page.getByRole('button', { name: 'Start Game' })).toBeFocused();
});
