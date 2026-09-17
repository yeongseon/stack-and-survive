import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { blackFridayChallenge, parseChallenge } from '@stack-and-survive/scenarios/challenge';
import { createController, type View } from './controller';
import { GameHUD } from './GameHUD';
import { missionStatus } from './mission-status';

function at(view: View, time: number): View {
  return { ...view, state: { ...view.state, runtime: { ...view.state.runtime, time, status: 'RUNNING' } } };
}

it('shows the canonical duration and objective before time starts, without forecasting results', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const view = controller.getSnapshot();
  expect(missionStatus(view)).toMatchObject({ clock: '03:00', elapsed: 0, phaseIndex: 0, label: 'Opening traffic', status: 'Get ready', arriving: false });
  expect(missionStatus(view).phases).toHaveLength(8);
  expect(missionStatus(view).phases.every(phase => phase.progress === 0)).toBe(true);
  expect(missionStatus(view).objective).toBe('Keep the business alive');
  controller.destroy();
});

it('follows authoritative runtime boundaries and keeps countdown out of the live announcement', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const view = controller.getSnapshot();
  expect(missionStatus(at(view, 24))).toMatchObject({ clock: '02:36', phaseIndex: 0, arriving: false });
  expect(missionStatus(at(view, 25))).toMatchObject({ clock: '02:35', phaseIndex: 1, label: 'Traffic spike', arriving: true });
  expect(missionStatus(at(view, 28)).arriving).toBe(false);
  expect(missionStatus(at(view, 50))).toMatchObject({ label: 'Recovery window', tone: 'recovery' });
  expect(missionStatus(at(view, 65))).toMatchObject({ label: 'Bot attack', tone: 'attack' });
  expect(missionStatus(at(view, 160))).toMatchObject({ label: 'FINAL WAVE', clock: '00:20', phaseIndex: 7 });
  const announcement = (time: number) => renderToStaticMarkup(createElement(GameHUD, { view: at(view, time) })).match(/class="mission-phase"[^>]*>(.*?)<\/output>/)?.[1];
  expect(announcement(25)).toContain('Traffic spike');
  expect(announcement(25)).toBe(announcement(26));
  expect(announcement(24)).not.toBe(announcement(25));
  controller.destroy();
});

it('freezes with pause and suppresses arrival emphasis during errors and completion', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const view = at(controller.getSnapshot(), 65);
  const paused: View = { ...view, state: { ...view.state, runtime: { ...view.state.runtime, status: 'PAUSED' } } };
  expect(missionStatus(paused)).toMatchObject({ clock: '01:55', status: 'Paused', arriving: false });
  expect(missionStatus({ ...view, error: 'Renderer unavailable' })).toMatchObject({ status: 'Operation held', arriving: false });
  const final = missionStatus(at(view, 180));
  expect(final).toMatchObject({ clock: '00:00', elapsed: 180, phaseIndex: 7, arriving: false });
  expect(final.phases.every(phase => phase.progress === 1)).toBe(true);
  controller.destroy();
});

it('supports a different workload duration and exact availability objective without mutating state', () => {
  const challenge = parseChallenge({ ...blackFridayChallenge, objective: { id: 'target', version: 1, kind: 'availability', target: .999 },
    workload: { ...blackFridayChallenge.workload, duration: 12, traffic: [{ start: 0, end: 12, rps: 50, botRatio: 0 }] } });
  const controller = createController({ start: () => () => {} }, undefined, true, challenge);
  controller.start(); controller.inspectNextTick();
  const view = controller.getSnapshot(), before = structuredClone(view);
  expect(missionStatus(view)).toMatchObject({ clock: '00:11', duration: 12, objective: 'Finish with ≥99.9% availability', phaseIndex: 0, label: 'FINAL WAVE' });
  expect(view).toEqual(before);
  while (!controller.getSnapshot().result) controller.inspectNextTick();
  expect(missionStatus(controller.getSnapshot())).toMatchObject({ status: 'Finished', clock: '00:00', arriving: false, label: 'FINAL WAVE' });
  controller.destroy();
});

it('does not announce a new phase while the world still shows the preceding processed tick', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  controller.start();
  while (controller.getSnapshot().state.runtime.time < 25) controller.inspectNextTick();
  expect(controller.getSnapshot().snapshot?.time).toBe(24);
  expect(missionStatus(controller.getSnapshot())).toMatchObject({ elapsed: 25, phaseIndex: 0, label: 'Opening traffic' });
  controller.inspectNextTick();
  expect(missionStatus(controller.getSnapshot())).toMatchObject({ elapsed: 26, phaseIndex: 1, label: 'Traffic spike', arriving: true });
  controller.destroy();
});

it('uses actual consecutive-loss countdowns, freezes them on pause, and clears risk at result', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  controller.start();
  expect(missionStatus(controller.getSnapshot()).riskSeconds).toBeNull();
  while (controller.getSnapshot().state.runtime.time < 30) controller.inspectNextTick();
  const view = controller.getSnapshot();
  expect(missionStatus(view).riskSeconds).toBe(view.snapshot!.failureCountdown.availability);
  expect(missionStatus(view).riskSeconds).toBeGreaterThan(0);
  controller.pause();
  expect(missionStatus(controller.getSnapshot()).riskSeconds).toBe(missionStatus(view).riskSeconds);
  controller.resume();
  while (!controller.getSnapshot().result) controller.inspectNextTick();
  expect(missionStatus(controller.getSnapshot()).riskSeconds).toBeNull();
  controller.destroy();
});
