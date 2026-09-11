import type { Result } from './ResultPanel';
import { compareAttempts } from './comparison';

const format = (value: number | null) => value === null ? 'N/A' : value.toFixed(2);
export function ComparisonPanel({ previous, current }: { previous: Result; current: Result }) {
  const comparison = compareAttempts(previous, current);
  return <section className="result-panel" aria-label="Previous and current comparison">
    <p className="eyebrow">PREVIOUS → CURRENT</p><h2>What changed after redesign?</h2>
    <p>Previous: {previous.status} · {previous.elapsedTime}s · {previous.primary}</p>
    <p>Current: {current.status} · {current.elapsedTime}s · {current.primary}</p>
    {!comparison.sameScenario && <p role="alert">Different scenario or balance versions — deltas are unavailable.</p>}
    {!comparison.sameDuration && <p className="critical">Different run lengths. Total cost and business value cover different amounts of traffic; lower cost alone does not mean better efficiency.</p>}
    <div className="table-scroll"><table><caption>Observed attempt totals — delta is current minus previous, not an efficiency rating</caption><thead><tr><th scope="col">Metric</th><th scope="col">Previous</th><th scope="col">Current</th><th scope="col">Delta</th></tr></thead>
      <tbody>{comparison.rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{format(row.before)}</td><td>{format(row.after)}</td><td>{format(row.delta)}</td></tr>)}</tbody></table></div>
    <details><summary>Compare matching completed phases</summary>
      {comparison.phases.length === 0 ? <p>No equal-duration completed phases are available in both attempts.</p> : comparison.phases.map(phase => <article key={phase.start}><h3>{phase.start}–{phase.end}s</h3>
        <p>SQL read peak: {(phase.before.peaks.sqlRead * 100).toFixed(1)}% → {(phase.after.peaks.sqlRead * 100).toFixed(1)}%</p>
        <p>Successful legitimate requests: {phase.before.successful.toFixed(1)} → {phase.after.successful.toFixed(1)}</p>
        <p>Filtered bots: {phase.before.botsFiltered.toFixed(1)} → {phase.after.botsFiltered.toFixed(1)}</p>
      </article>)}
    </details>
  </section>;
}
