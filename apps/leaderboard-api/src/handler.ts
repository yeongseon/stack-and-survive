import { parseChallenge, blackFridayChallengeV03, type Challenge } from '@stack-and-survive/scenarios/challenge';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { replayRun } from '@stack-and-survive/simulation/replay';
import { validateActionSchedule, parseAction, type Action } from '@stack-and-survive/simulation/runtime';
import { array, record, text } from '@stack-and-survive/schema';
import type { LeaderboardStorage, RankContext, StoredEntry } from './storage';

const MAX_ACTIONS = 500;
const MAX_BODY_SIZE = 200_000;
const supportedChallenges = new Map<string, Challenge>();
for (const level of challengeLadder) supportedChallenges.set(level.challenge.contentHash, level.challenge);
for (const level of challengeLadder) {
  const legacy = parseChallenge({ ...blackFridayChallengeV03, id: level.challenge.id, objective: level.challenge.objective });
  supportedChallenges.set(legacy.contentHash, legacy);
}

function validateNickname(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 16) throw new ApiError('Nickname must be 2-16 characters', 400);
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) throw new ApiError('Nickname: only letters, numbers, hyphens, underscores', 400);
  return trimmed;
}

function validateClientRunId(id: unknown): string {
  const value = text(id, 'clientRunId');
  if (value.length < 8 || value.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(value)) throw new ApiError('Invalid clientRunId', 400);
  return value;
}

function parseActions(raw: unknown[]): Action[] {
  if (raw.length > MAX_ACTIONS) throw new Error('Too many actions');
  return raw.map(parseAction);
}

function actionDigest(challengeHash: string, actions: Action[]): string {
  const payload = JSON.stringify({ c: challengeHash, a: actions });
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(payload)) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  return hash.toString(16).padStart(16, '0');
}

export type SubmitResponse = {
  accepted: true;
  rankContext: RankContext;
  top: { rank: number; nickname: string; score: number; availability: number; submittedAt: number }[];
};

export type TopResponse = {
  challengeHash: string;
  available: true;
  entries: { rank: number; nickname: string; score: number; availability: number; submittedAt: number }[];
};

export class ApiError extends Error {
  constructor(message: string, public statusCode: number) { super(message); }
}

export async function handleGetTop(storage: LeaderboardStorage, challengeHash: string): Promise<TopResponse> {
  if (!supportedChallenges.has(challengeHash)) throw new ApiError('Unsupported challenge', 400);
  const entries = await storage.getTop(challengeHash, 10);
  return {
    challengeHash,
    available: true,
    entries: entries.map((e, i) => ({ rank: i + 1, nickname: e.nickname, score: e.score, availability: e.availability, submittedAt: e.submittedAt })),
  };
}

export async function handleSubmit(storage: LeaderboardStorage, body: string): Promise<SubmitResponse> {
  if (body.length > MAX_BODY_SIZE) throw new ApiError('Request body too large', 413);

  let parsed: Record<string, unknown>;
  try { parsed = record(JSON.parse(body), 'submission'); }
  catch { throw new ApiError('Invalid JSON', 400); }

  let nickname: string, clientRunId: string, challengeHash: string, actions: Action[];
  try {
    nickname = validateNickname(text(parsed.nickname, 'nickname'));
    clientRunId = validateClientRunId(parsed.clientRunId);
    challengeHash = text(parsed.challengeContentHash, 'challengeContentHash');
    const rawActions = array(parsed.actions, 'actions');
    const challenge = supportedChallenges.get(challengeHash);
    if (!challenge) throw new ApiError('Unsupported challenge', 400);
    actions = parseActions(rawActions);
    validateActionSchedule(actions, challenge.workload.duration);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err instanceof Error ? err.message : 'Invalid request', 400);
  }

  const challenge = supportedChallenges.get(challengeHash)!;

  const initialArchitecture = canonicalPlayerStart();
  const result = replayRun({ challenge, initialArchitecture, actions });

  if (!result.objectiveMet) throw new ApiError('Objective not met; only qualifying runs are accepted', 400);

  const digest = actionDigest(challengeHash, actions);
  const now = Date.now();
  const entry: StoredEntry = {
    id: `${challengeHash.slice(0, 8)}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    clientRunId,
    nickname,
    score: result.score,
    availability: result.availability,
    submittedAt: now,
    challengeHash,
    actionDigest: digest,
  };

  const addResult = await storage.add(entry);
  if (!addResult.added) {
    const existing = addResult.existing;
    // Idempotent retry: only if same submission (matching digest + nickname)
    if (existing.actionDigest !== digest || existing.nickname !== nickname) {
      throw new ApiError('clientRunId already used for a different submission', 409);
    }
    const existingRank = await storage.getRankContext(challengeHash, existing);
    const top = await storage.getTop(challengeHash, 10);
    return {
      accepted: true,
      rankContext: existingRank,
      top: top.map((e, i) => ({ rank: i + 1, nickname: e.nickname, score: e.score, availability: e.availability, submittedAt: e.submittedAt })),
    };
  }

  const rankContext = await storage.getRankContext(challengeHash, entry);
  const top = await storage.getTop(challengeHash, 10);

  return {
    accepted: true,
    rankContext,
    top: top.map((e, i) => ({ rank: i + 1, nickname: e.nickname, score: e.score, availability: e.availability, submittedAt: e.submittedAt })),
  };
}
