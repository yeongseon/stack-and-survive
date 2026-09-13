import type { View } from './controller';
import { useEffect, useRef } from 'react';

export function GameResult({ result, restart, review }: { result: NonNullable<View['result']>; restart: () => void; review: () => void }) {
  const completed = result.status === 'COMPLETED';
  const retry = useRef<HTMLButtonElement>(null);
  useEffect(() => { retry.current?.focus(); }, []);
  return <section className={`game-result${completed ? ' success' : ''}`} aria-label="Business result">
    <span className="result-emblem" aria-hidden="true">{completed ? '✓' : '!'}</span>
    <h2 id="game-result-heading">{completed ? 'Business kept flowing' : 'Business interrupted'}</h2>
    <h3>{result.primary}</h3>
    <div className="result-score"><small>Score </small><strong>{result.score}</strong></div>
    <dl><dt>Business value</dt><dd>{result.economy.netBusinessValue.toFixed(1)} cr</dd><dt>Availability</dt><dd>{(result.metrics.availability * 100).toFixed(2)}%</dd><dt>Operation</dt><dd>{result.elapsedTime}s</dd></dl>
    <p className="result-advice"><strong>{completed ? 'Your next decision' : 'Recommended move'}</strong>{result.insight}</p>
    <button ref={retry} type="button" className="result-primary" aria-describedby="game-result-heading" onClick={restart}>Play again</button>
    <button type="button" className="result-review" onClick={review}>Review business</button>
  </section>;
}
