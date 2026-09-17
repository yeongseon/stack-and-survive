import { describe, expect, it } from 'vitest';
import { parseLeaderboard, validateNickname } from './leaderboard';
import { parseHistory, emptyHistory } from './run-history';
import { browserSaveRepository } from './persistence';
import { createController, type Clock } from './controller';
import { loadPendingSubmission } from './global-leaderboard';

describe('localStorage corruption: leaderboard', () => {
  it.each([
    ['null', null],
    ['empty string', ''],
    ['broken JSON', '{broken'],
    ['empty array', '[]'],
    ['wrong version', '{"version":99,"entries":[]}'],
    ['missing entries', '{"version":1}'],
    ['entries is string', '{"version":1,"entries":"not array"}'],
    ['huge payload', 'x'.repeat(500001)],
    ['XSS in nickname', '{"version":1,"entries":[{"nickname":"<script>alert(1)</script>","score":100,"availability":0.5,"timestamp":1,"runId":"a","challengeCanonical":"b"}]}'],
    ['negative score', '{"version":1,"entries":[{"nickname":"Test","score":-1,"availability":0.5,"timestamp":1,"runId":"a","challengeCanonical":"b"}]}'],
    ['score over 10000', '{"version":1,"entries":[{"nickname":"Test","score":99999,"availability":0.5,"timestamp":1,"runId":"a","challengeCanonical":"b"}]}'],
    ['availability over 1', '{"version":1,"entries":[{"nickname":"Test","score":100,"availability":1.5,"timestamp":1,"runId":"a","challengeCanonical":"b"}]}'],
    ['NaN score', '{"version":1,"entries":[{"nickname":"Test","score":"NaN","availability":0.5,"timestamp":1,"runId":"a","challengeCanonical":"b"}]}'],
    ['single char nickname', '{"version":1,"entries":[{"nickname":"X","score":100,"availability":0.5,"timestamp":1,"runId":"a","challengeCanonical":"b"}]}'],
  ])('recovers gracefully from %s', (_label, input) => {
    const result = parseLeaderboard(input);
    expect(result).toBeDefined();
    expect(result.version).toBe(1);
    expect(Array.isArray(result.entries)).toBe(true);
    // Must not crash — entries may be empty or filtered
    for (const entry of result.entries) {
      expect(entry.score).toBeGreaterThanOrEqual(0);
      expect(entry.score).toBeLessThanOrEqual(10000);
      expect(entry.availability).toBeGreaterThanOrEqual(0);
      expect(entry.availability).toBeLessThanOrEqual(1);
    }
  });
});

describe('localStorage corruption: run history', () => {
  it.each([
    ['null', null],
    ['empty string', ''],
    ['broken JSON', '{{{{'],
    ['wrong version', '{"version":2,"runs":[],"bests":[],"highestLevel":0}'],
    ['missing fields', '{"version":1}'],
    ['huge payload', 'x'.repeat(2000001)],
    ['runs is string', '{"version":1,"runs":"bad","bests":[],"highestLevel":0}'],
    ['oversized runs', JSON.stringify({ version: 1, runs: Array(21).fill({}), bests: [], highestLevel: 0 })],
  ])('recovers gracefully from %s', (_label, input) => {
    const result = parseHistory(input);
    expect(result).toEqual(emptyHistory());
  });
});

describe('localStorage corruption: architecture save', () => {
  it.each([
    ['broken JSON', '{bad'],
    ['wrong version', '{"saveVersion":2}'],
    ['missing architecture', '{"saveVersion":1}'],
    ['null architecture', '{"saveVersion":1,"architecture":null}'],
  ])('load throws on %s (controller handles gracefully)', (_label, saved) => {
    const repository = browserSaveRepository(() => ({
      getItem: () => saved,
      setItem: () => {},
      removeItem: () => {},
    }));
    expect(() => repository.load()).toThrow();
  });

  it('controller survives corrupt save and allows recovery', () => {
    let saved: string | null = '{bad';
    const repository = browserSaveRepository(() => ({
      getItem: () => saved,
      setItem: (_key: string, value: string) => { saved = value; },
      removeItem: () => { saved = null; },
    }));
    const timer: Clock = { start: () => () => {} };
    const controller = createController(timer, repository);

    // Controller loaded despite corrupt save
    expect(controller.getSnapshot().saveMessage).toContain('Load failed');
    expect(controller.getSnapshot().state.runtime.status).toBe('PREPARATION');

    // Auto-save is blocked until explicit save
    controller.move('compute', { x: 40, y: 0 });
    expect(saved).toBe('{bad'); // Still corrupt — not overwritten

    // Explicit save overwrites corrupt data
    controller.saveArchitecture();
    expect(controller.getSnapshot().saveMessage).toContain('saved locally');
    expect(saved).not.toBe('{bad');
    controller.destroy();
  });
});

describe('localStorage corruption: pending submission', () => {
  function withMockStorage(value: string | null, fn: () => void) {
    let removed = false;
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => value, setItem: () => {}, removeItem: () => { removed = true; } },
      writable: true, configurable: true,
    });
    try { fn(); } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: original, writable: true, configurable: true });
    }
    return removed;
  }

  it.each([
    ['broken JSON', '{bad'],
    ['null', null],
    ['empty object', '{}'],
    ['missing nickname', '{"clientRunId":"test-run-id","challengeContentHash":"y","actions":[]}'],
    ['missing clientRunId', '{"nickname":"AB","challengeContentHash":"y","actions":[]}'],
    ['actions not array', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":"bad"}'],
    ['short nickname', '{"nickname":"A","clientRunId":"test-run-id","challengeContentHash":"y","actions":[]}'],
    ['long nickname', `{"nickname":"${'a'.repeat(17)}","clientRunId":"test-run-id","challengeContentHash":"y","actions":[]}`],
    ['short clientRunId', '{"nickname":"AB","clientRunId":"short","challengeContentHash":"y","actions":[]}'],
    ['empty challengeContentHash', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"","actions":[]}'],
    ['actions [null]', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":[null]}'],
    ['unknown action type', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":[{"type":"HACK","time":0,"sequence":0}]}'],
    ['NaN action time', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":[{"type":"SCALE_OUT","time":"NaN","sequence":0}]}'],
    ['negative sequence', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":[{"type":"SCALE_OUT","time":0,"sequence":-1}]}'],
    ['Infinity coordinate', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":[{"type":"DEPLOY_RESOURCE","kind":"cache","time":0,"sequence":0,"x":1e999,"y":0}]}'],
    ['invalid deploy kind', '{"nickname":"AB","clientRunId":"test-run-id","challengeContentHash":"y","actions":[{"type":"DEPLOY_RESOURCE","kind":"hack","time":0,"sequence":0,"x":0,"y":0}]}'],
    ['huge action array', JSON.stringify({ nickname: 'AB', clientRunId: 'test-run-id', challengeContentHash: 'y', actions: Array(501).fill({ type: 'SCALE_OUT', time: 0, sequence: 0 }) })],
  ])('loadPendingSubmission returns null and clears invalid data for %s', (_label, value) => {
    const removed = withMockStorage(value, () => {
      expect(loadPendingSubmission()).toBeNull();
    });
    // Invalid data should be cleared to prevent endless retry
    if (value !== null) expect(removed).toBe(true);
  });

  it('accepts valid pending submission', () => {
    const valid = JSON.stringify({
      nickname: 'TestPlayer',
      clientRunId: 'test-run-12345678',
      challengeContentHash: 'fnv1a64:abc123',
      actions: [{ type: 'SCALE_OUT', time: 16, sequence: 0 }],
    });
    withMockStorage(valid, () => {
      const result = loadPendingSubmission();
      expect(result).not.toBeNull();
      expect(result!.nickname).toBe('TestPlayer');
      expect(result!.actions).toHaveLength(1);
    });
  });
});

describe('nickname validation: adversarial inputs', () => {
  it.each([
    ['<script>alert(1)</script>', true],
    ['<img src=x onerror=alert(1)>', true],
    ['" onmouseover="alert(1)', true],
    ["'; DROP TABLE users; --", true],
    ['a'.repeat(17), true],
    ['A', true],
    ['', true],
    ['   ', true],
    ['ab cd', true],
    ['good-name_123', false],
    ['AB', false],
    ['a'.repeat(16), false],
  ])('validates "%s" -> rejected: %s', (input, shouldReject) => {
    const result = validateNickname(input);
    if (shouldReject) {
      expect(result).not.toBeNull(); // error message
    } else {
      expect(result).toBeNull(); // valid
    }
  });
});
