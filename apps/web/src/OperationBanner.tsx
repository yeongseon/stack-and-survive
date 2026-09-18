import { useEffect, useState } from 'react';
import type { OperationEvent } from './operations-director';
import './operation-banner.css';

export function OperationBanner({ event }: { event: OperationEvent | null }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<OperationEvent | null>(null);

  useEffect(() => {
    if (!event) return;
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
      <strong>{current.title}</strong>
      {current.detail && <span>{current.detail}</span>}
    </div>
  );
}
