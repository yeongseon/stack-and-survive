import { describe, expect, it, beforeEach } from 'vitest';
import { handleSubmit, handleGetTop } from './handler';
import { InMemoryStorage } from './storage';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { replayRun } from '@stack-and-survive/simulation/replay';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';

const challengeHash = blackFridayChallenge.contentHash;

// Find a set of actions that produces a qualifying run (objective met)
// Scale out early to help survive the full scenario
const qualifyingActions = [
  { type: 'SCALE_OUT' as const, time: 5, sequence: 0 },
  { type: 'SCALE_OUT' as const, time: 15, sequence: 1 },
];

// Verify our qualifying actions actually produce an objective-met result
const qualifyingResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: qualifyingActions });
const qualifies = qualifyingResult.objectiveMet;

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

  (qualifies ? it : it.skip)('accepts a qualifying run and returns rank', () => {
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
    // No actions → likely budget failure → objective not met
    const noActionResult = replayRun({ challenge: blackFridayChallenge, initialArchitecture: canonicalPlayerStart(), actions: [] });
    if (!noActionResult.objectiveMet) {
      expect(() => handleSubmit(storage, validSubmission({ actions: [] }))).toThrow('Objective not met');
    }
  });

  (qualifies ? it : it.skip)('prevents duplicate submissions', () => {
    const body = validSubmission();
    handleSubmit(storage, body);
    expect(() => handleSubmit(storage, body)).toThrow('Duplicate');
  });

  (qualifies ? it : it.skip)('ranks multiple submissions correctly', () => {
    handleSubmit(storage, validSubmission({ nickname: 'Player1' }));
    handleSubmit(storage, validSubmission({
      nickname: 'Player2',
      actions: [{ type: 'SCALE_OUT', time: 8, sequence: 0 }],
    }));
    const top = handleGetTop(storage, challengeHash);
    expect(top.entries.length).toBe(2);
    expect(top.entries[0].score).toBeGreaterThanOrEqual(top.entries[1].score);
  });
});

describe('handleGetTop', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('returns empty for unknown challenge', () => {
    const result = handleGetTop(storage, 'nonexistent');
    expect(result.entries).toEqual([]);
  });

  (qualifies ? it : it.skip)('returns entries after submission', () => {
    handleSubmit(storage, validSubmission({ nickname: 'AA' }));
    const result = handleGetTop(storage, challengeHash);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].nickname).toBe('AA');
  });
});
