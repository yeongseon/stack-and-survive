import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { formatMoney, formatMoneyRate, formatMoneyDelta, formatMoneyReason } from './money';
import { GameHUD } from './GameHUD';
import { GameResult } from './GameResult';
import { createController } from './controller';
import { classifyArchitecture } from './architecture-profile';
import { summarizeRun } from './run-history';

it.each([[75, '$75K'], [70.6, '$70.6K'], [5, '$5K'], [8, '$8K'], [0, '$0'], [-5, '-$5K'], [.25, '$250'], [-.25, '-$250'], [.0004, '$0.4'], [1234.56, '$1,234.56K'], [-0, '$0']])('formats %s credits as %s without changing units internally', (value, expected) => {
  expect(formatMoney(Number(value))).toBe(expected);
});
it('keeps seconds, minutes and one-time deltas distinct', () => {
  expect(formatMoneyRate(.25)).toBe('$250/s');
  expect(formatMoneyRate(0)).toBe('$0/s');
  expect(formatMoneyRate(1.28)).toBe('$1,280/s');
  expect(formatMoneyRate(5, 'min')).toBe('$5K/min');
  expect(formatMoneyRate(8, 'min')).toBe('$8K/min');
  expect(formatMoneyRate(3, 'min')).toBe('$3K/min');
  expect(formatMoneyDelta(.25)).toBe('+$250');
  expect(formatMoneyDelta(-.25)).toBe('-$250');
  expect(formatMoneyDelta(-.0000001)).toBe('$0');
  expect(formatMoneyDelta(0)).toBe('$0');
  expect(formatMoneyReason('Emergency WAF requires more than 8 remaining credits')).toBe('Emergency WAF requires more than $8K remaining');
  expect(formatMoneyReason('Already active')).toBe('Already active');
  expect(formatMoneyReason(null)).toBeNull();
  for (const value of [NaN, Infinity, -Infinity]) {
    expect(formatMoney(value)).toBe('—'); expect(formatMoneyRate(value)).toBe('—'); expect(formatMoneyDelta(value)).toBe('—');
  }
});

it('renders HUD and result money without mutating the authoritative run or score', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  expect(renderToStaticMarkup(createElement(GameHUD, { view: controller.getSnapshot() }))).toContain('$75K');
  controller.start();
  while (!controller.getSnapshot().result) controller.inspectNextTick();
  const view = controller.getSnapshot(), before = structuredClone(view);
  const hud = renderToStaticMarkup(createElement(GameHUD, { view }));
  const result = renderToStaticMarkup(createElement(GameResult, { result: view.result!, architecture: view.state.runtime.architecture, report: null, restart: () => {}, review: () => {} }));
  expect(hud).toContain(formatMoney(view.state.economy.remainingBudget));
  expect(result).toContain(formatMoney(view.result!.economy.netBusinessValue));
  expect(result).toContain(formatMoney(view.result!.economy.infrastructureCost + view.result!.economy.emergencyCost));
  expect(result).toContain('not actual Azure prices');
  expect(result).toContain(`<strong>${view.result!.score}</strong>`);
  expect(hud + result).not.toMatch(/\bcr\b|\bcredits\b/);
  const summary = summarizeRun(view.result!, view.state.runtime.architecture, 'money-test');
  expect(classifyArchitecture(summary).evidence.join(' ')).toContain(formatMoney(summary.cost + summary.emergencyCost));
  expect(controller.getSnapshot()).toEqual(before);
  controller.destroy();
});
