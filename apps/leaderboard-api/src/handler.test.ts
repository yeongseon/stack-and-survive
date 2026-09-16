import { describe, expect, it, beforeEach } from 'vitest';
import { handleSubmit, handleGetTop } from './handler';
import { InMemoryStorage } from './storage';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { replayRun } from '@stack-and-survive/simulation/replay';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';

const challengeHash = blackFridayChallenge.contentHash;

// Measured balance 0.3 cache-scale and prepared-layer schedules, from sprint-balance.test.ts.
const qualifyingActions = [
  { type: 'SCALE_OUT' as const, time: 16, sequence: 0 },
  { type: 'DEPLOY_RESOURCE' as const, kind: 'cache' as const, x: 190, y: -100, time: 17, sequence: 1 },
  { type: 'SCALE_OUT' as const, time: 57, sequence: 2 },
  { type: 'SCALE_OUT' as const, time: 102, sequence: 3 },
];
const protectedActions = [
  ...qualifyingActions.slice(0, 2),
  { type: 'DEPLOY_RESOURCE' as const, kind: 'edge' as const, x: -210, y: 0, time: 57, sequence: 2 },
  { type: 'SCALE_OUT' as const, time: 57, sequence: 3 },
];

function validSubmission(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    nickname: 'TestPlayer',
    challengeContentHash: challengeHash,
    actions: qualifyingActions,
    ...overrides,
  });
}

describe('handleSubmit', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('accepts a qualifying run and returns rank', () => {
    const qualifyingResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: qualifyingActions });
    expect(qualifyingResult.objectiveMet).toBe(true);
    const result = handleSubmit(storage, validSubmission());
    expect(result.accepted).toBe(true);
    expect(result.rank).toBe(1);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10000);
    expect(result.top.length).toBeGreaterThanOrEqual(1);
    expect(result.top[0].nickname).toBe('TestPlayer');
  });

  it('rejects unknown challenge', () => {
    expect(() => handleSubmit(storage, validSubmission({ challengeContentHash: 'unknown-hash' }))).toThrow('Unsupported challenge');
  });

  it('rejects missing nickname', () => {
    expect(() => handleSubmit(storage, validSubmission({ nickname: '' }))).toThrow();
  });

  it('rejects invalid nickname characters', () => {
    expect(() => handleSubmit(storage, validSubmission({ nickname: 'ab cd' }))).toThrow('letters');
  });

  it('rejects short nickname', () => {
    expect(() => handleSubmit(storage, validSubmission({ nickname: 'A' }))).toThrow('2-16');
  });

  it('rejects oversized body', () => {
    expect(() => handleSubmit(storage, 'x'.repeat(200_001))).toThrow();
  });

  it('rejects unsupported action types', () => {
    expect(() => handleSubmit(storage, validSubmission({
      actions: [{ type: 'HACK', time: 0, sequence: 0 }],
    }))).toThrow();
  });

  it('rejects actions beyond scenario duration', () => {
    expect(() => handleSubmit(storage, validSubmission({
      actions: [{ type: 'SCALE_OUT', time: 999, sequence: 0 }],
    }))).toThrow();
  });

  it('rejects objective-missed runs', () => {
    const noActionResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: [] });
    expect(noActionResult.objectiveMet).toBe(false);
    expect(() => handleSubmit(storage, validSubmission({ actions: [] }))).toThrow('Objective not met');
  });

  it('prevents duplicate submissions', () => {
    const body = validSubmission();
    handleSubmit(storage, body);
    expect(() => handleSubmit(storage, body)).toThrow('Duplicate');
  });

  it('ranks multiple submissions correctly', () => {
    handleSubmit(storage, validSubmission({ nickname: 'Player1' }));
    handleSubmit(storage, validSubmission({
      nickname: 'Player2',
      actions: protectedActions,
    }));
    const top = handleGetTop(storage, challengeHash);
    expect(top.entries.length).toBe(2);
    expect(top.entries[0].nickname).toBe('Player2');
    expect(top.entries[0].score).toBe(9474);
    expect(top.entries[1].nickname).toBe('Player1');
    expect(top.entries[1].score).toBe(8500);
  });
});

describe('handleGetTop', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('returns empty for unknown challenge', () => {
    const result = handleGetTop(storage, 'nonexistent');
    expect(result.entries).toEqual([]);
  });

  it('returns entries after submission', () => {
    handleSubmit(storage, validSubmission({ nickname: 'AA' }));
    const result = handleGetTop(storage, challengeHash);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].nickname).toBe('AA');
  });
});
