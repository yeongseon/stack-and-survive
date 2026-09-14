import type { Challenge } from '@stack-and-survive/scenarios/challenge';
import { sameChallenge } from '@stack-and-survive/scenarios/challenge';
import type { RunHistory, RunSummary } from './run-history';

export function architectureSummary(run: RunSummary) {
  return run.finalArchitecture.resources.filter(resource => resource.remaining === 0 && resource.kind !== 'internet')
    .map(resource => resource.kind === 'compute' ? `App ×${resource.instances}` : resource.kind === 'database' ? 'SQL' : resource.kind === 'cache' ? 'Cache' : 'Edge').join(' + ');
}
export function RunHistoryPanel({ history, challenge, message, clear, retrySave, needsSave }: {
  history: RunHistory; challenge: Challenge; message: string; clear: () => void; retrySave: () => void; needsSave: boolean;
}) {
  const best = history.bests.find(record => sameChallenge(record.challenge, challenge));
  return <section className="run-history-panel" aria-label="Local run records">
    <p>Stored only in this browser. Recent runs are limited to 20; bests are kept separately for each exact challenge. Highest recorded completed level: {history.highestLevel}.</p>
    {message && <p role="status">{message}</p>}
    {needsSave && <button type="button" onClick={retrySave}>Retry saving records</button>}
    <h3>Personal best · {challenge.id}</h3>
    {best ? <dl><dt>Best availability</dt><dd>{(best.highestAvailability.availability * 100).toFixed(2)}%</dd>
      <dt>Lowest total cost</dt><dd>{(best.lowestCost.cost + best.lowestCost.emergencyCost).toFixed(2)} cr</dd>
      <dt>Highest business value</dt><dd>{best.highestValue.nbv.toFixed(2)} cr</dd></dl> : <p>No objective-valid completion yet. Short failures and missed objectives cannot set these bests.</p>}
    <h3>Recent attempts</h3>
    {history.runs.length === 0 ? <p>No recorded runs yet.</p> : <ol className="run-history-list">{[...history.runs].reverse().map(run => <li key={run.id}>
      <strong>{run.challenge.id} · {run.status === 'FAILED' ? 'Failed' : run.objectiveMet ? 'Objective met' : 'Objective missed'} · {run.elapsed}s</strong>
      <p>{architectureSummary(run)}</p>
      <p>{(run.availability * 100).toFixed(2)}% availability · {(run.cost + run.emergencyCost).toFixed(2)} cr cost · {run.nbv.toFixed(2)} cr business value · score {run.score}</p>
      {!sameChallenge(run.challenge, challenge) && <small>Different challenge conditions — not comparable to this selection.</small>}
    </li>)}</ol>}
    <button type="button" onClick={clear}>Clear run history</button>
  </section>;
}
