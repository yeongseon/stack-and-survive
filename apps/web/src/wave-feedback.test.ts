import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { processRequests } from '@stack-and-survive/simulation';
import { createController } from './controller';
import { lostSales, upcomingWave, recoveryFeedback } from './wave-feedback';

it('values only lost legitimate sales, never blocked or dropped bots',()=>{
  expect(lostSales(processRequests(baseline(),{browse:0,order:0,bot:400}))).toBe(0);
  const request=processRequests(baseline(),{browse:160,order:40,bot:200});
  expect(lostSales(request)).toBeCloseTo((160-request.successful.browse)*.002+(40-request.successful.order)*.05,12);
  expect(lostSales(null)).toBeNull();
});
it('reports zero-loss recovery and efficiency improvement, not a mere incoming-demand increase',()=>{
  const c=createController({start:()=>()=>{}},undefined,true);c.start();c.inspectNextTick();
  const original=c.getSnapshot();c.inspectNextTick();const next=c.getSnapshot();
  const withRequests=(view:typeof original,requests:ReturnType<typeof processRequests>)=>({...view,snapshot:{...view.snapshot!,requests}});
  const before=withRequests(original,processRequests(baseline(),{browse:160,order:40,bot:0}));
  const recovered=withRequests(next,processRequests(baseline(),{browse:80,order:20,bot:0}));
  expect(recoveryFeedback(before,recovered)?.text).toBe('Customer sales recovered');
  const heavy=withRequests(original,processRequests(baseline(),{browse:240,order:60,bot:0}));
  const improved=withRequests(next,processRequests(baseline(2),{browse:240,order:60,bot:0}));
  expect(recoveryFeedback(heavy,improved)?.text).toBe('More customers served');
  const moreDemand=withRequests(next,processRequests(baseline(4,true),{browse:240,order:60,bot:0}));
  expect(recoveryFeedback(recovered,moreDemand)).toBeNull();
  expect(recoveryFeedback(before,{...recovered,error:'Renderer lost'})).toBeNull();
  expect(upcomingWave({...next,state:{...next.state,runtime:{...next.state.runtime,time:160}}})).toBeNull();
  c.destroy();
});
it('uses authoritative phase time, warns only when live, then selects next phase at boundary',()=>{
  const c=createController({start:()=>()=>{}},undefined,true);c.start();
  while(c.getSnapshot().state.runtime.time<20)c.inspectNextTick();
  expect(upcomingWave(c.getSnapshot())).toEqual({seconds:5,rps:260,bots:0,imminent:true});
  c.pause();expect(upcomingWave(c.getSnapshot())?.imminent).toBe(false);c.resume();
  while(c.getSnapshot().state.runtime.time<25)c.inspectNextTick();
  expect(upcomingWave(c.getSnapshot())?.seconds).toBe(25);c.destroy();
});
it('deduplicates snapshots and only rewards actual activation without counting pause as recovery',()=>{
  const c=createController({start:()=>()=>{}},undefined,true);c.start();c.queueAction({type:'SCALE_OUT'});
  c.inspectNextTick();let before=c.getSnapshot();
  while(c.getSnapshot().state.runtime.time<9){before=c.getSnapshot();c.inspectNextTick();}
  const after=c.getSnapshot();expect(recoveryFeedback(before,after)?.text).toBe('App capacity online');
  expect(recoveryFeedback(after,after)).toBeNull();c.pause();expect(recoveryFeedback(after,c.getSnapshot())).toBeNull();c.destroy();
});
