import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { infrastructureScalingScenario } from '@stack-and-survive/scenarios';
import { createSimulation } from '../results';
import { deriveResourceStates } from './metrics';
it('operational summaries retain actual tier and replica capacity and cost', () => {
  const architecture = baseline(2); architecture.resources[1].tier = 2;
  architecture.resources[2].tier = 3; architecture.resources[2].readReplicas = 1;
  const state = createSimulation(architecture, infrastructureScalingScenario);
  state.attribution.ticks = 1; state.attribution.peaks.sqlWrite = 1.2;
  const resources = deriveResourceStates(state);
  expect(resources.find(r=>r.id==='compute')).toMatchObject({capacity:480,estimatedCostUnits:18});
  expect(resources.find(r=>r.id==='database')).toMatchObject({capacity:830,estimatedCostUnits:44,utilization:1.2,health:'critical'});
});
