import {expect,it} from 'vitest';
import {baseline} from '@stack-and-survive/cloud-domain';
import {blackFridayV02 as blackFriday,parseScenario} from '@stack-and-survive/scenarios';
import {advanceEconomy,createEconomicState,compare} from './economy';
import {startRuntime,pauseRuntime} from './runtime';

const scenario=()=>parseScenario({...blackFriday,balanceVersion:'0.3',budget:100});
it('reinvests exactly ten percent of cumulative successful revenue, not full or potential revenue',()=>{
  const s=scenario();let state=createEconomicState(baseline(),s);state.runtime=startRuntime(state.runtime);
  for(let i=0;i<40;i++){
    const previous=state;state=advanceEconomy(state,s,[]).nextState;
    expect(state.economy.remainingBudget).toBeCloseTo(100+state.economy.revenue*.1-state.economy.infrastructureCost-state.economy.emergencyCost,10);
    expect(state.economy.netBusinessValue).toBeCloseTo(state.economy.revenue-state.economy.infrastructureCost-state.economy.emergencyCost-state.economy.incidentLoss,10);
    if(i===0){expect(state.economy.revenue).toBeCloseTo(1.16);expect(state.economy.remainingBudget).toBeCloseTo(100+.116-17/60);}
    expect(state.economy.revenue).toBeGreaterThanOrEqual(previous.economy.revenue);
  }
  expect(state.economy.potentialRevenue).toBeGreaterThan(state.economy.revenue);
  expect(state.economy.remainingBudget).not.toBeCloseTo(100+state.economy.potentialRevenue*.1-state.economy.infrastructureCost);
});
it('does not earn from bots or allow a queued action to spend predicted current-tick revenue',()=>{
  const bots=parseScenario({...scenario(),traffic:[{start:0,end:180,rps:100,botRatio:1}]});
  let state=createEconomicState(baseline(3,true,true),bots);state.runtime=startRuntime(state.runtime);
  const next=advanceEconomy(state,bots,[]).nextState;
  expect(next.economy.revenue).toBe(0);expect(next.economy.potentialRevenue).toBe(0);expect(next.economy.incidentLoss).toBe(0);
  expect(next.economy.remainingBudget).toBeCloseTo(100-38/60);
  const low=parseScenario({...scenario(),budget:8});state=createEconomicState(baseline(3,true,true),low);state.runtime=startRuntime(state.runtime);
  const denied=advanceEconomy(state,low,[{type:'EMERGENCY_WAF',time:0,sequence:0}]);
  expect(denied.transition.outcomes[0].accepted).toBe(false);expect(denied.nextState.economy.emergencyCost).toBe(0);
});
it('preserves paused state and exhausts at exact reinvestment-aware zero',()=>{
  const s=parseScenario({...scenario(),budget:17/60-.116});
  let state=createEconomicState(baseline(),s);state.runtime=startRuntime(state.runtime);
  const next=advanceEconomy(state,s,[]);
  expect(compare(next.nextState.economy.remainingBudget,0)).toBe(0);expect(next.budgetExhausted).toBe(true);
  state=createEconomicState(baseline(),scenario());state.runtime=startRuntime(state.runtime);state.runtime=pauseRuntime(state.runtime);
  expect(advanceEconomy(state,scenario(),[]).nextState).toEqual(state);
});
it('retains explicit v0.2 economic replay instead of rewriting historical budget',()=>{
  const state=createEconomicState(baseline(),blackFriday);state.runtime=startRuntime(state.runtime);
  const next=advanceEconomy(state,blackFriday,[]).nextState;
  expect(next.economy.remainingBudget).toBeCloseTo(blackFriday.budget-17/60);
});
