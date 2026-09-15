import { array, integer, number, record, text, type Architecture } from '@stack-and-survive/schema';
import { parseArchitecture } from '@stack-and-survive/cloud-domain';
import { parseChallenge, sameChallenge, evaluateObjective, type Challenge } from '@stack-and-survive/scenarios/challenge';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { startRuntime, validateActionSchedule, type Action, type ActionOutcome } from '@stack-and-survive/simulation/runtime';
import { advanceSimulation, createSimulation, simulationResult } from '@stack-and-survive/simulation/results';
import { compare } from '@stack-and-survive/simulation/economy';
import type { View } from './controller';

export const HISTORY_LIMIT = 20;
export const historyKey = 'stack-and-survive.history.balance-0.3.v1';
export type RunSummary = {
  id: string; challenge: Challenge; status: 'FAILED' | 'COMPLETED'; elapsed: number; objectiveMet: boolean;
  availability: number; cost: number; emergencyCost: number; nbv: number; score: number;
  offered: number; served: number; lost: number;
  peaks: { app: number; sqlRead: number; sqlWrite: number };
  initialArchitecture: Architecture; finalArchitecture: Architecture; actions: Action[]; actionLog: ActionOutcome[];
};
export type RunBests = { challenge: Challenge; highestAvailability: RunSummary; lowestCost: RunSummary; highestValue: RunSummary };
export type RunHistory = { version: 1; runs: RunSummary[]; bests: RunBests[]; highestLevel: number };
export const emptyHistory = (): RunHistory => ({ version: 1, runs: [], bests: [], highestLevel: 0 });

function supported(input: unknown) {
  const challenge = parseChallenge(input);
  if (!challengeLadder.some(level => sameChallenge(level.challenge, challenge))) throw new Error('Unsupported history challenge');
  return challenge;
}
function parseRun(input: unknown): RunSummary {
  const r = record(input, 'run'); const challenge = supported(r.challenge);
  const id = text(r.id, 'run id');
  if (id.length > 100 || !/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('Invalid run id');
  if (r.status !== 'FAILED' && r.status !== 'COMPLETED') throw new Error('Only finished runs can be recorded');
  const elapsed = integer(r.elapsed, 'elapsed', 1, challenge.workload.duration);
  if (r.status === 'COMPLETED' && elapsed !== challenge.workload.duration) throw new Error('Partial completion');
  const availability = number(r.availability, 'availability', 0, 1);
  const objectiveMet = evaluateObjective(challenge, { status: r.status, elapsedTime: elapsed, metrics: { availability } });
  if (r.objectiveMet !== objectiveMet) throw new Error('Inconsistent objective result');
  const offered = number(r.offered, 'offered', 0, 3600000), served = number(r.served, 'served', 0, offered);
  const lost = number(r.lost, 'lost', 0, offered);
  if (compare(offered - served, lost) !== 0 || compare(availability, offered > 0 ? served / offered : 1) !== 0) throw new Error('Inconsistent customer totals');
  const initialArchitecture = parseArchitecture(r.initialArchitecture), finalArchitecture = parseArchitecture(r.finalArchitecture);
  const actions = array(r.actions, 'actions'); if (actions.length > 1000) throw new Error('Too many actions');
  const parsedActions: Action[] = actions.map(raw => {
    const a = record(raw, 'action'); const time = integer(a.time, 'action time', 0, elapsed - 1), sequence = integer(a.sequence, 'sequence', 0, Number.MAX_SAFE_INTEGER);
    if (a.type === 'SCALE_OUT' || a.type === 'EMERGENCY_WAF') return { type: a.type, time, sequence };
    if (a.type === 'RATE_LIMIT' && typeof a.enabled === 'boolean') return { type: 'RATE_LIMIT', time, sequence, enabled: a.enabled };
    if (a.type === 'DEPLOY_RESOURCE' && (a.kind === 'cache' || a.kind === 'edge')) return { type: 'DEPLOY_RESOURCE', time, sequence, kind: a.kind, x: number(a.x, 'x', -900, 900), y: number(a.y, 'y', -600, 600) };
    throw new Error('Unsupported saved action');
  });
  validateActionSchedule(parsedActions, challenge.workload.duration);
  const rawLog = array(r.actionLog, 'action log');
  if (rawLog.length !== parsedActions.length) throw new Error('Incomplete action provenance');
  const actionLog: ActionOutcome[] = rawLog.map((value, index) => {
    const outcome = record(value, 'action outcome');
    if (typeof outcome.accepted !== 'boolean' || (outcome.accepted ? outcome.reason !== null : typeof outcome.reason !== 'string')) throw new Error('Invalid action outcome');
    if (JSON.stringify(outcome.action) !== JSON.stringify(actions[index])) throw new Error('Action log does not match schedule');
    return { action: parsedActions[index], accepted: outcome.accepted, reason: outcome.reason === null ? null : text(outcome.reason, 'action reason') };
  });
  const peaks = record(r.peaks, 'peaks');
  return { id, challenge, status: r.status, elapsed, objectiveMet, availability,
    cost: number(r.cost, 'cost', 0, 1000000), emergencyCost: number(r.emergencyCost, 'emergency cost', 0, 8),
    nbv: number(r.nbv, 'business value', -1000000000, 1000000000), score: integer(r.score, 'score', 0, 10000), offered, served, lost,
    peaks: { app: number(peaks.app, 'App peak'), sqlRead: number(peaks.sqlRead, 'SQL read peak'), sqlWrite: number(peaks.sqlWrite, 'SQL write peak') },
    initialArchitecture, finalArchitecture, actions: parsedActions, actionLog };
}

function verifyRun(run: RunSummary) {
  let state = createSimulation(run.initialArchitecture, run.challenge.workload);
  state.runtime = startRuntime(state.runtime);
  const schedule = new Map<number, Action[]>();
  for (const action of run.actions) schedule.set(action.time, [...(schedule.get(action.time) ?? []), action]);
  while (state.runtime.status === 'RUNNING') state = advanceSimulation(state, run.challenge.workload, schedule.get(state.runtime.time) ?? []).nextState;
  const actual = simulationResult(state, run.challenge.workload);
  if (actual.status !== run.status || actual.elapsedTime !== run.elapsed || actual.score !== run.score
    || JSON.stringify(parseArchitecture(state.runtime.architecture)) !== JSON.stringify(run.finalArchitecture)
    || JSON.stringify(state.runtime.actionLog) !== JSON.stringify(run.actionLog)) throw new Error('Saved run provenance does not reproduce its result');
  const values = [
    [actual.metrics.availability, run.availability], [actual.metrics.offered, run.offered], [actual.metrics.successful, run.served],
    [actual.economy.infrastructureCost, run.cost], [actual.economy.emergencyCost, run.emergencyCost], [actual.economy.netBusinessValue, run.nbv],
    [actual.attribution.peaks.app, run.peaks.app], [actual.attribution.peaks.sqlRead, run.peaks.sqlRead], [actual.attribution.peaks.sqlWrite, run.peaks.sqlWrite],
  ];
  if (values.some(([a, b]) => compare(a, b) !== 0)) throw new Error('Saved metrics do not match replay');
  return run;
}

export function summarizeRun(result: NonNullable<View['result']>, finalArchitecture: Architecture, id: string): RunSummary {
  if (!result.challenge || !result.initialArchitecture || !result.actionLog) throw new Error('Run provenance missing');
  return parseRun({ id, challenge: result.challenge, status: result.status, elapsed: result.elapsedTime,
    objectiveMet: evaluateObjective(result.challenge, result), availability: result.metrics.availability,
    cost: result.economy.infrastructureCost, emergencyCost: result.economy.emergencyCost, nbv: result.economy.netBusinessValue,
    score: result.score, offered: result.metrics.offered, served: result.metrics.successful, lost: result.metrics.offered - result.metrics.successful,
    peaks: result.attribution.peaks, initialArchitecture: result.initialArchitecture, finalArchitecture,
    actions: result.actionLog.map(outcome => outcome.action), actionLog: result.actionLog });
}

export function parseHistory(raw: string | null): RunHistory {
  if (!raw || raw.length > 2000000) return emptyHistory();
  try {
    const h = record(JSON.parse(raw), 'history');
    if (h.version !== 1) throw new Error('Unsupported history version');
    const rawRuns = array(h.runs, 'runs'), rawBests = array(h.bests, 'bests');
    if (rawRuns.length > HISTORY_LIMIT || rawBests.length > challengeLadder.length) throw new Error('Oversized history');
    const checked = new Map<string, RunSummary>();
    const readRun = (input: unknown) => {
      const key = JSON.stringify(input);
      const cached = checked.get(key); if (cached) return cached;
      const parsed = verifyRun(parseRun(input)); checked.set(key, parsed); return parsed;
    };
    const runs = rawRuns.map(readRun);
    if (new Set(runs.map(r => r.id)).size !== runs.length) throw new Error('Duplicate history IDs');
    const bests: RunBests[] = rawBests.map(rawBest => {
      const b = record(rawBest, 'bests'); const challenge = supported(b.challenge);
      const highestAvailability = readRun(b.highestAvailability), lowestCost = readRun(b.lowestCost), highestValue = readRun(b.highestValue);
      if (![highestAvailability, lowestCost, highestValue].every(run => run.objectiveMet && sameChallenge(run.challenge, challenge))) throw new Error('Ineligible best');
      return { challenge, highestAvailability, lowestCost, highestValue };
    });
    if (bests.length > challengeLadder.length || new Set(bests.map(b => b.challenge.canonical)).size !== bests.length) throw new Error('Invalid best groups');
    const byId = new Map<string, string>();
    for (const run of [...runs, ...bests.flatMap(b => [b.highestAvailability, b.lowestCost, b.highestValue])]) {
      const canonical = JSON.stringify(run);
      if (byId.has(run.id) && byId.get(run.id) !== canonical) throw new Error('Conflicting run IDs');
      byId.set(run.id, canonical);
    }
    const highestLevel = integer(h.highestLevel, 'highest level', 0, challengeLadder.length);
    const recordedLevel = Math.max(0, ...bests.map(b => challengeLadder.findIndex(level => sameChallenge(level.challenge, b.challenge)) + 1));
    if (highestLevel !== recordedLevel) throw new Error('Inconsistent highest completion');
    for (const run of [...runs, ...bests.flatMap(b => [b.highestAvailability, b.lowestCost, b.highestValue])].filter(r => r.objectiveMet)) {
      const best = bests.find(b => sameChallenge(b.challenge, run.challenge));
      if (!best || compare(run.availability, best.highestAvailability.availability) > 0
        || compare(run.cost + run.emergencyCost, best.lowestCost.cost + best.lowestCost.emergencyCost) < 0
        || compare(run.nbv, best.highestValue.nbv) > 0) throw new Error('Inconsistent personal best selection');
    }
    return { version: 1, runs, bests, highestLevel };
  } catch { return emptyHistory(); }
}

export function recordRun(history: RunHistory, input: RunSummary): RunHistory {
  const run = verifyRun(parseRun(input));
  const current = parseHistory(JSON.stringify(history));
  const known = [...current.runs, ...current.bests.flatMap(b => [b.highestAvailability, b.lowestCost, b.highestValue])];
  if (known.some(item => item.id === run.id)) return current;
  const bests = [...current.bests];
  let highestLevel = current.highestLevel;
  if (run.objectiveMet) {
    const index = bests.findIndex(b => sameChallenge(b.challenge, run.challenge));
    const previous = bests[index];
    const best: RunBests = previous ? {
      challenge: run.challenge,
      highestAvailability: compare(run.availability, previous.highestAvailability.availability) > 0 ? run : previous.highestAvailability,
      lowestCost: compare(run.cost + run.emergencyCost, previous.lowestCost.cost + previous.lowestCost.emergencyCost) < 0 ? run : previous.lowestCost,
      highestValue: compare(run.nbv, previous.highestValue.nbv) > 0 ? run : previous.highestValue,
    } : { challenge: run.challenge, highestAvailability: run, lowestCost: run, highestValue: run };
    if (index < 0) bests.push(best); else bests[index] = best;
    highestLevel = Math.max(highestLevel, challengeLadder.findIndex(level => sameChallenge(level.challenge, run.challenge)) + 1);
  }
  return { version: 1, runs: [...current.runs, run].slice(-HISTORY_LIMIT), bests, highestLevel };
}
export function recentComparable(history: RunHistory, challenge: Challenge): RunSummary | null {
  return [...history.runs].reverse().find(run => sameChallenge(run.challenge, challenge)) ?? null;
}
