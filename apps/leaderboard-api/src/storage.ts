export type StoredEntry = {
  id: string;
  nickname: string;
  score: number;
  availability: number;
  submittedAt: number;
  challengeHash: string;
  actionDigest: string;
};

export interface LeaderboardStorage {
  getTop(challengeHash: string, limit: number): StoredEntry[];
  add(entry: StoredEntry): boolean; // false if duplicate
  getRank(challengeHash: string, score: number, availability: number, submittedAt: number): number;
}

export class InMemoryStorage implements LeaderboardStorage {
  private entries: StoredEntry[] = [];

  getTop(challengeHash: string, limit: number): StoredEntry[] {
    return this.entries
      .filter(e => e.challengeHash === challengeHash)
      .sort((a, b) => b.score - a.score || b.availability - a.availability || a.submittedAt - b.submittedAt)
      .slice(0, limit);
  }

  add(entry: StoredEntry): boolean {
    if (this.entries.some(e => e.actionDigest === entry.actionDigest && e.challengeHash === entry.challengeHash)) return false;
    this.entries.push(entry);
    return true;
  }

  getRank(challengeHash: string, score: number, availability: number, submittedAt: number): number {
    const above = this.entries.filter(e =>
      e.challengeHash === challengeHash &&
      (e.score > score || (e.score === score && (e.availability > availability || (e.availability === availability && e.submittedAt < submittedAt))))
    );
    return above.length + 1;
  }
}
