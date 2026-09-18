import { expect, it } from 'vitest';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { infrastructureScalingChallenge, parseChallenge } from '@stack-and-survive/scenarios/challenge';
import { replayRun } from './replay';
import { parseAction, type Action } from './runtime';
const make = (schedule: [number, Action['type'], ('cache' | 'edge')?][]) => schedule.map(([time,type,kind],sequence)=>parseAction({time,type,sequence,...(kind?{kind,x:0,y:0}:{})})).sort((a,b)=>a.time-b.time||a.sequence-b.sequence).map((a,sequence)=>({...a,sequence}));
const horizontal = make([[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT'],[0,'DEPLOY_RESOURCE','cache']]);
const vertical = make([[0,'SCALE_UP_APP'],[6,'SCALE_OUT'],[0,'DEPLOY_RESOURCE','cache'],[57,'DEPLOY_RESOURCE','edge']]);
const sql = make([[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT'],[0,'SCALE_UP_DATABASE'],[10,'SCALE_UP_DATABASE']]);
it('supports multiple complete standard-workload strategies with different cost/availability tradeoffs', () => {
  const run = (actions: Action[]) => replayRun({ challenge: infrastructureScalingChallenge, initialArchitecture: canonicalPlayerStart(), actions });
  const h = run(horizontal), v = run(vertical);
  expect(h.status).toBe('COMPLETED'); expect(v.status).toBe('COMPLETED');
  expect(h.availability).toBeGreaterThan(v.availability);
  expect(v.finalArchitecture.resources.find(r=>r.kind==='compute')).toMatchObject({instances:2,tier:2});
  expect(h.cost).not.toBe(v.cost);
});
it('a write-heavy workload requires SQL write capacity, not simply Cache or read replicas', () => {
  const challenge = parseChallenge({...infrastructureScalingChallenge,id:'write-heavy',workload:{...infrastructureScalingChallenge.workload,businessMix:{browse:.55,order:.45}}});
  const run = (actions: Action[]) => replayRun({challenge,initialArchitecture:canonicalPlayerStart(),actions});
  expect(run(horizontal).status).toBe('FAILED'); expect(run(sql).status).toBe('COMPLETED');
  expect(run(sql).availability).toBe(1);
});
