import type { View } from './controller';
import { useEffect, useRef, type ReactNode } from 'react';

export function GameResult({ result, restart, review, nextLevel, records }: { result: NonNullable<View['result']>; restart: () => void; review: () => void; nextLevel?: () => void; records?: ReactNode }) {
  const completed = result.status === 'COMPLETED';
  const retry = useRef<HTMLButtonElement>(null);
  useEffect(() => { retry.current?.focus(); }, []);
  return <section className={`game-result${completed ? ' success' : ''}`} aria-label="Business result">
    <span className="result-emblem" aria-hidden="true">{completed ? '✓' : '!'}</span>
    <h2 id="game-result-heading">{completed ? 'Business kept flowing' : 'Business interrupted'}</h2>
    <h3>{result.primary}</h3>
    <div className="result-score"><small>Score </small><strong>{result.score}</strong></div>
    <dl><dt>Business value</dt><dd>{result.economy.netBusinessValue.toFixed(1)} cr</dd><dt>Availability</dt><dd>{(result.metrics.availability * 100).toFixed(2)}%</dd><dt>Operation</dt><dd>{result.elapsedTime}s</dd></dl>
    {result.challenge && <p data-testid="challenge-outcome">{result.challenge.id} · {result.challenge.objective.kind === 'survive' ? 'Complete the operation' : `Availability ≥ ${result.challenge.objective.target * 100}%`} — {result.objectiveMet ? 'met' : 'not met'}</p>}
    <p className="result-advice"><strong>{completed ? 'Your next decision' : 'Recommended move'}</strong>{result.insight}</p>
    {records}
    {nextLevel && <button type="button" className="result-primary" onClick={nextLevel}>Next level</button>}
    <button ref={retry} type="button" className={nextLevel ? 'result-review' : 'result-primary'} aria-describedby="game-result-heading" onClick={restart}>Play again</button>
    <button type="button" className="result-review" onClick={review}>Review business</button>
  </section>;
}
