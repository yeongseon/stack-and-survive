import type { View } from './controller';
import { objectives } from './observations';

export function MissionPanel({ view }: { view: View }) {
  return <div className="mission-panel">
    <section aria-label="Scenario objectives"><h2>Mission objectives</h2><p className="objective-note">Live progress is provisional until the result.</p>
      <ul>{objectives(view).map(objective => <li key={objective.name} data-objective-state={objective.status}><span aria-hidden="true">{objective.status === 'met' ? '✓' : objective.status === 'missed' ? '×' : '◇'}</span><div><strong>{objective.name}</strong><small>{objective.status} · {objective.value}</small></div></li>)}</ul>
    </section>
    <section aria-label="Simulation event feed"><h2>Operations log</h2>
      {view.events.length === 0 ? <p className="objective-note">Plan your infrastructure. Events appear as demand and processing change.</p> : <ol>{[...view.events].reverse().map(event => <li key={event.key}><time>{event.clock} {Math.floor(event.time / 60)}:{String(event.time % 60).padStart(2, '0')}</time><span>{event.text}</span></li>)}</ol>}
    </section>
  </div>;
}
