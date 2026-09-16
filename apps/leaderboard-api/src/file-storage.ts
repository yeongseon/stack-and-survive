import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { LeaderboardStorage, StoredEntry, AddResult, RankContext } from './storage';

function sortEntries(entries: StoredEntry[]): StoredEntry[] {
  return entries.sort((a, b) => b.score - a.score || b.availability - a.availability || a.submittedAt - b.submittedAt);
}

export class FileStorage implements LeaderboardStorage {
  private data: StoredEntry[] = [];

  constructor(private filePath: string) {
    this.load();
  }

  private load() {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.data = parsed;
      }
    } catch { this.data = []; }
  }

  private save() {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(this.data), 'utf-8');
    } catch (err) { console.error('Failed to save leaderboard:', err); }
  }

  async getTop(challengeHash: string, limit: number): Promise<StoredEntry[]> {
    return sortEntries(this.data.filter(e => e.challengeHash === challengeHash)).slice(0, limit);
  }

  async add(entry: StoredEntry): Promise<AddResult> {
    if (this.data.some(e => e.clientRunId === entry.clientRunId && e.challengeHash === entry.challengeHash))
      return { added: false, reason: 'duplicate' };
    this.data.push(entry);
    this.save();
    return { added: true };
  }

  async getRankContext(challengeHash: string, entry: StoredEntry): Promise<RankContext> {
    const all = sortEntries(this.data.filter(e => e.challengeHash === challengeHash));
    const idx = all.findIndex(e => e.clientRunId === entry.clientRunId && e.challengeHash === entry.challengeHash);
    const rank = idx >= 0 ? idx + 1 : all.filter(e =>
      e.score > entry.score || (e.score === entry.score && (e.availability > entry.availability || (e.availability === entry.availability && e.submittedAt < entry.submittedAt)))
    ).length + 1;
    const above = rank > 1 ? all[rank - 2] : null;
    let tieBreakReason: RankContext['tieBreakReason'] = null;
    let pointsToNextRank: number | null = null;
    if (above) {
      pointsToNextRank = above.score - entry.score;
      if (pointsToNextRank === 0) tieBreakReason = above.availability > entry.availability ? 'availability' : 'timestamp';
    }
    return { rank, totalEntries: all.length, score: entry.score, availability: entry.availability, nextRank: above ? { rank: rank - 1, score: above.score, availability: above.availability } : null, pointsToNextRank, tieBreakReason };
  }
}
