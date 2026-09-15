import type { Architecture, Scenario } from '@stack-and-survive/schema';
import { definitions } from '@stack-and-survive/cloud-domain';
import { parseScenario } from '@stack-and-survive/scenarios';
import { advanceRuntime, createPreparation, type Action, type Runtime, type TickTransition } from './runtime';

export const value = Object.freeze({ browse: .002, order: .05, incident: .25 });
export function reinvestmentRate(scenario: Scenario): number { return scenario.balanceVersion === '0.3' ? .1 : 0; }
export function epsilon(a: number, b: number): number { return 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }
export function compare(a: number, b: number): -1 | 0 | 1 {
  return Math.abs(a - b) <= epsilon(a, b) ? 0 : a < b ? -1 : 1;
}
export type Economy = {
  revenue: number; potentialRevenue: number; infrastructureCost: number;
  emergencyCost: number; incidentLoss: number; remainingBudget: number; netBusinessValue: number;
};
export type EconomicState = { runtime: Runtime; economy: Economy };
export function emptyEconomy(budget: number): Economy {
  return { revenue: 0, potentialRevenue: 0, infrastructureCost: 0, emergencyCost: 0, incidentLoss: 0, remainingBudget: budget, netBusinessValue: 0 };
}
export function createEconomicState(architecture: Architecture, scenario: Scenario): EconomicState {
  const validated = parseScenario(scenario);
  return { runtime: createPreparation(architecture), economy: emptyEconomy(validated.budget) };
}
export function activeCostPerMinute(architecture: Architecture): number {
  return architecture.resources.reduce((sum, resource) => sum + (resource.remaining === 0 ? definitions[resource.kind].cost * resource.instances : 0), 0);
}
export function advanceEconomy(state: EconomicState, scenario: Scenario, actions: readonly Action[]): {
  nextState: EconomicState; transition: TickTransition; budgetExhausted: boolean;
} {
  const previous = state.economy;
  const transition = advanceRuntime(state.runtime, scenario, actions, (runtime, action, charges) => {
    const remaining = previous.remainingBudget - charges;
    if (action.type === 'EMERGENCY_WAF' && compare(remaining, 8) <= 0) return 'Emergency WAF requires more than 8 remaining credits';
    if (action.type === 'SCALE_OUT' && compare(remaining, (activeCostPerMinute(runtime.architecture) + definitions.compute.cost) / 60) < 0) {
      return 'Insufficient budget for one post-scale infrastructure tick';
    }
    if (action.type === 'DEPLOY_RESOURCE' && compare(remaining, (activeCostPerMinute(runtime.architecture) + definitions[action.kind].cost) / 60) < 0) return 'Insufficient budget for one post-deployment infrastructure tick';
    return null;
  });
  if (!transition.snapshot) return { nextState: { runtime: transition.nextState, economy: { ...previous } }, transition, budgetExhausted: compare(previous.remainingBudget, 0) <= 0 };
  const s = transition.snapshot.requests;
  const revenue = s.successful.browse * value.browse + s.successful.order * value.order;
  const potential = s.offered.browse * value.browse + s.offered.order * value.order;
  const cost = activeCostPerMinute(transition.nextState.architecture) / 60;
  const infrastructureCost = previous.infrastructureCost + cost;
  const emergencyCost = previous.emergencyCost + transition.emergencyCharges;
  const incidentLoss = previous.incidentLoss + Math.max(0, potential - revenue) * value.incident;
  const totalRevenue = previous.revenue + revenue;
  const remainingBudget = scenario.budget + totalRevenue * reinvestmentRate(scenario) - infrastructureCost - emergencyCost;
  const economy = {
    revenue: previous.revenue + revenue, potentialRevenue: previous.potentialRevenue + potential,
    infrastructureCost, emergencyCost, incidentLoss, remainingBudget,
    netBusinessValue: previous.revenue + revenue - infrastructureCost - emergencyCost - incidentLoss,
  };
  const budgetExhausted = compare(remainingBudget, 0) <= 0;
  if (budgetExhausted) transition.nextState.status = 'FAILED';
  return { nextState: { runtime: transition.nextState, economy }, transition, budgetExhausted };
}
