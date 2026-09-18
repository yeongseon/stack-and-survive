import type { View } from './controller';
import { phaseArrival } from './mission-brief';

export function PhaseArrival({ view }: { readonly view: View }) {
  const arrival = phaseArrival(view);
  return <div className="phase-arrival-slot" role="status" aria-label="Phase arrival" aria-live="polite" aria-atomic="true">
    {arrival && <div key={arrival.start} className={`phase-arrival${arrival.bots ? ' with-bots' : ''}`} data-testid="phase-arrival">
      <strong>{arrival.label}</strong><span>{arrival.rps} req/s{arrival.bots > 0 ? ` · ${arrival.bots}% bots` : ''}</span>
      {arrival.bots > 0 && <small>Red packets = malicious traffic · Edge filters bots</small>}
    </div>}
  </div>;
}
