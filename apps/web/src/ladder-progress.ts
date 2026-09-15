import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { evaluateObjective, sameChallenge } from '@stack-and-survive/scenarios/challenge';
import type { View } from './controller';

export const progressKey = 'stack-and-survive.progress.balance-0.3.v1';
export type LadderProgress = { version: 1; completed: string[] };
export const emptyProgress = (): LadderProgress => ({ version: 1, completed: [] });
export function parseProgress(raw: string | null): LadderProgress {
  if (!raw || raw.length > 50000) return emptyProgress();
  try {
    const p = JSON.parse(raw);
    if (p?.version !== 1 || !Array.isArray(p.completed) || p.completed.length > challengeLadder.length
      || !p.completed.every((condition: unknown, i: number) => condition === challengeLadder[i].challenge.canonical)) return emptyProgress();
    return { version: 1, completed: [...p.completed] };
  } catch { return emptyProgress(); }
}
export function unlockedLevel(progress: LadderProgress) { return Math.min(progress.completed.length, challengeLadder.length - 1); }
export function recordCompletion(progress: LadderProgress, result: NonNullable<View['result']>): LadderProgress {
  const valid = parseProgress(JSON.stringify(progress));
  const index = challengeLadder.findIndex(level => result.challenge && sameChallenge(level.challenge, result.challenge));
  if (index < 0 || index !== valid.completed.length || !evaluateObjective(challengeLadder[index].challenge, result)) return valid;
  return { version: 1, completed: [...valid.completed, challengeLadder[index].challenge.canonical] };
}
