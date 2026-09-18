import type { Scenario } from '@stack-and-survive/schema';
import { missionBrief } from './mission-brief';

export function MissionBrief({ scenario }: { readonly scenario: Scenario }) {
  const brief = missionBrief(scenario);
  return <section className="onboarding-brief" aria-label="Mission briefing">
    <div className="brief-purpose"><strong>{brief.name}</strong><span>Survive {brief.duration} seconds of rising traffic.</span></div>
    <p className="brief-forecast"><span>{brief.opening} req/s</span><span aria-hidden="true"> → </span><span>traffic spikes</span><span aria-hidden="true"> → </span><span>bot attacks</span><span aria-hidden="true"> → </span><strong>FINAL: {brief.final} req/s · {brief.bots}% bots</strong></p>
    <p className="brief-tools">Your tools: <b>App · Cache · Protected Edge</b><span>Build before waves arrive. Protect customers. Control lost sales.</span></p>
  </section>;
}
