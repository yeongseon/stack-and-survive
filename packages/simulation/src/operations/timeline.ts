/**
 * Incident timeline projection.
 * Converts SimulationEvent records into an ordered incident history.
 * Deterministic: same events produce the same timeline.
 */
import type { SimulationEvent } from './contract';

const MAX_TIMELINE_EVENTS = 100;

export interface TimelineEntry {
  time: string;
  severity: SimulationEvent['severity'];
  title: string;
  detail: string;
  type: SimulationEvent['type'];
}

export function formatSimTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function buildTimeline(events: readonly SimulationEvent[]): TimelineEntry[] {
  return events
    .slice(-MAX_TIMELINE_EVENTS)
    .sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id))
    .map(e => ({
      time: formatSimTime(e.timestamp),
      severity: e.severity,
      title: e.title,
      detail: e.detail,
      type: e.type,
    }));
}
