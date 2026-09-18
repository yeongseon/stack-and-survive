import { expect, it } from 'vitest';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { missionBrief, objectiveSummary, phaseArrival } from './mission-brief';
import { createController } from './controller';

it('derives mission endpoints from the selected workload, including an alternate workload', () => {
  expect(missionBrief(blackFridayChallenge.workload)).toMatchObject({ duration: 180, opening: 100, final: 600, bots: 45 });
  const alternate = { ...blackFridayChallenge.workload, duration: 90, traffic: [
    { start: 0, end: 45, rps: 70, botRatio: 0 }, { start: 45, end: 90, rps: 320, botRatio: .2 },
  ] };
  expect(missionBrief(alternate)).toMatchObject({ duration: 90, opening: 70, final: 320, bots: 20 });
});

it('presents the existing ladder objectives without changing their identity', () => {
  const identities = challengeLadder.map(level => level.challenge.canonical);
  expect(challengeLadder.map(level => objectiveSummary(level.challenge))).toEqual([
    'Finish 180 seconds', 'Finish with ≥99% availability', 'Finish with ≥99.9% availability',
  ]);
  expect(challengeLadder.map(level => level.challenge.canonical)).toEqual(identities);
});

it('announces observed phases for two ticks without advancing or mutating the game', () => {
  const controller = createController({ start: () => () => {} }, undefined, true);
  const before = controller.getSnapshot();
  controller.start();
  controller.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 190, y: -100 });
  controller.queueAction({ type: 'SCALE_OUT' });
  const observed = new Set<number>();
  for (let tick = 0; tick < 70; tick++) {
    controller.inspectNextTick();
    const view = controller.getSnapshot();
    const unchanged = structuredClone(view);
    const time = view.snapshot?.time;
    if (time !== undefined) observed.add(time);
    if (time === 25) expect(phaseArrival(view)).toMatchObject({ label: 'Traffic spike', rps: 260, bots: 0 });
    if (time === 27) expect(phaseArrival(view)).toBeNull();
    if (time === 50) expect(phaseArrival(view)).toMatchObject({ label: 'Recovery window', rps: 160 });
    if (time === 65) expect(phaseArrival(view)).toMatchObject({ label: 'Bot attack', rps: 440, bots: 35 });
    expect(controller.getSnapshot()).toBe(view);
    expect(view).toEqual(unchanged);
  }
  for (const time of [25, 27, 50, 65]) expect(observed.has(time)).toBe(true);
  const running = controller.getSnapshot();
  if (!running.snapshot) throw new Error('Expected a processed snapshot');
  expect(phaseArrival({ ...running, snapshot: { ...running.snapshot, time: 160 } })).toMatchObject({ label: 'FINAL WAVE', rps: 600, bots: 45 });
  expect(phaseArrival(before)).toBeNull();
  controller.pause();
  expect(phaseArrival(controller.getSnapshot())).toBeNull();
  controller.destroy();
});
