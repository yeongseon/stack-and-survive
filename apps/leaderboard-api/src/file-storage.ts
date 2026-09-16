import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { computeRankContext, type LeaderboardStorage, type StoredEntry, type AddResult, type RankContext } from './storage';

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
        if (Array.isArray(parsed)) { this.data = parsed; return; }
      }
    } catch (err) {
      console.error('Leaderboard file corrupted or unreadable, starting empty:', err);
    }
    this.data = [];
  }

  private save() {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = this.filePath + '.tmp';
    writeFileSync(tmp, JSON.stringify(this.data), 'utf-8');
    renameSync(tmp, this.filePath);
  }

  async getTop(challengeHash: string, limit: number): Promise<StoredEntry[]> {
    const filtered = this.data.filter(e => e.challengeHash === challengeHash);
    return filtered.sort((a, b) => b.score - a.score || b.availability - a.availability || a.submittedAt - b.submittedAt).slice(0, limit);
  }

  async add(entry: StoredEntry): Promise<AddResult> {
    const existing = this.data.find(e => e.clientRunId === entry.clientRunId && e.challengeHash === entry.challengeHash);
    if (existing) return { added: false, reason: 'duplicate', existing };
    this.data.push(entry);
    this.save(); // throws on write failure — caller must not claim success
    return { added: true };
  }

  async getRankContext(challengeHash: string, entry: StoredEntry): Promise<RankContext> {
    return computeRankContext(this.data.filter(e => e.challengeHash === challengeHash), entry);
  }
}
