import type { Architecture, ResourceTier } from '@stack-and-survive/schema';
import { appTiers, databaseTiers, resourceTier } from '@stack-and-survive/cloud-domain';
import type { RunSummary } from './run-history';
import type { View } from './controller';
export { copyToClipboard } from './global-leaderboard';

const API_BASE = import.meta.env?.VITE_LEADERBOARD_API ?? '';
export const exportConfigured = API_BASE.trim().length > 0;
export type ExportRequest = {
  challengeId: string; rulesVersion: '0.4'; durationSeconds: number;
  outcome: { status: 'COMPLETED' | 'FAILED'; objectiveMet: boolean; elapsedSeconds: number; availability: number; score: number; infrastructureCost: number; emergencyCost: number; netBusinessValue: number; primaryCause: string; peaks: { app: number; sqlRead: number; sqlWrite: number } };
  finalArchitecture: { app: { tier: ResourceTier; tierName: string; instances: number; capacityPerInstance: number }; sql: { tier: ResourceTier; tierName: string; readReplicas: number; reads: number; writes: number }; cache: { present: boolean; active: boolean }; protectedEdge: { present: boolean; active: boolean } };
  timeline: { t: number; action: string }[];
};
export type ExportResponse = { title: string; bicep: string; parametersJson: string;
  resources: { gameResource: 'App' | 'SQL' | 'Cache' | 'Protected Edge'; azureService: string; bicepSymbol: string; sku: string; reason: string }[]; caveats: string[] };

export function buildExportRequest(result: NonNullable<View['result']>, run: RunSummary, architecture: Architecture): ExportRequest {
  if (result.challenge?.rulesVersion !== '0.4') throw new Error('Export requires rules 0.4');
  if (typeof result.objectiveMet !== 'boolean') throw new Error('Missing finished objective');
  const app = architecture.resources.find(r => r.kind === 'compute'), sql = architecture.resources.find(r => r.kind === 'database');
  if (!app || !sql) throw new Error('Missing final resources');
  const appTier = resourceTier(app), sqlTier = resourceTier(sql), a = appTiers[appTier - 1], s = databaseTiers[sqlTier - 1];
  const state = (kind: 'cache' | 'edge') => { const resource = architecture.resources.find(r => r.kind === kind); return { present: !!resource, active: !!resource && resource.remaining === 0 }; };
  return { challengeId: result.challenge.id, rulesVersion: '0.4', durationSeconds: result.challenge.workload.duration,
    outcome: { status: result.status, objectiveMet: result.objectiveMet, elapsedSeconds: result.elapsedTime, availability: result.metrics.availability, score: result.score,
      infrastructureCost: result.economy.infrastructureCost, emergencyCost: result.economy.emergencyCost, netBusinessValue: result.economy.netBusinessValue, primaryCause: result.primary, peaks: { ...run.peaks } },
    finalArchitecture: { app: { tier: appTier, tierName: a.name, instances: app.instances, capacityPerInstance: a.capacity },
      sql: { tier: sqlTier, tierName: s.name, readReplicas: sql.readReplicas ?? 0, reads: s.reads, writes: s.writes }, cache: state('cache'), protectedEdge: state('edge') },
    timeline: run.actionLog.filter(entry => entry.accepted).sort((left, right) => left.action.time - right.action.time || left.action.sequence - right.action.sequence).slice(0, 40).map(({ action }) => ({ t: action.time,
      action: action.type === 'DEPLOY_RESOURCE' ? action.kind === 'cache' ? 'DEPLOY_CACHE' : 'DEPLOY_EDGE' : action.type === 'RATE_LIMIT' ? action.enabled ? 'RATE_LIMIT_ON' : 'RATE_LIMIT_OFF' : action.type })),
  };
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: string[]): value is Record<string, unknown> { return object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)); }
function text(value: unknown, max: number): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
export function validExportResponse(value: unknown): value is ExportResponse {
  if (!exact(value, ['title', 'bicep', 'parametersJson', 'resources', 'caveats']) || !text(value.title, 80) || !text(value.bicep, 12000)
    || new TextEncoder().encode(value.bicep).byteLength > 12000 || !text(value.parametersJson, 12000)
    || new TextEncoder().encode(value.parametersJson).byteLength > 12000) return false;
  try { if (!object(JSON.parse(value.parametersJson))) return false; } catch { return false; }
  const names = new Set<string>();
  if (!Array.isArray(value.resources) || value.resources.length < 2 || value.resources.length > 4 || !value.resources.every(item => {
    if (!exact(item, ['gameResource', 'azureService', 'bicepSymbol', 'sku', 'reason']) || typeof item.gameResource !== 'string'
      || !['App', 'SQL', 'Cache', 'Protected Edge'].includes(item.gameResource) || names.has(item.gameResource)
      || !text(item.azureService, 80) || !text(item.bicepSymbol, 80) || !text(item.sku, 40) || !text(item.reason, 1200)) return false;
    names.add(item.gameResource); return true;
  })) return false;
  return names.has('App') && names.has('SQL') && Array.isArray(value.caveats) && value.caveats.length >= 1 && value.caveats.length <= 12 && value.caveats.every(item => text(item, 1000));
}
export async function requestExport(request: ExportRequest): Promise<ExportResponse | null> {
  if (!exportConfigured) return null;
  try {
    const response = await fetch(`${API_BASE}/api/export-bicep`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return null;
    const body = await response.text(); if (body.length > 40000) return null;
    const data: unknown = JSON.parse(body); return validExportResponse(data) ? data : null;
  } catch { return null; }
}
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
