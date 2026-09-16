import type { Action } from '@stack-and-survive/simulation/runtime';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';

const API_BASE = import.meta.env?.VITE_LEADERBOARD_API ?? '';

export type GlobalEntry = { rank: number; nickname: string; score: number; availability: number; submittedAt: number };
export type GlobalRankContext = { rank: number; totalEntries: number; score: number; availability: number; nextRank: { rank: number; score: number; availability: number } | null; pointsToNextRank: number | null; tieBreakReason: 'availability' | 'timestamp' | null };
export type GlobalSubmitResult = { accepted: true; rankContext: GlobalRankContext; top: GlobalEntry[] };
export type GlobalTopResult = { challengeHash: string; available: true; entries: GlobalEntry[] };

export async function submitToGlobal(nickname: string, challenge: Challenge, actions: Action[], clientRunId: string): Promise<GlobalSubmitResult | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, clientRunId, challengeContentHash: challenge.contentHash, actions }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return await response.json() as GlobalSubmitResult;
  } catch { return null; }
}

export async function fetchGlobalTop(challenge: Challenge): Promise<GlobalEntry[] | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard?challenge=${encodeURIComponent(challenge.contentHash)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json() as GlobalTopResult;
    return data.entries;
  } catch { return null; }
}

export function formatShareText(result: { score: number; availability: number; challenge: string; rank?: number; globalRank?: boolean; nickname?: string }): string {
  const lines = [
    'Stack & Survive',
    result.challenge,
    `Score: ${result.score} / 10,000`,
    `Availability: ${(result.availability * 100).toFixed(2)}%`,
  ];
  if (result.rank) lines.push(`${result.globalRank ? 'Global Rank' : 'Personal Score'}: #${result.rank}`);
  lines.push('', 'Same workload.', 'Different architectures.', 'Different outcomes.');
  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

// --- Pending submission retry ---
const PENDING_KEY = 'stack-and-survive.pending-global-submission';

export type PendingSubmission = {
  nickname: string;
  challengeContentHash: string;
  clientRunId: string;
  actions: Action[];
};

export function savePendingSubmission(pending: PendingSubmission): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch { /* ignore */ }
}

export function loadPendingSubmission(): PendingSubmission | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.nickname === 'string' && typeof data.clientRunId === 'string'
      && typeof data.challengeContentHash === 'string' && Array.isArray(data.actions))
      return data as PendingSubmission;
  } catch { /* ignore */ }
  return null;
}

export function clearPendingSubmission(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}
