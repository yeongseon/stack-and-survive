import { useState } from 'react';
import type { Kind } from '@stack-and-survive/schema';
import { serviceIcons } from './service-icons';

export function ServiceIcon({ kind, decorative = false }: { kind: Kind; decorative?: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const icon = serviceIcons[kind];
  if (!icon) return null;
  return <span className="service-icon" title={icon.context} data-service={kind} aria-hidden={decorative ? true : undefined}>
    {failedSource === icon.src
      ? <span role="img" aria-label={`${icon.name} — icon unavailable`} data-fallback="true">{icon.fallback}</span>
      : <img src={icon.src} width={24} height={24} alt={decorative ? '' : icon.name} onError={() => setFailedSource(icon.src)} />}
  </span>;
}
