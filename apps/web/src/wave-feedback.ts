import type { View } from './controller';
import { blackFriday } from '@stack-and-survive/scenarios';
import { compare, value, reinvestmentRate } from '@stack-and-survive/simulation/economy';
import type { RequestSnapshot } from '@stack-and-survive/simulation';
import type { Scenario } from '@stack-and-survive/schema';

export function trafficPhaseLabel(scenario: Scenario, index: number) {
  if (index === 0) return 'Opening traffic';
  const phase = scenario.traffic[index], previous = scenario.traffic[index - 1];
  if (index === scenario.traffic.length - 1) return 'FINAL WAVE';
  if (phase.rps < previous.rps && phase.rps * phase.botRatio <= previous.rps * previous.botRatio) return 'Recovery window';
  if (phase.rps * phase.botRatio > previous.rps * previous.botRatio) return 'Bot attack';
  return phase.rps > previous.rps ? 'Traffic spike' : 'Traffic change';
}

export function lostSales(requests: RequestSnapshot | null | undefined) {
  if (!requests) return null;
  return Math.max(0, requests.offered.browse - requests.successful.browse) * value.browse
    + Math.max(0, requests.offered.order - requests.successful.order) * value.order;
}
export function upcomingWave(view: View) {
  const scenario=view.challenge?.workload ?? blackFriday;
  if (view.result) return null;
  const next=scenario.traffic.find(phase=>phase.start>view.state.runtime.time);
  if(!next)return null;
  const label=trafficPhaseLabel(scenario,scenario.traffic.indexOf(next));
  return { seconds:next.start-view.state.runtime.time, rps:next.rps, bots:next.botRatio,
    label,
    imminent:next.start-view.state.runtime.time<=5 && view.state.runtime.status==='RUNNING' && !view.error };
}
export type Recovery = { time:number; kind:'compute'|'cache'|'edge'|'internet'; text:string };
export function recoveryFeedback(previous: View, current: View): Recovery | null {
  if(current.error||current.state.runtime.status!=='RUNNING'||!current.snapshot||!previous.snapshot
    ||current.snapshot.time<=previous.snapshot.time)return null;
  const before=previous.state.runtime.architecture.resources;
  const activated=current.state.runtime.architecture.resources.find(resource=>{
    const old=before.find(item=>item.id===resource.id);
    return old && ((old.remaining>0&&resource.remaining===0)||resource.instances>old.instances);
  });
  if(activated && (activated.kind==='compute'||activated.kind==='cache'||activated.kind==='edge')) return {time:current.snapshot.time,kind:activated.kind,text:activated.kind==='compute'?'App capacity online':activated.kind==='cache'?'Cache online':'Protection online'};
  const beforeLoss=lostSales(previous.snapshot.requests)!, nowLoss=lostSales(current.snapshot.requests)!;
  if(compare(beforeLoss,.02)>0&&compare(nowLoss,0)===0)return {time:current.snapshot.time,kind:'internet',text:'Customer sales recovered'};
  const beforeSuccess=previous.snapshot.requests.successful.browse+previous.snapshot.requests.successful.order;
  const nowSuccess=current.snapshot.requests.successful.browse+current.snapshot.requests.successful.order;
  const beforeOffered=previous.snapshot.requests.offered.browse+previous.snapshot.requests.offered.order;
  const nowOffered=current.snapshot.requests.offered.browse+current.snapshot.requests.offered.order;
  if(beforeOffered>0&&nowOffered>0&&nowSuccess>=beforeSuccess*1.15&&nowSuccess-beforeSuccess>=15
    &&nowSuccess/nowOffered-beforeSuccess/beforeOffered>=.05)return {time:current.snapshot.time,kind:'compute',text:'More customers served'};
  return null;
}
export function reinvestedThisTick(view: View) {
  const r=view.snapshot?.requests;
  return r ? (r.successful.browse*value.browse+r.successful.order*value.order)*reinvestmentRate(view.challenge?.workload??blackFriday) : 0;
}
