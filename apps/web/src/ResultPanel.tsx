import type { simulationResult } from '@stack-and-survive/simulation/results';
import { ServiceIcon } from './ServiceIcon';

export type Result = ReturnType<typeof simulationResult>;
export function displayLatency(value: number | null): string { return value === null ? 'N/A — no successful requests' : `${value.toFixed(1)} ms`; }
export function ResultPanel({ result, onRedesign }: { result: Result; onRedesign: () => void }) {
  const allTargets = Object.values(result.targetAttainment).every(Boolean);
  const entries = [
    ['Availability', result.metrics.noDemand ? 'N/A — no legitimate demand' : `${(result.metrics.availability * 100).toFixed(2)}%`],
    ['Average latency', displayLatency(result.metrics.averageLatency)], ['Peak route latency', displayLatency(result.metrics.peakLatency)],
    ['Error rate', result.metrics.noDemand ? 'N/A — no legitimate demand' : `${(result.metrics.errorRate * 100).toFixed(2)}%`],
    ['Revenue', result.economy.revenue.toFixed(2)], ['Infrastructure cost', result.economy.infrastructureCost.toFixed(2)],
    ['Emergency cost', result.economy.emergencyCost.toFixed(2)], ['Incident loss', result.economy.incidentLoss.toFixed(2)],
    ['Net business value', result.economy.netBusinessValue.toFixed(2)], ['Remaining budget', result.economy.remainingBudget.toFixed(2)],
  ];
  return <section className="result-panel" aria-label="Scenario result">
    <p className="eyebrow">BLACK FRIDAY · {result.status === 'COMPLETED' ? 'OPERATION COMPLETED' : 'SCENARIO FAILED'}</p>
    <div className="result-heading"><div><h2>{result.primary}</h2><p>{result.insight}</p></div><div><span>Architecture score</span><strong data-testid="result-score">{result.score.toLocaleString('en-US')}</strong><span>/ 10,000</span></div></div>
    <p data-testid="result-duration">Elapsed: {result.elapsedTime} / 180 seconds · {result.status} · Balance {result.balanceVersion}</p>
    <p>Targets: {allTargets ? 'All met' : 'Not all met'} — availability {result.targetAttainment.availability ? 'met' : 'not met'}, latency {result.targetAttainment.latency ? 'met' : 'not met'}, business value {result.targetAttainment.businessValue ? 'met' : 'not met'}. Survival is not the same as meeting every target.</p>
    <dl className="result-metrics">{entries.map(([label, content]) => <div key={label}><dt>{label}</dt><dd>{content}</dd></div>)}</dl>
    <p>Physical bottleneck: {result.bottleneck ?? 'None — this outcome is not attributed to a saturated resource.'}</p>
    {result.bottleneck && <p className="result-service"><ServiceIcon kind={result.bottleneck === 'App Service' ? 'compute' : 'database'} decorative />Azure service reference: {result.bottleneck}</p>}
    <p>Contributing causes: {result.contributors.length ? result.contributors.join(' · ') : 'None above the reporting threshold.'}</p>
    <button type="button" onClick={onRedesign}>Redesign &amp; Retry</button>
    <details><summary>View result details</summary>
      <h3>Lost business value by stage</h3><p>Each lost request is counted at its first loss stage. Bot displacement is a subset of App loss, not another charge.</p>
      <dl>{Object.entries(result.attribution.losses).map(([cause, loss]) => <div key={cause}><dt>{cause}</dt><dd>{loss.toFixed(4)} credits</dd></div>)}</dl>
      <p>Bot-displaced value: {result.attribution.botDisplacement.toFixed(4)} · Bots filtered: {result.attribution.botsFiltered.toFixed(1)} / {result.attribution.botsOffered.toFixed(1)}</p>
      <p>Failure penalty: {result.failurePenalty} · Overprovisioning penalty: {result.overprovisioningPenalty}. Negative-value survival is capped at 3,000.</p>
      <h3>Score components (0–100)</h3><dl>{Object.entries(result.components).map(([name, score]) => <div key={name}><dt>{name}</dt><dd>{score.toFixed(2)}</dd></div>)}</dl>
      <h3>Demand phase evidence</h3><p>Later unplayed phases are absent. A phase can show resource pressure below the threshold for a primary business-loss cause.</p>
      {result.phases.map(phase => <article key={phase.start}><h4>{phase.start}–{phase.end}s · {phase.partial ? 'Partial' : 'Complete'} ({phase.data.ticks} ticks)</h4>
        <p>Primary cause: {phase.primary}</p><p>Offered: {phase.data.offered.toFixed(1)} · Successful: {phase.data.successful.toFixed(1)}</p>
        <p>Peak App {(phase.data.peaks.app * 100).toFixed(1)}% · SQL reads {(phase.data.peaks.sqlRead * 100).toFixed(1)}% · SQL writes {(phase.data.peaks.sqlWrite * 100).toFixed(1)}%</p>
      </article>)}
    </details>
  </section>;
}
