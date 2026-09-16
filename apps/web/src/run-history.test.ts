import { expect, it } from 'vitest';
import { createController } from './controller';
import { baseline } from '@stack-and-survive/cloud-domain';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { emptyHistory, parseHistory, recordRun, summarizeRun, recentComparable, HISTORY_LIMIT } from './run-history';
import { createSimulation, advanceSimulation, simulationResult } from '@stack-and-survive/simulation/results';
import { startRuntime } from '@stack-and-survive/simulation/runtime';

function run(instances = 1, cache = false, edge = false, level = 0) {
  const c = createController({ start: () => () => {} }, { load: () => baseline(instances, cache, edge), save: () => {}, clear: () => {} }, false, challengeLadder[level].challenge);
  c.start(); while (!c.getSnapshot().result) c.inspectNextTick();
  const entry = summarizeRun(c.getSnapshot().result!, c.getSnapshot().state.runtime.architecture, 'run-1');
  c.destroy(); return entry;
}
it('keeps failed run history but excludes cheap failures and missed objectives from bests', () => {
  const failed = run(); let h = recordRun(emptyHistory(), failed);
  expect(h.runs).toHaveLength(1); expect(h.bests).toHaveLength(0);
  const success = { ...run(4,true), id:'run-2' }; h = recordRun(h, success);
  expect(h.bests[0].lowestCost.id).toBe('run-2');
  const missed = { ...run(3,true,true,2), id:'run-3' };
  expect(missed.status).toBe('COMPLETED'); expect(missed.objectiveMet).toBe(false);
  h = recordRun(h,missed); expect(h.bests).toHaveLength(1);
});
it('retains rejected action outcomes and rejects plausible but unreproducible saved results', () => {
  const challenge = challengeLadder[0].challenge;
  let state = createSimulation(baseline(), challenge.workload); state.runtime = startRuntime(state.runtime);
  state = advanceSimulation(state, challenge.workload, [
    { type: 'SCALE_OUT', time: 0, sequence: 0 }, { type: 'SCALE_OUT', time: 0, sequence: 1 },
  ]).nextState;
  while (state.runtime.status === 'RUNNING') state = advanceSimulation(state, challenge.workload).nextState;
  const result = { ...simulationResult(state, challenge.workload), challenge, initialArchitecture: baseline(), actionLog: state.runtime.actionLog };
  const entry = summarizeRun(result, state.runtime.architecture, 'rejected-action');
  expect(entry.actions).toHaveLength(2); expect(entry.actionLog[1].accepted).toBe(false);
  const history = recordRun(emptyHistory(), entry);
  expect(parseHistory(JSON.stringify(history))).toEqual(history);
  for (const patch of [{ finalArchitecture: baseline(4) }, { nbv: entry.nbv + 10 }, { actionLog: entry.actionLog.map(outcome => ({ ...outcome, accepted: true, reason: null })) }]) {
    const changed = { ...entry, ...patch };
    expect(parseHistory(JSON.stringify({ ...history, runs: [changed] }))).toEqual(emptyHistory());
  }
});
it('preserves actual conditions actions and separate best metrics with deterministic first tie', () => {
  const available = run(4,true); const protectedRun = { ...run(3,true,true), id:'run-2' };
  const h = recordRun(recordRun(emptyHistory(),available),protectedRun);
  expect(h.bests[0].highestAvailability.id).toBe(available.id);
  expect(h.bests[0].lowestCost.id).toBe(protectedRun.id);
  expect(h.bests[0].highestValue.id).toBe(protectedRun.id);
  expect(recordRun(h,{...protectedRun,id:'run-3'}).bests[0].lowestCost.id).toBe('run-2');
  expect(recordRun(h,protectedRun)).toEqual(h);
  expect(available.initialArchitecture.resources.find(r=>r.kind==='compute')!.instances).toBe(4);
  expect(available.actions).toEqual([]);
  expect(recentComparable(h,challengeLadder[0].challenge)?.id).toBe('run-2');
  expect(recentComparable(h,challengeLadder[1].challenge)).toBe(null);
});
it('bounds history while preserving bests beyond the recent list and highest cleared level', { timeout: 15000 }, () => {
  let h = emptyHistory(); const success = run(4,true);
  h = recordRun(h,success);
  const failed = run();
  for(let i=0;i<HISTORY_LIMIT+5;i++) h=recordRun(h,{...failed,id:`failed-${i}`});
  expect(h.runs).toHaveLength(HISTORY_LIMIT); expect(h.bests[0].highestValue.id).toBe(success.id);
  expect(h.highestLevel).toBe(1);
  const level3 = {...run(4,true,false,2),id:'level-three'};
  h=recordRun(h,level3); expect(h.highestLevel).toBe(3);
  expect(parseHistory(JSON.stringify(h))).toEqual(h);
});
it('rejects unsupported corrupted or forged record metadata without executing supplied content', () => {
  const h=recordRun(emptyHistory(),run());
  for(const raw of [null,'{bad','{}',JSON.stringify({...h,version:2}),JSON.stringify({...h,runs:[{...h.runs[0],availability:2}]}),JSON.stringify({...h,runs:[{...h.runs[0],elapsed:999}]}),JSON.stringify({...h,runs:[{...h.runs[0],objectiveMet:true}]})]) expect(parseHistory(raw)).toEqual(emptyHistory());
});
