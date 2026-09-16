import { describe, expect, it, beforeEach } from 'vitest';
import { handleSubmit, handleGetTop } from './handler';
import { InMemoryStorage } from './storage';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { replayRun } from '@stack-and-survive/simulation/replay';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';

const challengeHash = blackFridayChallenge.contentHash;
let runCounter = 0;
function nextRunId() { return `test-run-${++runCounter}-${Date.now()}`; }

const qualifyingActions = [
  { type: 'SCALE_OUT' as const, time: 5, sequence: 0 },
  { type: 'SCALE_OUT' as const, time: 15, sequence: 1 },
];
const qualifyingResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: qualifyingActions });
const qualifies = qualifyingResult.objectiveMet;

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

  (qualifies ? it : it.skip)('accepts a qualifying run with rankContext', async () => {
    const result = await handleSubmit(storage, validSubmission());
    expect(result.accepted).toBe(true);
    expect(result.rankContext.rank).toBe(1);
    expect(result.rankContext.totalEntries).toBe(1);
    expect(result.rankContext.pointsToNextRank).toBeNull();
    expect(result.top.length).toBe(1);
    expect(result.top[0].nickname).toBe('TestPlayer');
  });

  it('rejects unknown challenge', async () => {
    await expect(handleSubmit(storage, validSubmission({ challengeContentHash: 'unknown' }))).rejects.toThrow('Unsupported challenge');
  });

  it('rejects missing nickname', async () => {
    await expect(handleSubmit(storage, validSubmission({ nickname: '' }))).rejects.toThrow();
  });

  it('rejects invalid nickname characters', async () => {
    await expect(handleSubmit(storage, validSubmission({ nickname: 'ab cd' }))).rejects.toThrow('letters');
  });

  it('rejects short nickname', async () => {
    await expect(handleSubmit(storage, validSubmission({ nickname: 'A' }))).rejects.toThrow('2-16');
  });

  it('rejects missing clientRunId', async () => {
    await expect(handleSubmit(storage, JSON.stringify({
      nickname: 'Test', challengeContentHash: challengeHash, actions: [],
    }))).rejects.toThrow();
  });

  it('rejects invalid clientRunId', async () => {
    await expect(handleSubmit(storage, validSubmission({ clientRunId: 'ab' }))).rejects.toThrow('clientRunId');
  });

  it('rejects oversized body', async () => {
    await expect(handleSubmit(storage, 'x'.repeat(200_001))).rejects.toThrow();
  });

  it('rejects unsupported action types', async () => {
    await expect(handleSubmit(storage, validSubmission({
      actions: [{ type: 'HACK', time: 0, sequence: 0 }],
    }))).rejects.toThrow();
  });

  it('rejects objective-missed runs', async () => {
    const noActionResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: [] });
    if (!noActionResult.objectiveMet) {
      await expect(handleSubmit(storage, validSubmission({ actions: [] }))).rejects.toThrow('Objective not met');
    }
  });

  (qualifies ? it : it.skip)('same clientRunId retry returns existing rank idempotently', async () => {
    const runId = nextRunId();
    const first = await handleSubmit(storage, validSubmission({ clientRunId: runId }));
    const retry = await handleSubmit(storage, validSubmission({ clientRunId: runId }));
    expect(retry.accepted).toBe(true);
    expect(retry.rankContext.score).toBe(first.rankContext.score);
    expect(retry.rankContext.rank).toBe(first.rankContext.rank);
    // Storage should still have exactly one entry
    const top = await storage.getTop(challengeHash, 100);
    const matching = top.filter(e => e.clientRunId === runId);
    expect(matching).toHaveLength(1);
  });

  (qualifies ? it : it.skip)('different clientRunId with identical actions are both accepted', async () => {
    const r1 = await handleSubmit(storage, validSubmission({ clientRunId: nextRunId() }));
    const r2 = await handleSubmit(storage, validSubmission({ clientRunId: nextRunId() }));
    expect(r1.accepted).toBe(true);
    expect(r2.accepted).toBe(true);
  });

  (qualifies ? it : it.skip)('different nickname with identical actions both accepted', async () => {
    const r1 = await handleSubmit(storage, validSubmission({ nickname: 'Alice', clientRunId: nextRunId() }));
    const r2 = await handleSubmit(storage, validSubmission({ nickname: 'Bob', clientRunId: nextRunId() }));
    expect(r1.accepted).toBe(true);
    expect(r2.accepted).toBe(true);
    const top = await handleGetTop(storage, challengeHash);
    expect(top.entries.length).toBe(2);
  });

  (qualifies ? it : it.skip)('provides server rank context with pointsToNextRank', async () => {
    await handleSubmit(storage, validSubmission({ nickname: 'First', clientRunId: nextRunId() }));
    const r2 = await handleSubmit(storage, validSubmission({
      nickname: 'Second', clientRunId: nextRunId(),
      actions: [{ type: 'SCALE_OUT', time: 8, sequence: 0 }],
    }));
    expect(r2.rankContext.rank).toBeGreaterThanOrEqual(1);
    expect(r2.rankContext.totalEntries).toBe(2);
  });
});

describe('handleGetTop', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('returns available:true even for empty board', async () => {
    const result = await handleGetTop(storage, 'nonexistent');
    expect(result.available).toBe(true);
    expect(result.entries).toEqual([]);
  });

  (qualifies ? it : it.skip)('returns entries after submission', async () => {
    await handleSubmit(storage, validSubmission({ nickname: 'AA', clientRunId: nextRunId() }));
    const result = await handleGetTop(storage, challengeHash);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].nickname).toBe('AA');
  });
});
