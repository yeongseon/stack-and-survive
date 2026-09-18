import { useState } from 'react';
import type { View } from './controller';
import { resourceVisualState } from './resource-visual-state';
export function AzureTrafficKey({ view }: { view: View }) {
  const [open, setOpen] = useState(false);
  const visual = resourceVisualState(view);
  const congested = [visual.app, visual.sql, visual.cache].some(resource => resource.pressure === 'overcapacity');
  return <section className={`azure-traffic-key${congested ? ' is-congested' : ''}`} aria-label="Traffic direction and legend">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>Traffic key{congested ? ' · !! Capacity constraint' : ' · →'}</button>
    {open && <div className="azure-traffic-content"><p>Ingress → App → SQL · eligible reads may take the Cache branch.</p>
      <ul><li data-traffic="normal">→ Incoming customer traffic</li><li data-traffic="read">─→ Browse / database reads</li><li data-traffic="write">═→ Orders / database writes</li><li data-traffic="bot">×→ Bot traffic · no sales</li></ul>
      <p>{congested ? '!! Dashed resource borders and pressure labels identify capacity constraints.' : 'Static arrows retain direction when motion is reduced.'} Markers represent flow, not individual requests or a waiting queue.</p>
      <p className="azure-timeline-slot">Event timeline integration reserved · no fabricated incidents.</p>
    </div>}
  </section>;
}
