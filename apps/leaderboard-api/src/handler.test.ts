import { describe, expect, it, beforeEach } from 'vitest';
import { handleSubmit, handleGetTop, ApiError } from './handler';
import { InMemoryStorage } from './storage';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { replayRun } from '@stack-and-survive/simulation/replay';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import type { Action } from '@stack-and-survive/simulation/runtime';

const challengeHash = blackFridayChallenge.contentHash;
let runCounter = 0;
function nextRunId() { return `test-run-${++runCounter}-${Date.now()}`; }

// Fixed qualifying fixture: Cache+scale strategy from sprint-balance.test.ts
// Expected: 180s complete, 100% availability, score 8500
const qualifyingActions: Action[] = [
  { type: 'SCALE_OUT', time: 16, sequence: 0 },
  { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
  { type: 'SCALE_OUT', time: 57, sequence: 2 },
  { type: 'SCALE_OUT', time: 102, sequence: 3 },
];

// Verify fixture assumptions at module level — if balance changes, this MUST fail loudly
const qualifyingResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: qualifyingActions });
const noActionResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: [] });

it('fixture: cache-scale strategy qualifies with expected score', () => {
  expect(qualifyingResult.objectiveMet).toBe(true);
  expect(qualifyingResult.status).toBe('COMPLETED');
  expect(qualifyingResult.elapsed).toBe(180);
  expect(qualifyingResult.score).toBe(8500);
});

it('fixture: no-action run fails objective', () => {
  expect(noActionResult.objectiveMet).toBe(false);
});

function validSubmission(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    nickname: 'TestPlayer',
    clientRunId: nextRunId(),
    challengeContentHash: challengeHash,
    actions: qualifyingActions,
    ...overrides,
  });
}

describe('handleSubmit', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('accepts a qualifying run with rank context', async () => {
    const result = await handleSubmit(storage, validSubmission());
    expect(result.accepted).toBe(true);
    expect(result.rankContext.rank).toBe(1);
    expect(result.rankContext.totalEntries).toBe(1);
    expect(result.rankContext.score).toBe(8500);
    expect(result.rankContext.pointsToNextRank).toBeNull();
    expect(result.top.length).toBe(1);
    expect(result.top[0].nickname).toBe('TestPlayer');
  });

  it('same clientRunId retry returns existing rank idempotently', async () => {
    const runId = nextRunId();
    const first = await handleSubmit(storage, validSubmission({ clientRunId: runId }));
    const retry = await handleSubmit(storage, validSubmission({ clientRunId: runId }));
    expect(retry.accepted).toBe(true);
    expect(retry.rankContext.score).toBe(first.rankContext.score);
    expect(retry.rankContext.rank).toBe(first.rankContext.rank);
    const top = await storage.getTop(challengeHash, 100);
    expect(top.filter(e => e.clientRunId === runId)).toHaveLength(1);
  });

  it('different clientRunId with identical actions are both accepted', async () => {
    const r1 = await handleSubmit(storage, validSubmission({ clientRunId: nextRunId() }));
    const r2 = await handleSubmit(storage, validSubmission({ clientRunId: nextRunId() }));
    expect(r1.accepted).toBe(true);
    expect(r2.accepted).toBe(true);
    const top = await storage.getTop(challengeHash, 100);
    expect(top).toHaveLength(2);
  });

  it('different nickname with identical actions both accepted', async () => {
    await handleSubmit(storage, validSubmission({ nickname: 'Alice', clientRunId: nextRunId() }));
    await handleSubmit(storage, validSubmission({ nickname: 'Bob', clientRunId: nextRunId() }));
    const top = await handleGetTop(storage, challengeHash);
    expect(top.entries.length).toBe(2);
  });

  it('provides rank context with pointsToNextRank for second entry', async () => {
    // Layered strategy: score 9474
    const layeredActions: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 57, sequence: 2, x: -210, y: 0 },
      { type: 'SCALE_OUT', time: 57, sequence: 3 },
    ];
    await handleSubmit(storage, validSubmission({ nickname: 'Top', clientRunId: nextRunId(), actions: layeredActions }));
    const r2 = await handleSubmit(storage, validSubmission({ nickname: 'Second', clientRunId: nextRunId() }));
    expect(r2.rankContext.rank).toBe(2);
    expect(r2.rankContext.totalEntries).toBe(2);
    expect(r2.rankContext.pointsToNextRank).toBe(9474 - 8500);
  });

  it('rejects no-action run (objective not met)', async () => {
    await expect(handleSubmit(storage, validSubmission({ actions: [] }))).rejects.toThrow('Objective not met');
  });

  it('rejects unknown challenge', async () => {
    await expect(handleSubmit(storage, validSubmission({ challengeContentHash: 'unknown' }))).rejects.toThrow('Unsupported challenge');
  });

  it('rejects empty nickname', async () => {
    await expect(handleSubmit(storage, validSubmission({ nickname: '' }))).rejects.toThrow();
  });

  it('rejects short nickname', async () => {
    await expect(handleSubmit(storage, validSubmission({ nickname: 'A' }))).rejects.toThrow('2-16');
  });

  it('rejects nickname with spaces', async () => {
    await expect(handleSubmit(storage, validSubmission({ nickname: 'ab cd' }))).rejects.toThrow('letters');
  });

  it('rejects missing clientRunId', async () => {
    const body = JSON.stringify({ nickname: 'Test', challengeContentHash: challengeHash, actions: qualifyingActions });
    await expect(handleSubmit(storage, body)).rejects.toThrow();
  });

  it('rejects short clientRunId', async () => {
    await expect(handleSubmit(storage, validSubmission({ clientRunId: 'short' }))).rejects.toThrow('clientRunId');
  });

  it('rejects oversized body', async () => {
    await expect(handleSubmit(storage, 'x'.repeat(200_001))).rejects.toThrow();
  });

  it('rejects unsupported action types', async () => {
    await expect(handleSubmit(storage, validSubmission({ actions: [{ type: 'HACK', time: 0, sequence: 0 }] }))).rejects.toThrow();
  });

  it('rejects actions beyond scenario duration', async () => {
    await expect(handleSubmit(storage, validSubmission({ actions: [{ type: 'SCALE_OUT', time: 999, sequence: 0 }] }))).rejects.toThrow();
  });

  it('rejects malformed JSON', async () => {
    await expect(handleSubmit(storage, '{not json')).rejects.toThrow();
  });

  it('rejects retry with same clientRunId but different actions', async () => {
    const runId = nextRunId();
    await handleSubmit(storage, validSubmission({ clientRunId: runId }));
    // Layered strategy has different actions → different digest
    const different: Action[] = [
      { type: 'SCALE_OUT', time: 16, sequence: 0 },
      { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
      { type: 'DEPLOY_RESOURCE', kind: 'edge', time: 57, sequence: 2, x: -210, y: 0 },
      { type: 'SCALE_OUT', time: 57, sequence: 3 },
    ];
    await expect(handleSubmit(storage, validSubmission({ clientRunId: runId, actions: different }))).rejects.toThrow('already used');
  });

  it('rejects retry with same clientRunId but different nickname', async () => {
    const runId = nextRunId();
    await handleSubmit(storage, validSubmission({ clientRunId: runId, nickname: 'Alice' }));
    await expect(handleSubmit(storage, validSubmission({ clientRunId: runId, nickname: 'Bob' }))).rejects.toThrow('already used');
  });
});

describe('handleGetTop', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('returns available:true for empty board', async () => {
    const result = await handleGetTop(storage, challengeHash);
    expect(result.available).toBe(true);
    expect(result.entries).toEqual([]);
  });

  it('returns entries after submission', async () => {
    await handleSubmit(storage, validSubmission({ nickname: 'AA', clientRunId: nextRunId() }));
    const result = await handleGetTop(storage, challengeHash);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].nickname).toBe('AA');
    expect(result.entries[0].score).toBe(8500);
  });

  it('rejects unknown challenge hash', async () => {
    await expect(handleGetTop(storage, 'nonexistent')).rejects.toThrow('Unsupported challenge');
  });
});
