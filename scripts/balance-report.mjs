#!/usr/bin/env node
/**
 * Print deterministic balance simulation results for documentation.
 * Usage: npx tsx scripts/balance-report.mjs
 */

import { simulateScenario } from '../packages/simulation/src/results.ts';
import { canonicalPlayerStart } from '../packages/cloud-domain/src/index.ts';
import { blackFridayChallenge } from '../packages/scenarios/src/challenge.ts';

const scenario = blackFridayChallenge.workload;
const run = (actions) => simulateScenario(canonicalPlayerStart(), scenario, actions);

const strategies = {
  doNothing: [],
  scaleOnly: [
    { type: 'SCALE_OUT', time: 5, sequence: 0 },
    { type: 'SCALE_OUT', time: 30, sequence: 1 },
    { type: 'SCALE_OUT', time: 60, sequence: 2 },
  ],
  cacheScale: [
    { type: 'SCALE_OUT', time: 16, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
    { type: 'SCALE_OUT', time: 57, sequence: 2 },
    { type: 'SCALE_OUT', time: 102, sequence: 3 },
  ],
  edgeScale: [
    { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 5, sequence: 0, x: -200, y: 0 },
    { type: 'SCALE_OUT', time: 16, sequence: 1 },
    { type: 'SCALE_OUT', time: 57, sequence: 2 },
    { type: 'SCALE_OUT', time: 102, sequence: 3 },
  ],
  balanced: [
    { type: 'SCALE_OUT', time: 16, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
    { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 57, sequence: 2, x: -210, y: 0 },
    { type: 'SCALE_OUT', time: 57, sequence: 3 },
  ],
  earlyAllIn: [
    { type: 'SCALE_OUT', time: 1, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 1, sequence: 1, x: 190, y: -100 },
    { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 1, sequence: 2, x: -210, y: 0 },
    { type: 'SCALE_OUT', time: 10, sequence: 3 },
  ],
  lateScale: [
    { type: 'SCALE_OUT', time: 100, sequence: 0 },
    { type: 'SCALE_OUT', time: 120, sequence: 1 },
    { type: 'SCALE_OUT', time: 140, sequence: 2 },
  ],
  rateLimitOnly: [
    { type: 'RATE_LIMIT', enabled: true, time: 1, sequence: 0 },
  ],
};

const results = Object.fromEntries(
  Object.entries(strategies).map(([name, actions]) => [name, run(actions)])
);

console.log(`Scenario: ${scenario.id} (balance ${scenario.balanceVersion}, budget ${scenario.budget}, duration ${scenario.duration}s)`);
console.log(`Architecture: canonicalPlayerStart()`);
console.log();
console.log('| Strategy | Status | Elapsed | Availability | Score | Infra Cost | Budget Left |');
console.log('|----------|--------|---------|-------------|-------|------------|-------------|');

for (const [name, r] of Object.entries(results)) {
  console.log(
    `| ${name} | ${r.status} | ${r.elapsedTime} | ${(r.metrics.availability * 100).toFixed(2)}% | ${r.score} | ${r.economy.infrastructureCost.toFixed(2)} | ${r.economy.remainingBudget.toFixed(2)} |`
  );
}

// JSON output for machine consumption
console.log('\n```json');
console.log(JSON.stringify({
  scenario: scenario.id,
  balanceVersion: scenario.balanceVersion,
  budget: scenario.budget,
  duration: scenario.duration,
  strategies: Object.fromEntries(
    Object.entries(results).map(([name, r]) => [name, {
      status: r.status,
      elapsed: r.elapsedTime,
      availability: r.metrics.availability,
      score: r.score,
      infraCost: r.economy.infrastructureCost,
      remainingBudget: r.economy.remainingBudget,
    }])
  ),
}, null, 2));
console.log('```');
