import type { View } from './controller';
import { value } from '@stack-and-survive/simulation/economy';

export function businessFeedback(view: View) {
  const snapshot = view.snapshot;
  if (!snapshot || view.error || view.state.runtime.status !== 'RUNNING') return null;
  const { browse, order } = snapshot.requests.successful;
  return order > 0 ? { tick: snapshot.time, orders: order, revenue: browse * value.browse + order * value.order } : null;
}
