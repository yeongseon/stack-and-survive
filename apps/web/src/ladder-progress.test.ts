import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { simulateScenario } from '@stack-and-survive/simulation/results';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { createController } from './controller';
import { emptyProgress, parseProgress, recordCompletion, unlockedLevel } from './ladder-progress';

function result(level: number, complete = true) {
  const challenge = challengeLadder[level].challenge;
  return { ...simulateScenario(complete ? baseline(4,true) : baseline(), challenge.workload), challenge };
}
it('opens only the next approved level for an objective-valid comparable completion', () => {
  const initial = emptyProgress(); expect(unlockedLevel(initial)).toBe(0);
  expect(recordCompletion(initial, result(0,false))).toEqual(initial);
  expect(recordCompletion(initial, result(1))).toEqual(initial);
  const first = recordCompletion(initial, result(0)); expect(unlockedLevel(first)).toBe(1);
  expect(recordCompletion(first, result(0))).toEqual(first);
  const second = recordCompletion(first, result(1)); expect(unlockedLevel(second)).toBe(2);
  const final = recordCompletion(second, result(2)); expect(unlockedLevel(final)).toBe(2); expect(final.completed).toHaveLength(3);
  expect(initial.completed).toEqual([]);
});
it('validates persisted progress versions and rejects holes or mismatched challenge identities', () => {
  const first = recordCompletion(emptyProgress(), result(0));
  expect(parseProgress(JSON.stringify(first))).toEqual(first);
  for (const raw of [null,'{bad','{}',JSON.stringify({...first,version:2}),JSON.stringify({...first,completed:['wrong']}),JSON.stringify({...first,completed:[challengeLadder[1].challenge.canonical]})]) {
    expect(parseProgress(raw)).toEqual(emptyProgress());
  }
});
it('derives objective success rather than trusting a forged objectiveMet field', () => {
  const first = recordCompletion(emptyProgress(), result(0));
  const challenge = challengeLadder[1].challenge;
  const failing = { ...simulateScenario(baseline(3,true),challenge.workload), challenge, objectiveMet:true };
  expect(recordCompletion(first,failing)).toEqual(first);
  const c = createController({start:()=>()=>{}},undefined,true,challengeLadder[2].challenge);
  expect(c.getSnapshot().state.runtime.architecture.resources.find(r=>r.kind==='compute')!.instances).toBe(1);
  c.destroy();
});
