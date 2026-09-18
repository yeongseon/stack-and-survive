import { integer, number, record, text, type Scenario } from '@stack-and-survive/schema';
import { blackFriday, blackFridayV02, infrastructureScalingScenario, parseScenario } from './index';

export type Objective = Readonly<{ id: string; version: number; kind: 'survive' } | { id: string; version: number; kind: 'availability'; target: number }>;
export type Challenge = Readonly<{
  schemaVersion: 1; id: string; version: number; rulesVersion: Scenario['balanceVersion']; seedAlgorithm: 'fixed-v1'; seed: number;
  workload: Scenario; objective: Objective; canonical: string; contentHash: string;
}>;

function identifier(input: unknown, label: string) {
  const value = text(input, label);
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(value)) throw new Error(`${label}: expected a short lowercase identifier`);
  return value;
}
function keys(value: Record<string, unknown>, allowed: string[], label: string) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`${label}: unsupported field`);
}
function fingerprint(value: string) {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`;
}
export function parseChallenge(input: unknown): Challenge {
  const c = record(input, 'challenge');
  keys(c, ['schemaVersion', 'id', 'version', 'rulesVersion', 'seedAlgorithm', 'seed', 'workload', 'objective', 'canonical', 'contentHash'], 'challenge');
  if (c.schemaVersion !== 1 || !['0.2', '0.3', '0.4'].includes(String(c.rulesVersion)) || c.seedAlgorithm !== 'fixed-v1') throw new Error('Unsupported challenge schema, rules or seed algorithm');
  const raw = record(c.workload, 'workload');
  keys(raw, ['schemaVersion', 'balanceVersion', 'id', 'duration', 'budget', 'businessMix', 'traffic', 'targets'], 'workload');
  keys(record(raw.businessMix, 'mix'), ['browse', 'order'], 'mix');
  keys(record(raw.targets, 'targets'), ['availability', 'latencyMs', 'netBusinessValue'], 'targets');
  if (!Array.isArray(raw.traffic) || raw.traffic.length > 1000) throw new Error('Invalid challenge phase count');
  for (const phase of raw.traffic) keys(record(phase, 'phase'), ['start', 'end', 'rps', 'botRatio'], 'phase');
  const workload = parseScenario(raw);
  if (workload.balanceVersion !== c.rulesVersion) throw new Error('Challenge rules must match workload balance version');
  if (workload.duration > 3600 || workload.id.length > 80) throw new Error('Challenge workload exceeds supported bounds');
  const o = record(c.objective, 'objective');
  const id = identifier(o.id, 'objective id'), version = integer(o.version, 'objective version', 1, Number.MAX_SAFE_INTEGER);
  let objective: Objective;
  if (o.kind === 'survive') {
    keys(o, ['id', 'version', 'kind'], 'objective'); objective = Object.freeze({ id, version, kind: 'survive' });
  } else if (o.kind === 'availability') {
    keys(o, ['id', 'version', 'kind', 'target'], 'objective');
    objective = Object.freeze({ id, version, kind: 'availability', target: number(o.target, 'availability target', 0, 1) });
  } else throw new Error('Unsupported objective kind');
  const condition = {
    schemaVersion: 1 as const, id: identifier(c.id, 'challenge id'), version: integer(c.version, 'challenge version', 1, Number.MAX_SAFE_INTEGER),
    rulesVersion: workload.balanceVersion, seedAlgorithm: 'fixed-v1' as const, seed: integer(c.seed, 'challenge seed', 0, 0xffffffff), workload, objective,
  };
  const canonical = JSON.stringify(condition);
  return Object.freeze({ ...condition, canonical, contentHash: fingerprint(canonical) });
}
export const blackFridayChallengeV03 = parseChallenge({ schemaVersion: 1, id: 'black-friday', version: 1,
  rulesVersion: '0.3', seedAlgorithm: 'fixed-v1', seed: 0, workload: blackFriday,
  objective: { id: 'survive', version: 1, kind: 'survive' } });
export const blackFridayChallengeV02 = parseChallenge({ ...blackFridayChallengeV03, rulesVersion: '0.2', workload: blackFridayV02 });
export const infrastructureScalingChallenge = parseChallenge({ ...blackFridayChallengeV03, version: 2, rulesVersion: '0.4', workload: infrastructureScalingScenario });
export const blackFridayChallenge = infrastructureScalingChallenge;

export function sameChallenge(a: unknown, b: unknown) {
  try { return parseChallenge(a).canonical === parseChallenge(b).canonical; } catch { return false; }
}
export function evaluateObjective(challenge: Challenge, result: { status: string; elapsedTime: number; metrics: { availability: number } }) {
  const complete = result.status === 'COMPLETED' && result.elapsedTime === challenge.workload.duration;
  return complete && (challenge.objective.kind === 'survive' || result.metrics.availability + 1e-9 >= challenge.objective.target);
}
