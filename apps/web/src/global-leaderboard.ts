import { parseAction, type Action } from '@stack-and-survive/simulation/runtime';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';

const API_BASE = import.meta.env?.VITE_LEADERBOARD_API ?? '';
export const globalLeaderboardConfigured = API_BASE.trim().length > 0;

export type GlobalEntry = { rank: number; nickname: string; score: number; availability: number; submittedAt: number };
export type GlobalRankContext = { rank: number; totalEntries: number; score: number; availability: number; nextRank: { rank: number; score: number; availability: number } | null; pointsToNextRank: number | null; tieBreakReason: 'availability' | 'timestamp' | null };
export type GlobalSubmitResult = { accepted: true; rankContext: GlobalRankContext; top: GlobalEntry[] };
export type GlobalTopResult = { challengeHash: string; available: true; entries: GlobalEntry[] };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function finite(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
function ranked(value: unknown): value is Record<string, unknown> & { rank: number; score: number; availability: number } {
  return record(value) && finite(value.rank, 1) && Number.isSafeInteger(value.rank)
    && finite(value.score, 0, 10000) && Number.isInteger(value.score) && finite(value.availability, 0, 1);
}
function entries(value: unknown): value is GlobalEntry[] {
  return Array.isArray(value) && value.length <= 10 && value.every(item => record(item) && ranked(item)
    && typeof item.nickname === 'string' && item.nickname.length > 0 && item.nickname.length <= 16
    && finite(item.submittedAt, 0));
}
function rankContext(value: unknown): value is GlobalRankContext {
  return record(value) && ranked(value) && finite(value.totalEntries, value.rank) && Number.isSafeInteger(value.totalEntries)
    && (value.nextRank === null || ranked(value.nextRank))
    && (value.pointsToNextRank === null || finite(value.pointsToNextRank, 0, 10000))
    && (value.tieBreakReason === null || value.tieBreakReason === 'availability' || value.tieBreakReason === 'timestamp');
}

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
    const data: unknown = await response.json();
    return record(data) && data.accepted === true && rankContext(data.rankContext) && entries(data.top)
      ? { accepted: true, rankContext: data.rankContext, top: data.top } : null;
  } catch { return null; }
}

export async function fetchGlobalTop(challenge: Challenge): Promise<GlobalEntry[] | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard?challenge=${encodeURIComponent(challenge.contentHash)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return record(data) && data.available === true && data.challengeHash === challenge.contentHash && entries(data.entries)
      ? data.entries : null;
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

function isValidAction(a: unknown): boolean {
  try { parseAction(a); return true; } catch { return false; }
}

export function loadPendingSubmission(): PendingSubmission | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw || raw.length > 200000) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (typeof data.nickname !== 'string' || data.nickname.length < 2 || data.nickname.length > 16) { clearPendingSubmission(); return null; }
    if (typeof data.clientRunId !== 'string' || data.clientRunId.length < 8 || data.clientRunId.length > 64) { clearPendingSubmission(); return null; }
    if (typeof data.challengeContentHash !== 'string' || data.challengeContentHash.length === 0) { clearPendingSubmission(); return null; }
    if (!Array.isArray(data.actions) || data.actions.length > 500) { clearPendingSubmission(); return null; }
    if (!data.actions.every(isValidAction)) { clearPendingSubmission(); return null; }
    return data as PendingSubmission;
  } catch { clearPendingSubmission(); return null; }
}

export function clearPendingSubmission(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}
