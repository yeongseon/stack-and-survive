import { compare } from '@stack-and-survive/simulation/economy';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';
import type { RunSummary } from './run-history';

export const LEADERBOARD_LIMIT = 10;
export const leaderboardKey = 'stack-and-survive.leaderboard.v1';
export const nicknameKey = 'stack-and-survive.nickname';

export type LeaderboardEntry = {
  nickname: string;
  score: number;
  availability: number;
  timestamp: number;
  runId: string;
  challengeCanonical: string;
};

export type Leaderboard = {
  version: 1;
  entries: LeaderboardEntry[];
};

export type RankResult = {
  rank: number;
  entry: LeaderboardEntry;
  isPersonalBest: boolean;
  pointsToNextRank: number | null;
  tieBreakReason: 'availability' | 'timestamp' | null;
  totalEntries: number;
};

export function validateNickname(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Nickname must be at least 2 characters';
  if (trimmed.length > 16) return 'Nickname must be at most 16 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return 'Only letters, numbers, hyphens and underscores';
  return null;
}

export function normalizeNickname(name: string): string { return name.trim(); }

export function loadNickname(): string {
  try {
    const stored = localStorage.getItem(nicknameKey);
    if (stored) { const n = normalizeNickname(stored); if (!validateNickname(n)) return n; }
  } catch { /* ignore */ }
  return '';
}

export function saveNickname(name: string): void {
  try { localStorage.setItem(nicknameKey, normalizeNickname(name)); } catch { /* ignore */ }
}

export function emptyLeaderboard(): Leaderboard {
  return { version: 1, entries: [] };
}

export function parseLeaderboard(raw: string | null): Leaderboard {
  if (!raw || raw.length > 500000) return emptyLeaderboard();
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.entries)) return emptyLeaderboard();
    const entries: LeaderboardEntry[] = [];
    for (const e of data.entries) {
      if (typeof e.nickname !== 'string' || typeof e.score !== 'number' || typeof e.availability !== 'number'
        || typeof e.timestamp !== 'number' || typeof e.runId !== 'string' || typeof e.challengeCanonical !== 'string') continue;
      if (e.score < 0 || e.score > 10000 || e.availability < 0 || e.availability > 1) continue;
      const nn = normalizeNickname(e.nickname);
      if (nn && validateNickname(nn)) continue;
      entries.push({ nickname: nn || e.nickname, score: e.score, availability: e.availability, timestamp: e.timestamp, runId: e.runId, challengeCanonical: e.challengeCanonical });
    }
    return { version: 1, entries };
  } catch { return emptyLeaderboard(); }
}

export function loadLeaderboard(): Leaderboard {
  try { return parseLeaderboard(localStorage.getItem(leaderboardKey)); }
  catch { return emptyLeaderboard(); }
}

export function saveLeaderboard(board: Leaderboard): void {
  try { localStorage.setItem(leaderboardKey, JSON.stringify(board)); } catch { /* ignore */ }
}

function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  const scoreDiff = b.score - a.score;
  if (scoreDiff !== 0) return scoreDiff;
  const availDiff = compare(b.availability, a.availability);
  if (availDiff !== 0) return availDiff;
  return a.timestamp - b.timestamp;
}

export function challengeEntries(board: Leaderboard, challenge: Challenge): LeaderboardEntry[] {
  return board.entries
    .filter(e => e.challengeCanonical === challenge.canonical)
    .sort(compareEntries);
}

export function qualifiesForLeaderboard(run: RunSummary): boolean {
  return run.status === 'COMPLETED' && run.objectiveMet;
}

export function entryFromRun(run: RunSummary, nickname: string): LeaderboardEntry {
  const normalized = normalizeNickname(nickname);
  return {
    nickname: (normalized && !validateNickname(normalized)) ? normalized : 'Anonymous',
    score: run.score,
    availability: run.availability,
    timestamp: Date.now(),
    runId: run.id,
    challengeCanonical: run.challenge.canonical,
  };
}

export function addEntry(board: Leaderboard, entry: LeaderboardEntry): Leaderboard {
  if (board.entries.some(e => e.runId === entry.runId)) return board;
  const updated = [...board.entries, entry];
  // Keep top entries per challenge, limit total storage
  const byChallenge = new Map<string, LeaderboardEntry[]>();
  for (const e of updated) {
    const list = byChallenge.get(e.challengeCanonical) ?? [];
    list.push(e);
    byChallenge.set(e.challengeCanonical, list);
  }
  const kept: LeaderboardEntry[] = [];
  for (const [, list] of byChallenge) {
    list.sort(compareEntries);
    kept.push(...list.slice(0, LEADERBOARD_LIMIT));
  }
  return { version: 1, entries: kept };
}

export function rankRun(board: Leaderboard, run: RunSummary, nickname: string): RankResult | null {
  if (!qualifiesForLeaderboard(run)) return null;
  const entry = entryFromRun(run, nickname);
  const existing = challengeEntries(board, run.challenge);
  const all = [...existing, entry].sort(compareEntries);
  // Deduplicate by runId
  const seen = new Set<string>();
  const unique = all.filter(e => { if (seen.has(e.runId)) return false; seen.add(e.runId); return true; });
  const rank = unique.findIndex(e => e.runId === entry.runId) + 1;
  const personalEntries = unique.filter(e => e.nickname === entry.nickname);
  const isPersonalBest = personalEntries.length === 0 || personalEntries[0].runId === entry.runId;
  const pointsToNextRank = rank > 1 ? unique[rank - 2].score - entry.score : null;
  let tieBreakReason: RankResult['tieBreakReason'] = null;
  if (rank > 1 && pointsToNextRank === 0) {
    const above = unique[rank - 2];
    if (compare(above.availability, entry.availability) > 0) tieBreakReason = 'availability';
    else tieBreakReason = 'timestamp';
  }
  return { rank, entry, isPersonalBest, pointsToNextRank, tieBreakReason, totalEntries: unique.length };
}

export function personalBest(board: Leaderboard, challenge: Challenge, nickname: string): LeaderboardEntry | null {
  const entries = challengeEntries(board, challenge);
  return entries.find(e => e.nickname === nickname) ?? null;
}
