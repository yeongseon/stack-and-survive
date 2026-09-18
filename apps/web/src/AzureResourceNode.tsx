import { useState } from 'react';
import { azureServices, type AzureServiceId } from './azure-service-catalog';
import './azure-resource-node.css';
export type AzureHealth = 'healthy' | 'warning' | 'critical' | 'offline' | 'unknown';
export interface AzureResourceNodeProps {
  service: AzureServiceId; instances: number; health: AzureHealth; utilization: number | null;
  selected?: boolean; disabled?: boolean; bottleneck?: boolean; actionHint?: string;
  lifecycle?: string; onSelect?: () => void;
}
const statuses: Record<AzureHealth, string> = { healthy: '✓ Healthy', warning: '! Warning', critical: '!! Critical', offline: '○ Offline', unknown: '— Not measured' };
export function AzureResourceNode({ service, instances, health, utilization, selected = false, disabled = false, bottleneck = false, actionHint, lifecycle, onSelect }: AzureResourceNodeProps) {
  const definition = azureServices[service];
  const [failed, setFailed] = useState<string | null>(null);
  const reading = utilization !== null && Number.isFinite(utilization) && utilization >= 0 ? utilization : null;
  const content = <>
    <span className="azure-node-identity">
      {definition.icon && failed !== definition.icon ? <img src={definition.icon} width="32" height="32" alt="" onError={() => setFailed(definition.icon ?? null)} /> : <span className="azure-node-fallback" aria-hidden="true">{definition.fallback}</span>}
      <span><strong>{definition.name}</strong><small>{definition.category} · {instances} {instances === 1 ? 'instance' : 'instances'}</small></span>
    </span>
    <span className="azure-node-state" data-health={health}>{statuses[health]}{lifecycle && <span> · {lifecycle}</span>}</span>
    {bottleneck && <span className="azure-node-bottleneck">!! Capacity constraint</span>}
    <span className="azure-node-utilization">{reading === null ? 'Utilization not measured' : `Utilization ${Math.round(reading * 100)}%`}</span>
    <span className="azure-node-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (reading ?? 0) * 100)}%` }} /></span>
    {selected && <span className="azure-node-selection">Selected</span>}
    {actionHint && <small className="azure-node-hint">{actionHint}</small>}
  </>;
  const className = `azure-resource-node${selected ? ' is-selected' : ''}${bottleneck ? ' is-bottleneck' : ''}`;
  return onSelect ? <button type="button" className={className} disabled={disabled || !definition.playable} aria-pressed={selected}
    aria-label={`${definition.name}, ${instances} ${instances === 1 ? 'instance' : 'instances'}, ${statuses[health]}, ${reading === null ? 'utilization not measured' : `${Math.round(reading * 100)} percent utilization`}${bottleneck ? ', capacity constraint' : ''}${actionHint ? `, ${actionHint}` : ''}`} onClick={onSelect}>{content}</button>
    : <div className={className} role="group" aria-label={definition.name} aria-disabled={disabled || undefined}>{content}</div>;
}
