import { useRef } from 'react';
import type { View } from './controller';
import { activeCostPerMinute } from '@stack-and-survive/simulation/economy';
import { primaryPressure } from './primary-pressure';

export function PrimaryHUD({ view }: { view: View }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const r = view.snapshot?.requests;
  const metrics = view.snapshot?.metrics;
  const economy = view.state.economy;
  const pressure = primaryPressure(view);
  const status = view.state.runtime.status;
  const frozen = status === 'PAUSED' || status === 'COMPLETED' || status === 'FAILED';
  return <>
    <section aria-label="Live service and business metrics" className="metrics-bar">
      <div><span>Operational budget</span><strong data-testid="budget">{economy.remainingBudget.toFixed(2)} <small>cr</small></strong></div>
      <div><span>Offered demand</span><strong><b data-testid="traffic">{r ? r.offered.browse + r.offered.order + r.offered.bot : '—'}</b> <small>RPS</small></strong></div>
      <div><span>Availability</span><strong data-testid="availability">{metrics ? `${(metrics.availability * 100).toFixed(2)}%` : '—'}</strong></div>
      <div className={`primary-pressure${pressure.urgent ? ' urgent' : ''}`}><span>{frozen ? 'Last tick pressure' : 'Current pressure'}</span><strong data-testid="dominant-pressure" role="status">{pressure.label}</strong><button ref={trigger} type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Why &amp; metrics</button></div>
    </section>
    <dialog ref={dialog} className="metrics-dialog" aria-labelledby="metrics-title" onClose={() => trigger.current?.focus()} onClick={e => {
      const bounds = e.currentTarget.getBoundingClientRect();
      if (e.target === e.currentTarget && (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom)) dialog.current?.close();
    }}>
      <form method="dialog"><button type="submit" autoFocus>Close metrics</button></form>
      <h2 id="metrics-title">Operation insights</h2><h3>{pressure.label}</h3><p>{pressure.why}</p>
      <p>{frozen ? `Readings are frozen at the last measured tick (${view.state.runtime.time}s). ${status === 'PAUSED' ? 'The operation is paused.' : 'The operation has ended.'}` : 'Readings describe the latest measured tick. Opening insights does not pause the operation.'}</p>
      <p>Pressure markers represent load, not waiting requests. Dropped requests are not buffered for later service.</p>
      {view.snapshot?.critical && <p className="hint">{view.state.streaks.availability > 0 ? `${view.snapshot.failureCountdown.availability} consecutive bad seconds until availability failure. ` : ''}{view.state.streaks.order > 0 ? `Order-flow failure in ${view.snapshot.failureCountdown.order} bad seconds.` : ''}</p>}
      <dl>
        <dt>Tick latency</dt><dd data-testid="latency">{metrics?.averageLatency == null ? '—' : `${metrics.averageLatency.toFixed(0)} ms`}</dd>
        <dt>Tick error rate</dt><dd>{metrics ? `${(metrics.errorRate * 100).toFixed(2)}%` : '—'}</dd>
        <dt>Cloud cost · credits</dt><dd data-testid="cloud-cost">{economy.infrastructureCost.toFixed(2)}</dd>
        <dt>Revenue · credits</dt><dd>{economy.revenue.toFixed(2)}</dd>
        <dt>Net business value · credits</dt><dd>{economy.netBusinessValue.toFixed(2)}</dd>
        <dt>App dropped/s</dt><dd>{r ? (r.app.dropped.browse + r.app.dropped.order + r.app.dropped.bot).toFixed(1) : '—'}</dd>
        <dt>SQL reads dropped/s</dt><dd>{r?.sql.readsDropped.toFixed(1) ?? '—'}</dd>
        <dt>SQL writes dropped/s</dt><dd>{r?.sql.writesDropped.toFixed(1) ?? '—'}</dd>
        <dt>Bots reaching App/s</dt><dd data-testid="bots-at-app">{r ? r.rateLimit.passed.bot.toFixed(1) : '—'}</dd>
        <dt>WAF-filtered bots/s</dt><dd data-testid="filtered-bots">{r ? r.edge.filtered.bot.toFixed(1) : '—'}</dd>
        <dt>Cache hit ratio</dt><dd data-testid="cache-hit">{r?.cache.hitRatio == null ? 'N/A' : `${(r.cache.hitRatio * 100).toFixed(1)}%`}</dd>
        <dt>SQL reads avoided/s</dt><dd>{r?.cache.hits.toFixed(1) ?? '—'}</dd>
        <dt>Running cost/min</dt><dd>{activeCostPerMinute(view.state.runtime.architecture)} credits</dd>
      </dl><p>Revenue does not refill the operational budget. Net business value subtracts infrastructure, emergency cost, and incident loss from revenue.</p>
    </dialog>
  </>;
}
