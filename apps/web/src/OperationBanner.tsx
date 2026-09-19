import { useEffect, useState } from 'react';
import type { OperationEvent } from './operations-director';
import './operation-banner.css';

export function OperationBanner({ event }: { event: OperationEvent | null }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<OperationEvent | null>(null);

  useEffect(() => {
    if (!event) { setVisible(false); setCurrent(null); return; }
    setCurrent(event);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), event.duration);
    return () => clearTimeout(timer);
  }, [event]);

  if (!current || !visible) return null;

  return (
    <div
      className={`operation-banner ${current.category}`}
      role="status"
      aria-live={current.category === 'critical' ? 'assertive' : 'polite'}
      data-testid="operation-banner"
    >
      <small aria-hidden="true">{({ wave: 'INCOMING WAVE', warning: 'WATCH THE PRESSURE', critical: 'OPERATION AT RISK', success: 'OPERATION UPDATE', economy: 'BUSINESS UPDATE', countdown: 'HOLD THE LINE' })[current.category]}</small>
      <strong>{current.title}</strong>
      {current.detail && <span>{current.detail}</span>}
    </div>
  );
}
