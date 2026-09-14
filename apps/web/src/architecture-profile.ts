import type { RunSummary } from './run-history';

export type ArchitectureProfile = {
  id: 'cache-led' | 'layered' | 'cache-first' | 'emergency-bridge' | 'mixed' | 'unknown';
  title: string; summary: string; evidence: string[]; tradeoff: string; experiment: string;
};

/** Describes verified run provenance; never awards power, score or efficiency ranks. */
export function classifyArchitecture(run: RunSummary | null): ArchitectureProfile {
  if (!run) return { id: 'unknown', title: 'Unclassified operation', summary: 'Run provenance is not available.', evidence: [],
    tradeoff: 'A resource list alone cannot explain decisions.', experiment: 'Finish a recorded run to compare your decisions.' };
  const active = run.finalArchitecture.resources.filter(r => r.remaining === 0);
  const cache = active.some(r => r.kind === 'cache');
  const edge = active.some(r => r.kind === 'edge');
  const app = active.find(r => r.kind === 'compute');
  const actions = run.actionLog.filter(o => o.accepted).map(o => o.action).sort((a, b) => a.time - b.time || a.sequence - b.sequence);
  const scaleIndex = actions.findIndex(a => a.type === 'SCALE_OUT');
  const cacheIndex = actions.findIndex(a => a.type === 'DEPLOY_RESOURCE' && a.kind === 'cache');
  const boost = actions.find(a => a.type === 'EMERGENCY_WAF');
  const evidence = [
    `${run.status === 'COMPLETED' ? 'Completed' : 'Stopped at'} ${run.elapsed}s · ${(run.availability * 100).toFixed(2)}% availability.`,
    `${app?.instances ?? 0} active App instances · ${(run.cost + run.emergencyCost).toFixed(2)} cr total cost.`,
  ];
  if (cache && edge && boost && run.emergencyCost > 0) return {
    id: 'emergency-bridge', title: 'Emergency bridge', summary: 'Layered infrastructure with a paid filtering boost.',
    evidence: [...evidence, `Filtering boost accepted at ${boost.time}s · ${run.emergencyCost.toFixed(2)} cr charged.`],
    tradeoff: 'Boosted filtering rejects more bots, but also 3% of legitimate customers during its active window.',
    experiment: 'Try preparing App capacity before the last surge instead of spending on an emergency boost.',
  };
  if (cache && edge && scaleIndex >= 0 && cacheIndex >= 0) {
    const cacheFirst = cacheIndex < scaleIndex;
    return { id: cacheFirst ? 'cache-first' : 'layered', title: cacheFirst ? 'Cache-first protection' : 'Layered capacity',
      summary: cacheFirst ? 'Read caching came before your first App expansion.' : 'App expansion came before adding Cache and protected ingress.',
      evidence: [...evidence, `Cache requested at ${actions[cacheIndex].time}s; first App expansion at ${actions[scaleIndex].time}s.`],
      tradeoff: 'Cache reduces eligible SQL reads; Edge filters bots but also rejects some customers. Neither increases SQL write capacity.',
      experiment: cacheFirst ? 'Try delaying Cache until demand grows and compare cost under the same objective.' : 'Try adding Cache before your first expansion and compare availability and total cost.',
    };
  }
  if (cache && !edge && scaleIndex >= 0) return {
    id: 'cache-led', title: 'Cache-led expansion', summary: 'Read caching and App capacity, without active Edge filtering.',
    evidence: [...evidence, `First App expansion requested at ${actions[scaleIndex].time}s · Cache active at the finish.`],
    tradeoff: 'There is no Edge false-positive loss, but bots still consume App capacity. Cache cannot handle Order writes.',
    experiment: 'Try protected ingress with fewer App instances and compare customer availability against cost.',
  };
  return { id: 'mixed', title: 'Your own approach', summary: 'This attempt does not match a named live-action pattern.', evidence,
    tradeoff: `Peak App pressure was ${(run.peaks.app * 100).toFixed(1)}%; SQL read pressure was ${(run.peaks.sqlRead * 100).toFixed(1)}%. These are utilization ratios, not waiting queues.`,
    experiment: 'Try expanding App before the first demand increase, then inspect whether SQL reads need Cache.',
  };
}
