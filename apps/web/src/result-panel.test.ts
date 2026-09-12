import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday, parseScenario } from '@stack-and-survive/scenarios';
import { simulateScenario } from '@stack-and-survive/simulation/results';
import { displayLatency, ResultPanel } from './ResultPanel';

it.each([
  [1, false, false, 'App Service Saturation'],
  [4, false, false, 'Azure SQL Saturation'],
  [2, true, false, 'Unfiltered Bot Traffic'],
  [4, true, true, 'Overprovisioning'],
] as const)('renders evidence for %s instances/cache=%s/edge=%s', (instances, cache, edge, cause) => {
  const result = simulateScenario(baseline(instances, cache, edge), blackFriday);
  const markup = renderToStaticMarkup(createElement(ResultPanel, { result, onRedesign: () => {} }));
  expect(markup).toContain(cause); expect(markup).toContain(result.economy.netBusinessValue.toFixed(2));
  expect(markup).toContain(result.score.toLocaleString('en-US')); expect(markup).toContain('Demand phase evidence');
  expect(markup).toContain(renderToStaticMarkup(createElement('p', null, result.insight)));
  expect(markup).toContain(`Physical bottleneck: ${result.bottleneck ?? 'None — this outcome is not attributed to a saturated resource.'}`);
  expect(markup).toContain(`Contributing causes: ${result.contributors.length ? result.contributors.join(' · ') : 'None above the reporting threshold.'}`);
  for (const phase of result.phases) {
    expect(markup).toContain(`${phase.start}–${phase.end}s · ${phase.partial ? 'Partial' : 'Complete'} (${phase.data.ticks} ticks)`);
    expect(markup).toContain(`Primary cause: ${phase.primary}`);
  }
});
it('does not present null latency or no-demand availability as measured service', () => {
  const scenario = parseScenario({ ...blackFriday, duration: 1, traffic: [{ start: 0, end: 1, rps: 0, botRatio: 0 }] });
  const result = simulateScenario(baseline(), scenario);
  const markup = renderToStaticMarkup(createElement(ResultPanel, { result, onRedesign: () => {} }));
  expect(markup).toContain('N/A — no successful requests'); expect(markup).toContain('N/A — no legitimate demand');
  expect(markup).toContain('Negative Business Value');
});
it('distinguishes survival from all-target success', () => {
  const missed = simulateScenario(baseline(3, true, true), blackFriday, [{ time: 118, sequence: 0, type: 'RATE_LIMIT', enabled: true }, { time: 178, sequence: 1, type: 'RATE_LIMIT', enabled: false }]);
  const achieved = simulateScenario(baseline(3, true, true), blackFriday);
  const render = (result: typeof missed) => renderToStaticMarkup(createElement(ResultPanel, { result, onRedesign: () => {} }));
  expect(render(missed)).toContain('OPERATION COMPLETED');
  expect(render(missed)).toContain('Targets: Not all met');
  expect(render(missed)).toContain('availability not met, latency met, business value not met');
  expect(render(achieved)).toContain('Targets: All met');
  expect(render(achieved)).not.toContain('SCENARIO FAILED');
});
it('shows only played phases and preserves measured zero values', () => {
  const result = simulateScenario(baseline(), blackFriday);
  const markup = renderToStaticMarkup(createElement(ResultPanel, { result, onRedesign: () => {} }));
  expect(markup).toContain('0–30s · Complete (30 ticks)');
  expect(markup).toContain('30–75s · Partial (20 ticks)');
  expect(markup).not.toContain('75–120s');
  expect(markup).toContain('<dt>Emergency cost</dt><dd>0.00</dd>');
  expect(displayLatency(0)).toBe('0.0 ms');
});
