import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { computeRankContext, type LeaderboardStorage, type StoredEntry, type AddResult, type RankContext } from './storage';

function isValidEntry(e: unknown): e is StoredEntry {
  if (!e || typeof e !== 'object') return false;
  const o = e as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.clientRunId === 'string'
    && typeof o.nickname === 'string' && o.nickname.length >= 2
    && typeof o.score === 'number' && Number.isFinite(o.score) && o.score >= 0 && o.score <= 10000
    && typeof o.availability === 'number' && Number.isFinite(o.availability) && o.availability >= 0 && o.availability <= 1
    && typeof o.submittedAt === 'number' && Number.isFinite(o.submittedAt)
    && typeof o.challengeHash === 'string' && o.challengeHash.length > 0
    && typeof o.actionDigest === 'string';
}

export class FileStorage implements LeaderboardStorage {
  private data: StoredEntry[] = [];

  constructor(private filePath: string) {
    this.load();
  }

  private load() {
    try {
      if (!existsSync(this.filePath)) { this.data = []; return; }
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Leaderboard file is not an array');
      const valid = parsed.filter(isValidEntry);
      if (valid.length < parsed.length) console.warn(`Leaderboard: filtered ${parsed.length - valid.length} invalid entries on startup`);
      this.data = valid;
    } catch (err) {
      console.error('Leaderboard file corrupted:', err);
      // Quarantine corrupted file
      if (existsSync(this.filePath)) {
        const quarantine = `${this.filePath}.corrupt.${Date.now()}`;
        try { renameSync(this.filePath, quarantine); console.warn(`Quarantined corrupted file to ${quarantine}`); }
        catch { /* best effort */ }
      }
      this.data = [];
    }
  }

  private persistAtomically(nextData: StoredEntry[]) {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = this.filePath + '.tmp';
    writeFileSync(tmp, JSON.stringify(nextData), 'utf-8');
    renameSync(tmp, this.filePath);
  }

  async getTop(challengeHash: string, limit: number): Promise<StoredEntry[]> {
    const filtered = this.data.filter(e => e.challengeHash === challengeHash);
    return filtered.sort((a, b) => b.score - a.score || b.availability - a.availability || a.submittedAt - b.submittedAt).slice(0, limit);
  }

  async add(entry: StoredEntry): Promise<AddResult> {
    const existing = this.data.find(e => e.clientRunId === entry.clientRunId && e.challengeHash === entry.challengeHash);
    if (existing) return { added: false, reason: 'duplicate', existing };
    // Write to copy first, only update memory after successful persistence
    const nextData = [...this.data, entry];
    this.persistAtomically(nextData); // throws on failure — memory unchanged
    this.data = nextData;
    return { added: true };
  }

  async getRankContext(challengeHash: string, entry: StoredEntry): Promise<RankContext> {
    return computeRankContext(this.data.filter(e => e.challengeHash === challengeHash), entry);
  }
}
