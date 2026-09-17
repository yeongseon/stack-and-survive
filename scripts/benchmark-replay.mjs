#!/usr/bin/env node
/**
 * Benchmark server-side replay cost for different action strategies.
 *
 * Usage: npx tsx scripts/benchmark-replay.mjs
 */

import { blackFridayChallenge } from '../packages/scenarios/src/challenge.ts';
import { canonicalPlayerStart } from '../packages/cloud-domain/src/index.ts';
import { replayRun } from '../packages/simulation/src/replay.ts';

const ITERATIONS = 100;

const cases = [
  {
    name: 'Cache+Scale qualifying (4 actions)',
    actions: [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'SCALE_OUT', time: 57, sequence: 2 },
      { type: 'SCALE_OUT', time: 102, sequence: 3 },
    ],
  },
  {
    name: 'Prepared Layers (4 actions, edge+cache)',
    actions: [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 57, sequence: 2, x: -210, y: 0 },
      { type: 'SCALE_OUT', time: 57, sequence: 3 },
    ],
  },
  {
    name: 'Near-max actions (100 SCALE_OUT)',
    actions: Array.from({ length: 100 }, (_, i) => ({
      type: 'SCALE_OUT',
      time: Math.min(1 + i, 179),
      sequence: i,
    })),
  },
  {
    name: 'Max actions (500 SCALE_OUT)',
    actions: Array.from({ length: 500 }, (_, i) => ({
      type: 'SCALE_OUT',
      time: Math.min(1 + Math.floor(i * 178 / 499), 179),
      sequence: i,
    })),
  },
  {
    name: 'Empty actions (rejected before full replay)',
    actions: [],
  },
];

console.log(`Benchmarking replay cost (${ITERATIONS} iterations each)\n`);
console.log('Case                                    | Avg (ms) | Min (ms) | Max (ms) | Score  | Payload');
console.log('-'.repeat(95));

for (const { name, actions } of cases) {
  const payloadSize = JSON.stringify({
    nickname: 'Benchmark',
    clientRunId: 'bench-12345678',
    challengeContentHash: blackFridayChallenge.contentHash,
    actions,
  }).length;

  const times = [];
  let lastResult;
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    lastResult = replayRun({
      challenge: blackFridayChallenge,
      initialArchitecture: canonicalPlayerStart(),
      actions,
    });
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const score = lastResult.objectiveMet ? lastResult.score : 'N/A';

  console.log(
    `${name.padEnd(40)}| ${avg.toFixed(3).padStart(8)} | ${min.toFixed(3).padStart(8)} | ${max.toFixed(3).padStart(8)} | ${String(score).padStart(6)} | ${payloadSize}B`
  );
}

console.log('\nNotes:');
console.log('- MAX_ACTIONS limit is 500');
console.log('- Empty actions are rejected before replay (objective not met)');
console.log('- Payload size is the full JSON submission body');
