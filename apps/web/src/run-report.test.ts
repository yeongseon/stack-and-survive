import { expect, it } from 'vitest';
import { baseline } from '@stack-and-survive/cloud-domain';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { createController } from './controller';
import { emptyHistory, recordRun, summarizeRun } from './run-history';
import { buildRunReport, compareRuns } from './run-report';

function finished(instances = 4, cache = true, edge = false) {
  const c = createController({ start: () => () => {} }, { load: () => baseline(instances, cache, edge), save: () => {}, clear: () => {} });
  c.start(); while (!c.getSnapshot().result) c.inspectNextTick();
  const summary = summarizeRun(c.getSnapshot().result!, c.getSnapshot().state.runtime.architecture, 'report-run');
  c.destroy(); return summary;
}
it('compares exact compatible metrics with total emergency-inclusive cost and percentage points', () => {
  const previous = finished(), current = { ...finished(3, true, true), id: 'second' };
  const report = buildRunReport(current, recordRun(emptyHistory(), previous));
  expect(report.previous?.kind).toBe('comparable');
  if (report.previous?.kind !== 'comparable') throw new Error('Expected comparable completion');
  expect(report.previous.cost).toBe(current.cost + current.emergencyCost - previous.cost - previous.emergencyCost);
  expect(report.previous.availability).toBe((current.availability - previous.availability) * 100);
  expect(report.previous.value).toBe(current.nbv - previous.nbv);
  expect(report.records).toEqual(['Total cost', 'Business value']);
  expect(report.baseline?.previous.id).toBe(previous.id);
});
it('does not compare unlike challenges or reward short failures and first ties', () => {
  const success = finished(), failure = finished(1, false);
  expect(compareRuns(success, { ...success, challenge: challengeLadder[1].challenge })).toBeNull();
  expect(compareRuns(success, failure)?.kind).toBe('different-duration');
  expect(buildRunReport(failure, emptyHistory()).records).toEqual([]);
  expect(buildRunReport(success, emptyHistory()).records).toHaveLength(3);
  expect(buildRunReport(success, recordRun(emptyHistory(), success)).records).toEqual([]);
});
