import { parseChallenge, type Challenge } from '@stack-and-survive/scenarios/challenge';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { canonicalPlayerStart } from '@stack-and-survive/cloud-domain';
import { replayRun } from '@stack-and-survive/simulation/replay';
import { validateActionSchedule, type Action } from '@stack-and-survive/simulation/runtime';
import { array, integer, number, record, text } from '@stack-and-survive/schema';
import type { LeaderboardStorage, StoredEntry } from './storage';

const MAX_ACTIONS = 500;
const MAX_BODY_SIZE = 200_000;
const supportedChallenges = new Map<string, Challenge>();
for (const level of challengeLadder) supportedChallenges.set(level.challenge.contentHash, level.challenge);

function validateNickname(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 16) throw new Error('Nickname must be 2-16 characters');
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) throw new Error('Nickname: only letters, numbers, hyphens, underscores');
  return trimmed;
}

function parseActions(raw: unknown[]): Action[] {
  if (raw.length > MAX_ACTIONS) throw new Error('Too many actions');
  return raw.map(item => {
    const a = record(item, 'action');
    const time = integer(a.time, 'time', 0, 3600);
    const sequence = integer(a.sequence, 'sequence', 0, Number.MAX_SAFE_INTEGER);
    if (a.type === 'SCALE_OUT' || a.type === 'EMERGENCY_WAF') return { type: a.type, time, sequence };
    if (a.type === 'RATE_LIMIT' && typeof a.enabled === 'boolean') return { type: 'RATE_LIMIT' as const, time, sequence, enabled: a.enabled };
    if (a.type === 'DEPLOY_RESOURCE' && (a.kind === 'cache' || a.kind === 'edge'))
      return { type: 'DEPLOY_RESOURCE' as const, time, sequence, kind: a.kind, x: number(a.x, 'x', -900, 900), y: number(a.y, 'y', -600, 600) };
    throw new Error('Unsupported action type');
  });
}

function actionDigest(challengeHash: string, actions: Action[]): string {
  const payload = JSON.stringify({ c: challengeHash, a: actions });
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(payload)) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  return hash.toString(16).padStart(16, '0');
}

export type SubmitRequest = {
  nickname: string;
  challengeContentHash: string;
  actions: unknown[];
  clientRunId?: string;
};

export type SubmitResponse = {
  accepted: true;
  rank: number;
  score: number;
  availability: number;
  objectiveMet: boolean;
  top: { rank: number; nickname: string; score: number; availability: number; submittedAt: number }[];
};

export type TopResponse = {
  challengeHash: string;
  entries: { rank: number; nickname: string; score: number; availability: number; submittedAt: number }[];
};

export function handleGetTop(storage: LeaderboardStorage, challengeHash: string): TopResponse {
  const entries = storage.getTop(challengeHash, 10);
  return {
    challengeHash,
    entries: entries.map((e, i) => ({ rank: i + 1, nickname: e.nickname, score: e.score, availability: e.availability, submittedAt: e.submittedAt })),
  };
}

export function handleSubmit(storage: LeaderboardStorage, body: string): SubmitResponse {
  if (body.length > MAX_BODY_SIZE) throw new Error('Request body too large');

  const raw = record(JSON.parse(body), 'submission');
  const nickname = validateNickname(text(raw.nickname, 'nickname'));
  const challengeHash = text(raw.challengeContentHash, 'challengeContentHash');
  const rawActions = array(raw.actions, 'actions');

  const challenge = supportedChallenges.get(challengeHash);
  if (!challenge) throw new Error('Unsupported challenge');

  const actions = parseActions(rawActions);
  validateActionSchedule(actions, challenge.workload.duration);

  const initialArchitecture = canonicalPlayerStart();
  const result = replayRun({ challenge, initialArchitecture, actions });

  if (!result.objectiveMet) throw new Error('Objective not met; only qualifying runs are accepted');

  const digest = actionDigest(challengeHash, actions);
  const now = Date.now();
  const entry: StoredEntry = {
    id: `${challengeHash.slice(0, 8)}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    nickname,
    score: result.score,
    availability: result.availability,
    submittedAt: now,
    challengeHash,
    actionDigest: digest,
  };

  const added = storage.add(entry);
  if (!added) throw new Error('Duplicate run submission');

  const rank = storage.getRank(challengeHash, result.score, result.availability, now);
  const top = storage.getTop(challengeHash, 10);

  return {
    accepted: true,
    rank,
    score: result.score,
    availability: result.availability,
    objectiveMet: result.objectiveMet,
    top: top.map((e, i) => ({ rank: i + 1, nickname: e.nickname, score: e.score, availability: e.availability, submittedAt: e.submittedAt })),
  };
}
