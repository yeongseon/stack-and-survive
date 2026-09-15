import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFridayV02 as blackFriday } from '@stack-and-survive/scenarios';
import { simulateScenario } from './results';
import { runServiceScenario } from './outcomes';

for (const run of [simulateScenario, runServiceScenario]) {
  it(`${run.name} rejects malformed scenario and timestamps before filtering`, () => {
    expect(() => run(baseline(), { ...blackFriday, budget: NaN })).toThrow();
    expect(() => run(baseline(), { ...blackFriday, businessMix: { browse: .8, order: .8 } })).toThrow('sum');
    expect(() => run(baseline(), { ...blackFriday, traffic: [] })).toThrow('cover');
    for (const time of [-1, .5, NaN, Infinity, 180, 181]) {
      expect(() => run(baseline(), blackFriday, [{ time, sequence: 0, type: 'SCALE_OUT' }])).toThrow();
    }
    expect(() => run(baseline(), blackFriday, [{ time: 179, sequence: NaN, type: 'SCALE_OUT' }])).toThrow();
  });
  it(`${run.name} normalizes accepted near-one mix and preserves inputs`, () => {
    const scenario = { ...blackFriday, businessMix: { browse: .8, order: .2000000001 } };
    const original = structuredClone(scenario);
    expect(run(baseline(), scenario)).toEqual(run(baseline(), scenario));
    expect(scenario).toEqual(original);
  });
}
it('does not label actions after early failure as accepted or executed', () => {
  const result = runServiceScenario(baseline(), blackFriday, [{ time: 100, sequence: 0, type: 'SCALE_OUT' }]);
  expect(result.runtime.time).toBe(50); expect(result.runtime.actionLog).toEqual([]);
});
