import { describe, expect, it } from 'vitest';
import { replayRun, verifyReplay } from './replay';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import { baseline } from '@stack-and-survive/cloud-domain';

const challenge = blackFridayChallenge;
const architecture = baseline();

describe('replayRun', () => {
  it('replays a no-action run deterministically', () => {
    const result = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    // Baseline architecture with no actions may fail (budget exhaustion) or complete
    expect(['COMPLETED', 'FAILED']).toContain(result.status);
    expect(result.elapsed).toBeGreaterThan(0);
    expect(result.elapsed).toBeLessThanOrEqual(challenge.workload.duration);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10000);
    expect(result.availability).toBeGreaterThanOrEqual(0);
    expect(result.availability).toBeLessThanOrEqual(1);
    expect(result.offered).toBeGreaterThan(0);
    expect(result.served).toBeLessThanOrEqual(result.offered);
    expect(result.finalArchitecture.resources.length).toBeGreaterThan(0);
    expect(result.actionLog).toEqual([]);
  });

  it('produces identical results on repeated replay', () => {
    const a = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    const b = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    expect(a.score).toBe(b.score);
    expect(a.availability).toBe(b.availability);
    expect(a.status).toBe(b.status);
    expect(a.elapsed).toBe(b.elapsed);
    expect(JSON.stringify(a.finalArchitecture)).toBe(JSON.stringify(b.finalArchitecture));
  });

  it('replays a run with scale-out action', () => {
    const actions = [{ type: 'SCALE_OUT' as const, time: 10, sequence: 0 }];
    const result = replayRun({ challenge, initialArchitecture: architecture, actions });
    expect(result.actionLog).toHaveLength(1);
    expect(result.actionLog[0].action.type).toBe('SCALE_OUT');
  });

  it('rejects actions beyond scenario duration', () => {
    const actions = [{ type: 'SCALE_OUT' as const, time: challenge.workload.duration + 1, sequence: 0 }];
    expect(() => replayRun({ challenge, initialArchitecture: architecture, actions })).toThrow();
  });

  it('rejects unsupported action types', () => {
    const actions = [{ type: 'INVALID_TYPE' as never, time: 5, sequence: 0 }];
    expect(() => replayRun({ challenge, initialArchitecture: architecture, actions })).toThrow();
  });
});

describe('verifyReplay', () => {
  it('accepts a correct claimed result', () => {
    const actual = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    expect(() => verifyReplay(
      { challenge, initialArchitecture: architecture, actions: [] },
      { status: actual.status, elapsed: actual.elapsed, score: actual.score,
        availability: actual.availability, offered: actual.offered, served: actual.served,
        cost: actual.cost, emergencyCost: actual.emergencyCost, nbv: actual.nbv,
        peaks: actual.peaks, finalArchitecture: actual.finalArchitecture, actionLog: actual.actionLog }
    )).not.toThrow();
  });

  it('rejects a tampered score', () => {
    const actual = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    expect(() => verifyReplay(
      { challenge, initialArchitecture: architecture, actions: [] },
      { ...actual, score: actual.score + 1000 }
    )).toThrow('does not reproduce');
  });

  it('rejects tampered availability', () => {
    const actual = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    expect(() => verifyReplay(
      { challenge, initialArchitecture: architecture, actions: [] },
      { ...actual, availability: 1.0 }
    )).toThrow();
  });

  it('rejects altered final architecture', () => {
    const actual = replayRun({ challenge, initialArchitecture: architecture, actions: [] });
    const fakeArch = { ...actual.finalArchitecture, resources: [] };
    expect(() => verifyReplay(
      { challenge, initialArchitecture: architecture, actions: [] },
      { ...actual, finalArchitecture: fakeArch }
    )).toThrow('architecture');
  });
});
