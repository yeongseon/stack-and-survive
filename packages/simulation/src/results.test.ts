import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { blackFriday, parseScenario } from '@stack-and-survive/scenarios';
import { emptyAttribution, explain } from './attribution';
import { simulateScenario } from './results';

it('scores efficient and oversized protected designs with honest penalties', () => {
  const efficient = simulateScenario(baseline(3, true, true), blackFriday);
  const oversized = simulateScenario(baseline(4, true, true), blackFriday);
  expect(efficient.score).toBe(9450); expect(efficient.primary).toBe('No Critical Issue');
  expect(efficient.targetAttainment).toEqual({ availability: true, latency: true, businessValue: true });
  expect(oversized.score).toBe(8892); expect(oversized.primary).toBe('Overprovisioning');
  expect(oversized.overprovisioningPenalty).toBe(500);
});
it('reports SQL primary when compute is sufficient and preserves phase evidence', () => {
  const sql = simulateScenario(baseline(4), blackFriday);
  expect(sql.primary).toBe('Azure SQL Saturation'); expect(sql.bottleneck).toBe('Azure SQL');
  expect(sql.phases).toHaveLength(4); expect(sql.phases[3].partial).toBe(true);
  expect(sql.phases[2].primary).toBe('No Critical Issue');
  expect(sql.phases[2].data.peaks.sqlRead).toBeGreaterThan(1);
  const mixed = simulateScenario(baseline(2), blackFriday);
  expect(mixed.primary).toBe('Unfiltered Bot Traffic'); expect(mixed.bottleneck).toBe('App Service');
  expect(mixed.phases[2].data.losses['Azure SQL Saturation']).toBeCloseTo(1.08);
});
it('loss attribution equals lost revenue without double counting bot displacement', () => {
  const result = simulateScenario(baseline(2), blackFriday);
  const loss = Object.values(result.attribution.losses).reduce((a, b) => a + b, 0);
  expect(loss).toBeCloseTo(result.economy.potentialRevenue - result.economy.revenue, 10);
  expect(result.attribution.botDisplacement).toBeLessThanOrEqual(result.attribution.losses['App Service Saturation'] + 1e-9);
});
it('uses fixed tie order, meaningful threshold and strict majority bot replacement', () => {
  const a = emptyAttribution(); a.potential = 100; a.losses['App Service Saturation'] = 1; a.losses['Azure SQL Saturation'] = 1;
  expect(explain(a).primary).toBe('App Service Saturation');
  a.botDisplacement = .5; expect(explain(a).primary).toBe('App Service Saturation');
  a.botDisplacement = .6; expect(explain(a).primary).toBe('Unfiltered Bot Traffic');
  expect(explain(a).contributors).toEqual(['App Service Saturation', 'Azure SQL Saturation']);
  expect(a.losses['App Service Saturation']).toBe(1);
  expect(explain(a, { budgetFailure: true }).primary).toBe('Budget Exhaustion');
});
it('early failures do not gain security credit for unplayed bot phases', () => {
  const result = simulateScenario(baseline(), blackFriday);
  expect(result.score).toBe(1073); expect(result.components.security).toBe(0);
  expect(result.phases).toHaveLength(2); expect(result.phases[1].partial).toBe(true);
  expect(result.targetAttainment.availability).toBe(false);
});
it('negative-value survival is capped and no-bot scenarios have full security', () => {
  const scenario = parseScenario({ ...blackFriday, duration: 1, traffic: [{ start: 0, end: 1, rps: 0, botRatio: 0 }] });
  const result = simulateScenario(baseline(), scenario);
  expect(result.primary).toBe('Negative Business Value'); expect(result.score).toBeLessThanOrEqual(3000);
  expect(result.components.security).toBe(100); expect(result.components.latency).toBe(0);
});
it('rate limiting loses business without gaining targeted security credit', () => {
  const result = simulateScenario(baseline(3, true, true), blackFriday, [
    { time: 118, sequence: 0, type: 'RATE_LIMIT', enabled: true }, { time: 178, sequence: 1, type: 'RATE_LIMIT', enabled: false },
  ]);
  expect(result.score).toBe(8977); expect(result.primary).toBe('Excessive Rate Limiting');
  expect(result.components.security).toBeCloseTo(70);
  expect(result.targetAttainment.availability).toBe(false);
});
