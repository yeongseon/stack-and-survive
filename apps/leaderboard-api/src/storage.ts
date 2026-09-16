export type StoredEntry = {
  id: string;
  clientRunId: string;
  nickname: string;
  score: number;
  availability: number;
  submittedAt: number;
  challengeHash: string;
  actionDigest: string;
};

export type RankContext = {
  rank: number;
  totalEntries: number;
  score: number;
  availability: number;
  nextRank: { rank: number; score: number; availability: number } | null;
  pointsToNextRank: number | null;
  tieBreakReason: 'availability' | 'timestamp' | null;
};

export type AddResult = { added: true } | { added: false; reason: 'duplicate'; existing: StoredEntry };

function sortEntries(entries: StoredEntry[]): StoredEntry[] {
  return entries.sort((a, b) => b.score - a.score || b.availability - a.availability || a.submittedAt - b.submittedAt);
}

export function computeRankContext(all: StoredEntry[], entry: StoredEntry): RankContext {
  const sorted = sortEntries([...all]);
  const idx = sorted.findIndex(e => e.clientRunId === entry.clientRunId && e.challengeHash === entry.challengeHash);
  const rank = idx >= 0 ? idx + 1 : sorted.filter(e =>
    e.score > entry.score || (e.score === entry.score && (e.availability > entry.availability || (e.availability === entry.availability && e.submittedAt < entry.submittedAt)))
  ).length + 1;
  const above = rank > 1 ? sorted[rank - 2] : null;
  let tieBreakReason: RankContext['tieBreakReason'] = null;
  let pointsToNextRank: number | null = null;
  if (above) {
    pointsToNextRank = above.score - entry.score;
    if (pointsToNextRank === 0) tieBreakReason = above.availability > entry.availability ? 'availability' : 'timestamp';
  }
  return { rank, totalEntries: sorted.length, score: entry.score, availability: entry.availability, nextRank: above ? { rank: rank - 1, score: above.score, availability: above.availability } : null, pointsToNextRank, tieBreakReason };
}

export interface LeaderboardStorage {
  getTop(challengeHash: string, limit: number): Promise<StoredEntry[]>;
  add(entry: StoredEntry): Promise<AddResult>;
  getRankContext(challengeHash: string, entry: StoredEntry): Promise<RankContext>;
}

export class InMemoryStorage implements LeaderboardStorage {
  private entries: StoredEntry[] = [];

  async getTop(challengeHash: string, limit: number): Promise<StoredEntry[]> {
    return sortEntries(this.entries.filter(e => e.challengeHash === challengeHash)).slice(0, limit);
  }

  async add(entry: StoredEntry): Promise<AddResult> {
    const existing = this.entries.find(e => e.clientRunId === entry.clientRunId && e.challengeHash === entry.challengeHash);
    if (existing) return { added: false, reason: 'duplicate', existing };
    this.entries.push(entry);
    return { added: true };
  }

  async getRankContext(challengeHash: string, entry: StoredEntry): Promise<RankContext> {
    return computeRankContext(this.entries.filter(e => e.challengeHash === challengeHash), entry);
  }
}
