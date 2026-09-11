import { array, integer, number, record, text, type Scenario } from '@stack-and-survive/schema';
import data from './black-friday.json';

export function parseScenario(input: unknown): Scenario {
  const s = record(input, 'scenario');
  if (s.schemaVersion !== 1 || s.balanceVersion !== '0.2') throw new Error('Unsupported scenario/balance version');
  const duration = integer(s.duration, 'duration', 1); const mix = record(s.businessMix, 'businessMix');
  const browse = number(mix.browse, 'browse', 0, 1); const order = number(mix.order, 'order', 0, 1);
  const sum = browse + order;
  if (Math.abs(sum - 1) > 1e-9) throw new Error('Business mix must sum to 1');
  const traffic = array(s.traffic, 'traffic').map(item => {
    const p = record(item, 'phase'); return Object.freeze({ start: integer(p.start, 'start'), end: integer(p.end, 'end', 1), rps: number(p.rps, 'rps', 0, 1000), botRatio: number(p.botRatio, 'botRatio', 0, 1) });
  });
  let end = 0;
  for (const phase of traffic) {
    if (phase.start !== end || phase.end <= phase.start) throw new Error('Traffic phases must be contiguous positive intervals');
    end = phase.end;
  }
  if (end !== duration) throw new Error('Traffic phases must cover full duration');
  const targets = record(s.targets, 'targets');
  return Object.freeze({ schemaVersion: 1, balanceVersion: '0.2', id: text(s.id, 'id'), duration, budget: number(s.budget, 'budget', Number.MIN_VALUE),
    businessMix: Object.freeze({ browse: browse / sum, order: order / sum }), traffic: Object.freeze(traffic),
    targets: Object.freeze({ availability: number(targets.availability, 'availability', Number.MIN_VALUE, 1), latencyMs: number(targets.latencyMs, 'latencyMs', Number.MIN_VALUE), netBusinessValue: number(targets.netBusinessValue, 'netBusinessValue', Number.MIN_VALUE) }) });
}
export const blackFriday = parseScenario(data);
