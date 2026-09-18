import type { Resource } from '@stack-and-survive/schema';
import { resourceTier } from '@stack-and-survive/cloud-domain';

export function optionalScalingAsset(name: string): boolean {
  return /^(app-service|app-module|azure-sql)-tier-[123]$/.test(name) || name === 'azure-sql-replica';
}
export function scalingAsset(resource: Resource, available: (name: string) => boolean): string {
  const base = resource.kind === 'compute' ? 'app-service' : 'azure-sql';
  const candidate = `${base}-tier-${resourceTier(resource)}`;
  return available(candidate) ? candidate : base;
}
export function scalingModuleAsset(resource: Resource, available: (name: string) => boolean): string {
  const candidate = `app-module-tier-${resourceTier(resource)}`;
  return available(candidate) ? candidate : 'app-module';
}
export const replicaOffsets = [{ x: -82, y: 84 }, { x: -158, y: 120 }] as const;
