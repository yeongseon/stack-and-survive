import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday } from '@stack-and-survive/scenarios';
import { blackFridayChallenge, evaluateObjective, parseChallenge } from '@stack-and-survive/scenarios/challenge';
import { simulateScenario } from '@stack-and-survive/simulation/results';
import { createController } from './controller';
import { GameHUD } from './GameHUD';
import { GameResult } from './GameResult';
import { objectives } from './observations';
import { compareAttempts } from './comparison';

const short = () => parseChallenge({ ...blackFridayChallenge, id: 'short-test', workload: { ...blackFriday, id: 'short-test', duration: 12, budget: 50,
  traffic: [{ start: 0, end: 6, rps: 50, botRatio: 0 }, { start: 6, end: 12, rps: 100, botRatio: 0 }] } });
it('uses injected workload through ticks HUD events results and faithful initial-state replay', () => {
  const challenge = short();
  const c = createController({ start: () => () => {} }, undefined, false, challenge);
  const initial = structuredClone(c.getSnapshot().state.runtime.architecture);
  c.start(); c.queueAction({ type: 'SCALE_OUT' });
  while (!c.getSnapshot().result) c.inspectNextTick();
  const result = c.getSnapshot().result!;
  const { challenge: recorded, initialArchitecture, objectiveMet, actionLog, ...engine } = result;
  expect(recorded).toEqual(challenge); expect(initialArchitecture).toEqual(initial);
  expect(objectiveMet).toBe(true); expect(result.elapsedTime).toBe(12);
  expect(actionLog).toHaveLength(1);
  expect(engine).toEqual(simulateScenario(initialArchitecture!, challenge.workload, actionLog!.map(o => o.action)));
  expect(initialArchitecture!.resources.find(r => r.kind === 'compute')!.instances).toBe(1);
  expect(c.getSnapshot().state.runtime.architecture.resources.find(r => r.kind === 'compute')!.instances).toBe(2);
  const hud = renderToStaticMarkup(createElement(GameHUD, { view: c.getSnapshot() }));
  expect(hud).toContain('max="50"'); expect(hud).toContain('max="100"');
  expect(objectives(c.getSnapshot())[0].value).toBe('12 / 12s');
  expect(c.getSnapshot().events.some(e => e.text === 'Demand phase 2 / 2')).toBe(true);
  expect(renderToStaticMarkup(createElement(GameResult, { result, architecture: c.getSnapshot().state.runtime.architecture, report: null, restart: () => {}, review: () => {} }))).toContain('short-test');
  c.redesign(); expect(c.getSnapshot().challenge).toEqual(challenge);
  c.reset(); expect(c.getSnapshot().state.economy.remainingBudget).toBe(50); c.destroy();
});
it('evaluates an independent objective without changing the underlying workload', () => {
  const result = simulateScenario(baseline(3, true, true), blackFriday);
  const target = parseChallenge({ ...blackFridayChallenge, objective: { id: 'availability', version: 1, kind: 'availability', target: .999 } });
  expect(target.workload).toEqual(blackFriday);
  expect(evaluateObjective(blackFridayChallenge, result)).toBe(true);
  expect(evaluateObjective(target, result)).toBe(false);
  expect(evaluateObjective(blackFridayChallenge, { ...result, status: 'FAILED' })).toBe(false);
});
it('refuses unlike full challenge identity and mixed legacy metadata in comparison', () => {
  const result = simulateScenario(baseline(), blackFriday);
  const a = { ...result, challenge: blackFridayChallenge };
  const b = { ...result, challenge: parseChallenge({ ...blackFridayChallenge, seed: 5 }) };
  expect(compareAttempts(a, b).sameScenario).toBe(false);
  expect(compareAttempts(a, result).sameScenario).toBe(false);
  expect(compareAttempts(a, structuredClone(a)).sameScenario).toBe(true);
});
