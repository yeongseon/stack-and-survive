import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileStorage } from './file-storage';
import type { StoredEntry } from './storage';

function tmpDir() { return mkdtempSync(join(tmpdir(), 'lb-test-')); }

function entry(overrides: Partial<StoredEntry> = {}): StoredEntry {
  return {
    id: 'test-id', clientRunId: `run-${Math.random().toString(36).slice(2)}`, nickname: 'Tester',
    score: 5000, availability: 0.95, submittedAt: Date.now(),
    challengeHash: 'ch-hash', actionDigest: 'digest-abc', ...overrides,
  };
}

describe('FileStorage', () => {
  let dir: string;
  let filePath: string;
  beforeEach(() => { dir = tmpDir(); filePath = join(dir, 'lb.json'); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('starts empty when file does not exist', async () => {
    const s = new FileStorage(filePath);
    expect(await s.getTop('ch-hash', 10)).toEqual([]);
  });

  it('persists entries and survives restart', async () => {
    const s1 = new FileStorage(filePath);
    const e = entry();
    await s1.add(e);
    expect(await s1.getTop('ch-hash', 10)).toHaveLength(1);

    // New instance reads from disk
    const s2 = new FileStorage(filePath);
    const top = await s2.getTop('ch-hash', 10);
    expect(top).toHaveLength(1);
    expect(top[0].clientRunId).toBe(e.clientRunId);
    expect(top[0].score).toBe(5000);
  });

  it('prevents duplicate clientRunId after restart', async () => {
    const s1 = new FileStorage(filePath);
    const e = entry({ clientRunId: 'dup-run' });
    await s1.add(e);

    const s2 = new FileStorage(filePath);
    const result = await s2.add(entry({ clientRunId: 'dup-run' }));
    expect(result.added).toBe(false);
  });

  it('preserves ranking order after restart', async () => {
    const s1 = new FileStorage(filePath);
    await s1.add(entry({ clientRunId: 'r1', score: 3000 }));
    await s1.add(entry({ clientRunId: 'r2', score: 7000 }));
    await s1.add(entry({ clientRunId: 'r3', score: 5000 }));

    const s2 = new FileStorage(filePath);
    const top = await s2.getTop('ch-hash', 10);
    expect(top.map(e => e.score)).toEqual([7000, 5000, 3000]);
  });

  it('isolates challenges', async () => {
    const s = new FileStorage(filePath);
    await s.add(entry({ clientRunId: 'a', challengeHash: 'ch-A' }));
    await s.add(entry({ clientRunId: 'b', challengeHash: 'ch-B' }));
    expect(await s.getTop('ch-A', 10)).toHaveLength(1);
    expect(await s.getTop('ch-B', 10)).toHaveLength(1);
  });

  it('quarantines corrupted file and starts empty', async () => {
    writeFileSync(filePath, 'not valid json!!!');
    const s = new FileStorage(filePath);
    expect(await s.getTop('ch-hash', 10)).toEqual([]);
    // Original file should be quarantined
    const files = readdirSync(dir);
    expect(files.some(f => f.includes('.corrupt.'))).toBe(true);
  });

  it('filters invalid entries on startup', async () => {
    const valid = entry({ clientRunId: 'good' });
    const invalid = { id: 123, score: 'not a number' }; // bad types
    writeFileSync(filePath, JSON.stringify([valid, invalid]));

    const s = new FileStorage(filePath);
    const top = await s.getTop('ch-hash', 10);
    expect(top).toHaveLength(1);
    expect(top[0].clientRunId).toBe('good');
  });

  it('does not update memory if disk write fails', async () => {
    const s = new FileStorage(filePath);
    await s.add(entry({ clientRunId: 'first' }));

    // Make directory read-only to force write failure
    const badPath = join(dir, 'readonly', 'nested', 'lb.json');
    const s2 = new FileStorage(badPath);
    // Manually break the path by making a file where dir should be
    writeFileSync(join(dir, 'readonly'), 'block');
    try {
      await s2.add(entry({ clientRunId: 'should-fail' }));
      expect.fail('Should have thrown');
    } catch {
      // Memory should be unchanged (empty)
      expect(await s2.getTop('ch-hash', 10)).toEqual([]);
    }
  });

  it('handles stale .tmp file gracefully', async () => {
    writeFileSync(filePath + '.tmp', 'stale temp');
    const s = new FileStorage(filePath);
    await s.add(entry({ clientRunId: 'new' }));
    expect(await s.getTop('ch-hash', 10)).toHaveLength(1);
    expect(existsSync(filePath)).toBe(true);
  });

  it('computes rank context correctly', async () => {
    const s = new FileStorage(filePath);
    const e1 = entry({ clientRunId: 'r1', score: 8000 });
    const e2 = entry({ clientRunId: 'r2', score: 5000 });
    await s.add(e1);
    await s.add(e2);
    const rank = await s.getRankContext('ch-hash', e2);
    expect(rank.rank).toBe(2);
    expect(rank.totalEntries).toBe(2);
    expect(rank.pointsToNextRank).toBe(3000);
  });
});
