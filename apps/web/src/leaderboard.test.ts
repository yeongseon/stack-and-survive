import { describe, expect, it } from 'vitest';
import { validateNickname, emptyLeaderboard, parseLeaderboard, addEntry, challengeEntries, rankRun, personalBest, qualifiesForLeaderboard, entryFromRun, LEADERBOARD_LIMIT, type LeaderboardEntry } from './leaderboard';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import type { RunSummary } from './run-history';

const canonical = blackFridayChallenge.canonical;

function fakeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return { nickname: 'Player', score: 5000, availability: 0.95, timestamp: 1000, runId: `run-${Math.random().toString(36).slice(2)}`, challengeCanonical: canonical, ...overrides };
}

function fakeRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return { id: `run-${Math.random().toString(36).slice(2)}`, challenge: blackFridayChallenge, status: 'COMPLETED', elapsed: 180, objectiveMet: true, availability: 0.95, cost: 50, emergencyCost: 0, nbv: 100, score: 5000, offered: 1000, served: 950, lost: 50, peaks: { app: 150, sqlRead: 180, sqlWrite: 70 }, initialArchitecture: { resources: [], connections: [] }, finalArchitecture: { resources: [], connections: [] }, actions: [], actionLog: [], ...overrides } as RunSummary;
}

describe('nickname validation', () => {
  it('accepts valid nicknames', () => {
    expect(validateNickname('AB')).toBeNull();
    expect(validateNickname('Player_One-2')).toBeNull();
    expect(validateNickname('ABCDEFGHIJKLMNOP')).toBeNull();
  });
  it('rejects too short', () => { expect(validateNickname('A')).toContain('at least 2'); });
  it('rejects too long', () => { expect(validateNickname('ABCDEFGHIJKLMNOPQ')).toContain('at most 16'); });
  it('rejects special characters', () => { expect(validateNickname('AB CD')).toContain('letters'); });
  it('trims whitespace before checking length', () => { expect(validateNickname('  A  ')).toContain('at least 2'); });
});

describe('leaderboard parsing', () => {
  it('returns empty for null or invalid input', () => {
    expect(parseLeaderboard(null)).toEqual(emptyLeaderboard());
    expect(parseLeaderboard('')).toEqual(emptyLeaderboard());
    expect(parseLeaderboard('not json')).toEqual(emptyLeaderboard());
    expect(parseLeaderboard('{"version":2}')).toEqual(emptyLeaderboard());
  });
  it('recovers from corrupted entries', () => {
    const valid = fakeEntry();
    const data = { version: 1, entries: [valid, { broken: true }, { nickname: 123 }] };
    const board = parseLeaderboard(JSON.stringify(data));
    expect(board.entries).toHaveLength(1);
    expect(board.entries[0].runId).toBe(valid.runId);
  });
  it('rejects oversized input', () => {
    expect(parseLeaderboard('x'.repeat(500001))).toEqual(emptyLeaderboard());
  });
});

describe('entry management', () => {
  it('adds entries and prevents duplicates', () => {
    let board = emptyLeaderboard();
    const entry = fakeEntry({ runId: 'unique-1' });
    board = addEntry(board, entry);
    expect(board.entries).toHaveLength(1);
    board = addEntry(board, entry);
    expect(board.entries).toHaveLength(1);
  });
  it('limits to top N per challenge', () => {
    let board = emptyLeaderboard();
    for (let i = 0; i < LEADERBOARD_LIMIT + 5; i++) {
      board = addEntry(board, fakeEntry({ score: i * 100, runId: `run-${i}` }));
    }
    const entries = challengeEntries(board, blackFridayChallenge);
    expect(entries).toHaveLength(LEADERBOARD_LIMIT);
    expect(entries[0].score).toBeGreaterThan(entries[entries.length - 1].score);
  });
});

describe('ranking', () => {
  it('sorts by score descending', () => {
    let board = emptyLeaderboard();
    board = addEntry(board, fakeEntry({ score: 3000, runId: 'r1' }));
    board = addEntry(board, fakeEntry({ score: 7000, runId: 'r2' }));
    board = addEntry(board, fakeEntry({ score: 5000, runId: 'r3' }));
    const entries = challengeEntries(board, blackFridayChallenge);
    expect(entries.map(e => e.score)).toEqual([7000, 5000, 3000]);
  });
  it('breaks ties by availability then timestamp', () => {
    let board = emptyLeaderboard();
    board = addEntry(board, fakeEntry({ score: 5000, availability: 0.90, timestamp: 100, runId: 'r1' }));
    board = addEntry(board, fakeEntry({ score: 5000, availability: 0.95, timestamp: 200, runId: 'r2' }));
    board = addEntry(board, fakeEntry({ score: 5000, availability: 0.95, timestamp: 50, runId: 'r3' }));
    const entries = challengeEntries(board, blackFridayChallenge);
    expect(entries.map(e => e.runId)).toEqual(['r3', 'r2', 'r1']);
  });
  it('ranks current run correctly', () => {
    let board = emptyLeaderboard();
    board = addEntry(board, fakeEntry({ score: 8000, nickname: 'AAA', runId: 'r1' }));
    board = addEntry(board, fakeEntry({ score: 6000, nickname: 'BBB', runId: 'r2' }));
    board = addEntry(board, fakeEntry({ score: 4000, nickname: 'CCC', runId: 'r3' }));
    const run = fakeRun({ score: 7000, availability: 0.98 });
    const result = rankRun(board, run, 'NEW');
    expect(result).not.toBeNull();
    expect(result!.rank).toBe(2);
    expect(result!.pointsToNextRank).toBe(1000);
    expect(result!.totalEntries).toBe(4);
  });
  it('shows null points to next rank for #1', () => {
    const board = emptyLeaderboard();
    const run = fakeRun({ score: 9999 });
    const result = rankRun(board, run, 'TOP');
    expect(result!.rank).toBe(1);
    expect(result!.pointsToNextRank).toBeNull();
  });
  it('detects personal best', () => {
    let board = emptyLeaderboard();
    board = addEntry(board, fakeEntry({ score: 5000, nickname: 'ME', runId: 'old' }));
    const better = fakeRun({ score: 6000 });
    const result = rankRun(board, better, 'ME');
    expect(result!.isPersonalBest).toBe(true);
    const worse = fakeRun({ score: 4000 });
    const result2 = rankRun(board, worse, 'ME');
    expect(result2!.isPersonalBest).toBe(false);
  });
});

describe('qualification', () => {
  it('excludes failed runs', () => {
    expect(qualifiesForLeaderboard(fakeRun({ status: 'FAILED', objectiveMet: false }))).toBe(false);
  });
  it('excludes objective-missed completions', () => {
    expect(qualifiesForLeaderboard(fakeRun({ status: 'COMPLETED', objectiveMet: false }))).toBe(false);
  });
  it('accepts completed objective-met runs', () => {
    expect(qualifiesForLeaderboard(fakeRun())).toBe(true);
  });
});

describe('personal best', () => {
  it('returns best entry for nickname', () => {
    let board = emptyLeaderboard();
    board = addEntry(board, fakeEntry({ score: 3000, nickname: 'ME', runId: 'r1' }));
    board = addEntry(board, fakeEntry({ score: 7000, nickname: 'ME', runId: 'r2' }));
    board = addEntry(board, fakeEntry({ score: 9000, nickname: 'OTHER', runId: 'r3' }));
    const best = personalBest(board, blackFridayChallenge, 'ME');
    expect(best?.score).toBe(7000);
  });
  it('returns null for unknown nickname', () => {
    expect(personalBest(emptyLeaderboard(), blackFridayChallenge, 'NOBODY')).toBeNull();
  });
});

describe('challenge isolation', () => {
  it('does not mix entries from different challenges', () => {
    let board = emptyLeaderboard();
    board = addEntry(board, fakeEntry({ challengeCanonical: 'challenge-A', runId: 'r1' }));
    board = addEntry(board, fakeEntry({ challengeCanonical: 'challenge-B', runId: 'r2' }));
    board = addEntry(board, fakeEntry({ challengeCanonical: canonical, runId: 'r3' }));
    const entries = challengeEntries(board, blackFridayChallenge);
    expect(entries).toHaveLength(1);
    expect(entries[0].runId).toBe('r3');
  });
});

describe('entry creation', () => {
  it('creates entry from run summary', () => {
    const run = fakeRun({ id: 'test-run', score: 8500, availability: 0.99 });
    const entry = entryFromRun(run, 'TestPlayer');
    expect(entry.nickname).toBe('TestPlayer');
    expect(entry.score).toBe(8500);
    expect(entry.availability).toBe(0.99);
    expect(entry.runId).toBe('test-run');
    expect(entry.challengeCanonical).toBe(canonical);
  });
  it('uses Anonymous for empty nickname', () => {
    const entry = entryFromRun(fakeRun(), '');
    expect(entry.nickname).toBe('Anonymous');
  });
});
