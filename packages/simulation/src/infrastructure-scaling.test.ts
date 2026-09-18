import { describe, expect, it } from 'vitest';
import { baseline, canonicalPlayerStart, parseArchitecture, resourceRunningCost } from '@stack-and-survive/cloud-domain';
import { infrastructureScalingScenario, blackFriday } from '@stack-and-survive/scenarios';
import { infrastructureScalingChallenge } from '@stack-and-survive/scenarios/challenge';
import { createSimulation, advanceSimulation } from './results';
import { startRuntime, parseAction, type Action } from './runtime';
import { processRequests } from './index';
import { replayRun } from './replay';

function game(instances = 1) {
  const state = createSimulation(baseline(instances), infrastructureScalingScenario);
  state.runtime = startRuntime(state.runtime); return state;
}
function tick(state: ReturnType<typeof game>, actions: Action['type'][] = []) {
  return advanceSimulation(state, infrastructureScalingScenario, actions.map((type, index) => parseAction({ type, time: state.runtime.time, sequence: state.runtime.lastSequence + index + 1 }))).nextState;
}
function advance(state: ReturnType<typeof game>, until: number) { while (state.runtime.time <= until && state.runtime.status === 'RUNNING') state = tick(state); return state; }
describe('infrastructure scaling rules 0.4', () => {
  it('keeps scale-out delayed and activates an additional physical instance', () => {
    let state = tick(game(), ['SCALE_OUT']);
    expect(state.runtime.architecture.resources[1].instances).toBe(1);
    state = advance(state, 7); expect(state.runtime.architecture.resources[1].instances).toBe(1);
    state = tick(state); expect(state.runtime.architecture.resources[1].instances).toBe(2);
  });
  it('drains the last instance for three ticks then reduces capacity and running cost', () => {
    let state = tick(game(2), ['SCALE_IN']);
    expect(state.runtime.infrastructureChanges[0]).toMatchObject({ type: 'SCALE_IN', due: 3 });
    expect(state.runtime.architecture.resources[1].instances).toBe(2);
    state = advance(state, 3);
    expect(state.runtime.architecture.resources[1].instances).toBe(1);
    expect(resourceRunningCost(state.runtime.architecture.resources[1])).toBe(5);
  });
  it('guards minimum/maximum instances and serializes all changes on one facility', () => {
    expect(tick(game(), ['SCALE_IN']).runtime.actionLog[0].accepted).toBe(false);
    expect(tick(game(4), ['SCALE_OUT']).runtime.actionLog[0].accepted).toBe(false);
    const state = tick(game(2), ['SCALE_OUT', 'SCALE_IN', 'SCALE_UP_APP']);
    expect(state.runtime.actionLog.map(a => a.accepted)).toEqual([true, false, false]);
  });
  it('changes tier on the same App facility only after six seconds', () => {
    let state = tick(game(2), ['SCALE_UP_APP']);
    state = advance(state, 5); expect(state.runtime.architecture.resources[1].tier).toBeUndefined();
    state = tick(state); const app = state.runtime.architecture.resources[1];
    expect(app).toMatchObject({ tier: 2, instances: 2 }); expect(resourceRunningCost(app)).toBe(18);
    expect(processRequests(state.runtime.architecture, { browse: 100, order: 0, bot: 0 }).app.capacity).toBe(480);
    state = tick(state, ['SCALE_DOWN_APP']); state = advance(state, 13);
    expect(state.runtime.architecture.resources[1].tier).toBe(1);
  });
  it('scales SQL read and write capacity after ten seconds without multiplying databases', () => {
    let state = tick(game(), ['SCALE_UP_DATABASE']); state = advance(state, 10);
    const sql = state.runtime.architecture.resources.find(r => r.kind === 'database')!;
    expect(sql).toMatchObject({ tier: 2, instances: 1 }); expect(resourceRunningCost(sql)).toBe(22);
    const measured = processRequests(state.runtime.architecture, { browse: 80, order: 20, bot: 0 });
    expect(measured.sql).toMatchObject({ readCapacity: 300, writeCapacity: 110 });
    state = tick(state, ['SCALE_DOWN_DATABASE']); state = advance(state, 21);
    expect(state.runtime.architecture.resources.find(r => r.kind === 'database')!.tier).toBe(1);
  });
  it('replicas increase read capacity, never primary write capacity, with independent cost', () => {
    let state = tick(game(), ['ADD_READ_REPLICA']); state = advance(state, 8);
    const sql = state.runtime.architecture.resources.find(r => r.kind === 'database')!;
    expect(sql.readReplicas).toBe(1); expect(resourceRunningCost(sql)).toBe(20);
    expect(processRequests(state.runtime.architecture, { browse: 80, order: 20, bot: 0 }).sql).toMatchObject({ readCapacity: 360, writeCapacity: 70 });
    state = tick(state, ['REMOVE_READ_REPLICA']); state = advance(state, 12);
    expect(state.runtime.architecture.resources.find(r => r.kind === 'database')!.readReplicas).toBe(0);
  });
  it('supports parallel App and SQL changes but freezes all delays while paused', () => {
    const state = tick(game(), ['SCALE_UP_APP', 'SCALE_UP_DATABASE']);
    expect(state.runtime.infrastructureChanges).toHaveLength(2);
    state.runtime.status = 'PAUSED'; const paused = tick(state);
    expect(paused.runtime.time).toBe(state.runtime.time); expect(paused.runtime.infrastructureChanges).toEqual(state.runtime.infrastructureChanges);
  });
  it('isolates old versions and rejects invalid typed replay payloads', () => {
    const state = game();
    expect(advanceSimulation(state, blackFriday, [{ type: 'SCALE_UP_APP', time: 0, sequence: 0 }]).outcomes[0].accepted).toBe(false);
    const architecture = baseline(); architecture.resources[1].tier = 2;
    expect(() => createSimulation(architecture, blackFriday)).toThrow('rules 0.4');
    expect(() => parseAction({ type: 'SCALE_UP_APP', time: 0, sequence: 0, tier: 99 })).toThrow();
    expect(() => parseArchitecture({ ...architecture, resources: architecture.resources.map(r => ({ ...r, tier: 4 })) })).toThrow();
  });
  it('replays identical scaling decisions into identical final architecture and outcome', () => {
    const actions: Action[] = [{ type: 'SCALE_UP_APP', time: 0, sequence: 0 }, { type: 'SCALE_UP_DATABASE', time: 0, sequence: 1 }, { type: 'SCALE_OUT', time: 7, sequence: 2 }, { type: 'ADD_READ_REPLICA', time: 11, sequence: 3 }];
    const input = { challenge: infrastructureScalingChallenge, initialArchitecture: canonicalPlayerStart(), actions };
    expect(replayRun(input)).toEqual(replayRun(input));
    expect(replayRun(input).finalArchitecture.resources.find(r => r.kind === 'database')).toMatchObject({ tier: 2, readReplicas: 1 });
  });
  it('read-heavy and write-heavy pressure respond to different SQL choices', () => {
    const architecture = baseline(4); const sql = architecture.resources.find(r => r.kind === 'database')!;
    const reads = { browse: 400, order: 0, bot: 0 }, writes = { browse: 0, order: 150, bot: 0 };
    sql.readReplicas = 2;
    expect(processRequests(architecture, reads).sql.readsDropped).toBe(0);
    expect(processRequests(architecture, writes).sql.writesDropped).toBe(80);
    sql.tier = 3;
    expect(processRequests(architecture, writes).sql.writesDropped).toBe(0);
  });
  it('guards tier and replica bounds without charging rejected requests', () => {
    let state = game();
    state = tick(state, ['SCALE_DOWN_APP','SCALE_DOWN_DATABASE','REMOVE_READ_REPLICA']);
    expect(state.runtime.actionLog.every(outcome => !outcome.accepted)).toBe(true);
    state.runtime.architecture.resources.find(r=>r.kind==='compute')!.tier = 3;
    const sql = state.runtime.architecture.resources.find(r=>r.kind==='database')!;
    sql.tier = 3; sql.readReplicas = 2;
    state = tick(state, ['SCALE_UP_APP','SCALE_UP_DATABASE','ADD_READ_REPLICA']);
    expect(state.runtime.actionLog.every(outcome => !outcome.accepted)).toBe(true);
    expect(state.runtime.infrastructureChanges).toHaveLength(0);
  });
  it('does not invent activation beyond the final processed tick', () => {
    const challenge = {...infrastructureScalingChallenge,workload:{...infrastructureScalingScenario,duration:3,traffic:[{start:0,end:3,rps:100,botRatio:0}]}};
    const result = replayRun({challenge,initialArchitecture:baseline(2),actions:[{type:'SCALE_IN',time:0,sequence:0}]});
    expect(result.elapsed).toBe(3); expect(result.finalArchitecture.resources[1].instances).toBe(2);
  });
  it('requires sufficient existing funds for the post-change running tick', () => {
    const state = game(); state.economy.remainingBudget = 0;
    const next = tick(state,['SCALE_UP_APP','SCALE_UP_DATABASE','ADD_READ_REPLICA']);
    expect(next.runtime.actionLog.every(outcome=>!outcome.accepted)).toBe(true);
  });
});
