import { validExportResponse, type ExportRequest, type ExportResponse } from './export-azure';
const API_BASE = import.meta.env?.VITE_LEADERBOARD_API ?? '';
export type AgentStep = { tool: 'mapping' | 'policy' | 'compile' | 'architecture'; status: 'passed' | 'failed'; attempt: number };
export type AgentVerification = { artifactSha256: string; attempts: number; steps: AgentStep[] };
export type AgentResult = { export: ExportResponse; verification: AgentVerification } | { export: null; steps: AgentStep[] };
function exact(value: unknown, keys: string[]): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
export function validAgentSteps(value: unknown): value is AgentStep[] {
  if (!Array.isArray(value) || value.length > 10) return false;
  let lastAttempt = 0;
  return value.every(step => {
    if (!exact(step, ['tool', 'status', 'attempt']) || !['mapping', 'policy', 'compile', 'architecture'].includes(String(step.tool))
      || !['passed', 'failed'].includes(String(step.status)) || !Number.isInteger(step.attempt) || typeof step.attempt !== 'number'
      || step.attempt < lastAttempt || step.attempt > 2 || (step.tool !== 'mapping' && step.attempt < 1)) return false;
    lastAttempt = step.attempt; return true;
  });
}
export function validAgentResponse(value: unknown): value is { export: ExportResponse; verification: AgentVerification } {
  if (!exact(value, ['export', 'verification']) || !validExportResponse(value.export)
    || !exact(value.verification, ['artifactSha256', 'attempts', 'steps'])) return false;
  const v = value.verification;
  if (typeof v.artifactSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(v.artifactSha256) || (v.attempts !== 1 && v.attempts !== 2) || !validAgentSteps(v.steps)) return false;
  const steps = v.steps;
  return ['policy', 'compile', 'architecture'].every((tool, index) => {
    const step = steps[steps.length - 3 + index]; return step?.tool === tool && step.status === 'passed' && step.attempt === v.attempts;
  });
}
export async function requestAgentExport(request: ExportRequest): Promise<AgentResult> {
  const failed = { export: null, steps: [] } satisfies AgentResult;
  if (!API_BASE.trim()) return failed;
  try {
    const response = await fetch(`${API_BASE}/api/export-agent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(65_000) });
    const body = await response.text(); if (body.length > 50000) return failed;
    const data: unknown = JSON.parse(body);
    if (!response.ok) return exact(data, ['error', 'steps']) && validAgentSteps(data.steps) ? { export: null, steps: data.steps } : failed;
    if (!validAgentResponse(data)) return failed;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([data.export.bicep, data.export.parametersJson])));
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hash === data.verification.artifactSha256 ? data : failed;
  } catch { return failed; }
}
