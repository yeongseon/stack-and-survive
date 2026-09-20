import { array, integer, number, record, text } from '@stack-and-survive/schema';
import { appTiers, databaseTiers } from '@stack-and-survive/cloud-domain';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { ApiError } from './handler';
import type { ExportClient } from './azure-openai';
import { exportBicepSchema, type ExportResponse } from './export-bicep-schema';

export const EXPORT_PROMPT_VERSION = '1';
export const EXPORT_INSTRUCTIONS = `You convert a finished run of the browser game Stack & Survive into Azure infrastructure-as-code. The game is a simulation; its numbers are gameplay assumptions, not Azure specifications.
Fixed mappings, never substitute services:
App -> Microsoft.Web/serverfarms (Linux App Service plan, reserved:true) and Microsoft.Web/sites (kind:'app,linux', serverFarmId:plan.id, httpsOnly:true). Standard I=S1, Standard II=S2, Premium I=P1v3. Set plan sku.capacity to input instances. API 2023-12-01.
SQL -> Microsoft.Sql/servers and Microsoft.Sql/servers/databases, API 2023-08-01-preview. General Purpose I=GP_S_Gen5_2 (serverless), General Purpose II=GP_Gen5_4, Business Critical=BC_Gen5_4. SQL input reads/writes are primary-tier capacities, excluding replicas. Emit readScale:'Enabled' only for Business Critical with requested read replicas. For General Purpose read replicas, emit a caveat that geo-replicas/Hyperscale would be required and are not generated. Business Critical readScale is not a literal configurable replica count; explain this limitation.
Cache if present -> Microsoft.Cache/redisEnterprise, Azure Managed Redis, SKU Balanced_B1, API 2025-04-01, plus databases child named default with clientProtocol:'Encrypted', clusteringPolicy:'EnterpriseCluster', evictionPolicy:'VolatileLRU', port:10000.
Protected Edge if present -> Microsoft.Network/applicationGateways WAF_v2 plus Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies in Prevention mode, API 2023-09-01; include dedicated VNet/subnet and Standard static public IP, gateway IP configuration, frontend port/listener, backend App FQDN using app.properties.defaultHostName, backend HTTP settings, routing rule with priority and WAF policy reference. No Front Door, Monitor, App Insights or deployment scripts.
Always resource-group targetScope, location and namePrefix params, tags { 'stack-and-survive': 'export', challenge: input challengeId }. SQL uses Entra-only administrators with administratorType:'ActiveDirectory', azureADOnlyAuthentication:true, sid:sqlAdminObjectId, login:sqlAdminLogin, tenantId:subscription().tenantId. Declare sqlAdminObjectId and sqlAdminLogin string params without defaults. Never generate SQL password authentication or any credential value. parametersJson uses only declared params; omit unresolved required admin values and tell the user to supply them, never fabricate identities. Prefer namePrefix default 'stack-survive' and location default resourceGroup().location. Runtime/software deployment and application database/cache integration are not generated; disclose that an infrastructure scaffold is not a working game deployment.
Grounding: Every reason must cite at least one number from the input (availability, peak utilization, timeline second, cost). Never invent metrics or assert measured CPU/latency. Ratios may be expressed as percentages. If cache or edge is absent, do not include or discuss it. If objectiveMet is false, explicitly say the objective was not met in caveats; explain the supplied numbers without changing the final architecture. If a present resource was still provisioning, explain it was not active in the run. Timeline entries are accepted requests, NOT activation times; an omitted tail is possible after 40 entries. Do not claim requests determine the final architecture: the supplied finalArchitecture is authoritative for this unverified export.
Output constraints: Produce consistent Bicep symbolic names and API versions from 2023 or later. No placeholders like <...>, no URLs in Bicep, no credentials, no words secret or password, no multi-line comments, no modules/imports/load functions or script resources. The @ character is allowed ONLY between a Microsoft resource type and its API version in a resource declaration. parametersJson is a JSON object with contentVersion:'1.0.0.0', parameters of {value:...}, optionally the standard deploymentParameters schema URL; reference only declared params. title <=80 chars; bicep <=12000 UTF-8 bytes; one resources entry per App/SQL/present Cache/present Protected Edge, canonical service names Azure App Service, Azure SQL Database, Azure Managed Redis, Azure Application Gateway and specified SKU. bicepSymbol references that logical service's primary declaration. reason <=1200 chars, caveats 1..12 strings <=1000 chars. Return only the structured object. Complete compact code within the output budget, or the export will be rejected.
For serverless SQL minCapacity use json('0.5'), not the invalid Bicep fractional literal 0.5. SQL server Entra-only administrators do not require SQL login credentials.
Tone: plain, technical, second person, no marketing. Prompt version ${EXPORT_PROMPT_VERSION}.`;

export const timelineActions = ['SCALE_OUT', 'SCALE_IN', 'SCALE_UP_APP', 'SCALE_DOWN_APP', 'SCALE_UP_DATABASE', 'SCALE_DOWN_DATABASE', 'ADD_READ_REPLICA', 'REMOVE_READ_REPLICA', 'DEPLOY_CACHE', 'DEPLOY_EDGE', 'RATE_LIMIT_ON', 'RATE_LIMIT_OFF', 'EMERGENCY_WAF'] as const;
const causes = ['App Service Saturation', 'Azure SQL Saturation', 'Excessive Rate Limiting', 'WAF False Positives', 'Unfiltered Bot Traffic', 'Budget Exhaustion', 'Overprovisioning', 'Negative Business Value', 'No Critical Issue'];
export type ExportRequest = {
  challengeId: string; rulesVersion: '0.4'; durationSeconds: number;
  outcome: { status: 'COMPLETED' | 'FAILED'; objectiveMet: boolean; elapsedSeconds: number; availability: number; score: number; infrastructureCost: number; emergencyCost: number; netBusinessValue: number; primaryCause: string; peaks: { app: number; sqlRead: number; sqlWrite: number } };
  finalArchitecture: { app: { tier: 1 | 2 | 3; tierName: string; instances: number; capacityPerInstance: number }; sql: { tier: 1 | 2 | 3; tierName: string; readReplicas: number; reads: number; writes: number }; cache: { present: boolean; active: boolean }; protectedEdge: { present: boolean; active: boolean } };
  timeline: { t: number; action: string }[];
};
function exact(value: unknown, keys: string[]) {
  const r = record(value, 'object');
  if (Object.keys(r).length !== keys.length || keys.some(key => !Object.hasOwn(r, key))) throw new Error('Unexpected fields');
  return r;
}
function bounded(value: unknown, max: number) { const s = text(value, 'text'); if (s.length > max) throw new Error('Text too long'); return s; }
function bool(value: unknown) { if (typeof value !== 'boolean') throw new Error('Boolean required'); return value; }
function presence(value: unknown) { const r = exact(value, ['present', 'active']); const present = bool(r.present), active = bool(r.active); if (active && !present) throw new Error('Invalid activity'); return { present, active }; }
function tier(value: unknown): 1 | 2 | 3 { const n = integer(value, 'tier', 1, 3); if (n === 1 || n === 2 || n === 3) return n; throw new Error('Invalid tier'); }
export function parseExportRequest(value: unknown): ExportRequest {
  const r = exact(value, ['challengeId', 'rulesVersion', 'durationSeconds', 'outcome', 'finalArchitecture', 'timeline']);
  const challengeId = bounded(r.challengeId, 80), challenge = challengeLadder.find(level => level.challenge.id === challengeId)?.challenge;
  if (!challenge || r.rulesVersion !== '0.4' || r.durationSeconds !== challenge.workload.duration) throw new Error('Unsupported challenge');
  const o = exact(r.outcome, ['status', 'objectiveMet', 'elapsedSeconds', 'availability', 'score', 'infrastructureCost', 'emergencyCost', 'netBusinessValue', 'primaryCause', 'peaks']);
  if (o.status !== 'COMPLETED' && o.status !== 'FAILED') throw new Error('Finished run required');
  const elapsedSeconds = integer(o.elapsedSeconds, 'elapsed', 1, challenge.workload.duration), objectiveMet = bool(o.objectiveMet);
  if ((o.status === 'COMPLETED' && elapsedSeconds !== challenge.workload.duration) || (o.status === 'FAILED' && objectiveMet)) throw new Error('Inconsistent outcome');
  const primaryCause = bounded(o.primaryCause, 80); if (!causes.includes(primaryCause)) throw new Error('Unsupported cause');
  const p = exact(o.peaks, ['app', 'sqlRead', 'sqlWrite']);
  const f = exact(r.finalArchitecture, ['app', 'sql', 'cache', 'protectedEdge']);
  const a = exact(f.app, ['tier', 'tierName', 'instances', 'capacityPerInstance']), s = exact(f.sql, ['tier', 'tierName', 'readReplicas', 'reads', 'writes']);
  const at = tier(a.tier), st = tier(s.tier), ad = appTiers[at - 1], sd = databaseTiers[st - 1];
  if (a.tierName !== ad.name || a.capacityPerInstance !== ad.capacity || s.tierName !== sd.name || s.reads !== sd.reads || s.writes !== sd.writes) throw new Error('Inconsistent tier properties');
  const entries = array(r.timeline, 'timeline'); if (entries.length > 40) throw new Error('Too many actions');
  let previous = -1;
  const timeline = entries.map(entry => { const e = exact(entry, ['t', 'action']); const t = integer(e.t, 'time', 0, elapsedSeconds - 1), action = bounded(e.action, 40);
    if (t < previous || !timelineActions.some(value => value === action)) throw new Error('Invalid action'); previous = t; return { t, action }; });
  return { challengeId, rulesVersion: '0.4', durationSeconds: challenge.workload.duration,
    outcome: { status: o.status, objectiveMet, elapsedSeconds, availability: number(o.availability, 'availability', 0, 1), score: integer(o.score, 'score', 0, 10000), infrastructureCost: number(o.infrastructureCost, 'cost', 0, 1e6), emergencyCost: number(o.emergencyCost, 'emergency cost', 0, 8), netBusinessValue: number(o.netBusinessValue, 'net value', -1e9, 1e9), primaryCause, peaks: { app: number(p.app, 'app peak', 0, 1e6), sqlRead: number(p.sqlRead, 'read peak', 0, 1e6), sqlWrite: number(p.sqlWrite, 'write peak', 0, 1e6) } },
    finalArchitecture: { app: { tier: at, tierName: ad.name, instances: integer(a.instances, 'instances', 1, 4), capacityPerInstance: ad.capacity }, sql: { tier: st, tierName: sd.name, readReplicas: integer(s.readReplicas, 'replicas', 0, 2), reads: sd.reads, writes: sd.writes }, cache: presence(f.cache), protectedEdge: presence(f.protectedEdge) }, timeline };
}

const types = new Set(['Microsoft.Web/serverfarms', 'Microsoft.Web/sites', 'Microsoft.Sql/servers', 'Microsoft.Sql/servers/databases', 'Microsoft.Cache/redisEnterprise', 'Microsoft.Cache/redisEnterprise/databases', 'Microsoft.Network/applicationGateways', 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies', 'Microsoft.Network/virtualNetworks', 'Microsoft.Network/virtualNetworks/subnets', 'Microsoft.Network/publicIPAddresses']);
export function validateExportResponse(value: unknown, request: ExportRequest): ExportResponse {
  const r = exact(value, ['title', 'bicep', 'parametersJson', 'resources', 'caveats']);
  const title = bounded(r.title, 80), bicep = bounded(r.bicep, 12000), parametersJson = bounded(r.parametersJson, 12000);
  if (Buffer.byteLength(bicep) > 12000 || !/(?:targetScope|resource\s)/.test(bicep)
    || /https?:\/\/|secret|password|key\s*=|<[^>\n]+>|\b(?:module|import|extension|loadTextContent|loadJsonContent|loadFileAsBase64)\b|\b(?:list\w*|reference)\s*\(|\/\*/i.test(bicep)) throw new Error('Unsafe template');
  const declarations = [...bicep.matchAll(/^\s*resource\s+(\w+)\s+'(Microsoft\.[\w/]+)@(20(?:2[3-9]|[3-9]\d)-\d{2}-\d{2}(?:-preview)?)'\s*=/gm)];
  if (!declarations.length || declarations.length !== (bicep.match(/^\s*resource\s/gm) ?? []).length || declarations.some(m => !types.has(m[2]))) throw new Error('Invalid resource declaration');
  const withoutVersions = bicep.replace(/^\s*resource\s+\w+\s+'Microsoft\.[\w/]+@20(?:2[3-9]|[3-9]\d)-\d{2}-\d{2}(?:-preview)?'\s*=/gm, '');
  if (withoutVersions.includes('@')) throw new Error('Invalid at sign');
  const params = record(JSON.parse(parametersJson), 'parameters');
  if (Object.keys(params).some(k => !['$schema', 'contentVersion', 'parameters'].includes(k)) || params.contentVersion !== '1.0.0.0') throw new Error('Invalid parameters');
  if (params.$schema !== undefined && params.$schema !== 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#') throw new Error('Invalid schema URL');
  const declared = new Set([...bicep.matchAll(/^\s*param\s+(\w+)\s/gm)].map(m => m[1]));
  for (const [name, entry] of Object.entries(record(params.parameters, 'parameter values'))) {
    const parameter = exact(entry, ['value']);
    if (!declared.has(name) || !['location', 'namePrefix'].includes(name) || typeof parameter.value !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(parameter.value)) throw new Error('Unexpected parameter value');
  }
  for (const required of ['location', 'namePrefix', 'sqlAdminObjectId', 'sqlAdminLogin']) if (!declared.has(required)) throw new Error('Missing parameter');
  if (!/azureADOnlyAuthentication\s*:\s*true/.test(bicep)) throw new Error('Entra-only authentication required');
  const rawResources = array(r.resources, 'resources'), rawCaveats = array(r.caveats, 'caveats');
  if (rawResources.length < 2 || rawResources.length > 4 || rawCaveats.length < 1 || rawCaveats.length > 12) throw new Error('Invalid output arrays');
  const f = request.finalArchitecture;
  const requiredTypes = ['Microsoft.Web/serverfarms', 'Microsoft.Web/sites', 'Microsoft.Sql/servers', 'Microsoft.Sql/servers/databases',
    ...(f.cache.present ? ['Microsoft.Cache/redisEnterprise', 'Microsoft.Cache/redisEnterprise/databases'] : []),
    ...(f.protectedEdge.present ? ['Microsoft.Network/applicationGateways', 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies', 'Microsoft.Network/virtualNetworks', 'Microsoft.Network/publicIPAddresses'] : [])];
  if (requiredTypes.some(type => !declarations.some(m => m[2] === type))) throw new Error('Missing infrastructure');
  if (!/targetScope\s*=\s*'resourceGroup'/.test(bicep) || !/'stack-and-survive'\s*:\s*'export'/.test(bicep)
    || !bicep.includes(`challenge: '${request.challengeId}'`)) throw new Error('Missing scope or provenance tags');
  if (/param\s+sqlAdmin(?:ObjectId|Login)\s+string\s*=/.test(bicep)) throw new Error('Invented administrator default');
  const expected = new Map<string, [string, string, string]>([
    ['App', ['Azure App Service', ['S1', 'S2', 'P1v3'][f.app.tier - 1], 'Microsoft.Web/sites']],
    ['SQL', ['Azure SQL Database', ['GP_S_Gen5_2', 'GP_Gen5_4', 'BC_Gen5_4'][f.sql.tier - 1], 'Microsoft.Sql/servers/databases']],
    ...(f.cache.present ? [['Cache', ['Azure Managed Redis', 'Balanced_B1', 'Microsoft.Cache/redisEnterprise']] as [string, [string, string, string]]] : []),
    ...(f.protectedEdge.present ? [['Protected Edge', ['Azure Application Gateway', 'WAF_v2', 'Microsoft.Network/applicationGateways']] as [string, [string, string, string]]] : []),
  ]);
  const numeric = new Set<string>();
  const collect = (v: unknown) => { if (typeof v === 'number') { numeric.add(String(v)); numeric.add(String(Number((v * 100).toFixed(2)))); } else if (v && typeof v === 'object') Object.values(v).forEach(collect); };
  collect(request);
  const seen = new Set<string>();
  const resources = rawResources.map((item): ExportResponse['resources'][number] => {
    const x = exact(item, ['gameResource', 'azureService', 'bicepSymbol', 'sku', 'reason']);
    const gameResource = bounded(x.gameResource, 20);
    if (gameResource !== 'App' && gameResource !== 'SQL' && gameResource !== 'Cache' && gameResource !== 'Protected Edge') throw new Error('Unknown resource');
    const mapping = expected.get(gameResource), azureService = bounded(x.azureService, 80), sku = bounded(x.sku, 40), bicepSymbol = bounded(x.bicepSymbol, 80), reason = bounded(x.reason, 1200);
    if (!mapping || seen.has(gameResource) || mapping[0] !== azureService || mapping[1] !== sku || !declarations.some(m => m[1] === bicepSymbol && m[2] === mapping[2])) throw new Error('Incorrect mapping');
    const numbers = reason.match(/-?\d+(?:\.\d+)?/g) ?? [];
    if (!numbers.length || numbers.some(n => !numeric.has(n))) throw new Error('Unsupported numerical evidence');
    seen.add(gameResource); return { gameResource, azureService, sku, bicepSymbol, reason };
  });
  if (seen.size !== expected.size) throw new Error('Missing resources');
  if (!f.cache.present && (declarations.some(m => m[2].startsWith('Microsoft.Cache/')) || /\b(?:cache|redis)\b/i.test(JSON.stringify(r)))) throw new Error('Absent cache generated');
  if (!f.protectedEdge.present && (declarations.some(m => m[2].startsWith('Microsoft.Network/')) || /\b(?:WAF|protected edge|application gateway)\b/i.test(JSON.stringify(r)))) throw new Error('Absent edge generated');
  const caveats = rawCaveats.map(c => bounded(c, 1000));
  if (!request.outcome.objectiveMet && !caveats.some(c => /objective (?:was )?not met|objective missed/i.test(c))) throw new Error('Missing outcome caveat');
  if (f.sql.tier < 3 && f.sql.readReplicas > 0 && !caveats.some(c => /geo.replic|hyperscale/i.test(c) && /not generated/i.test(c))) throw new Error('Missing replica caveat');
  if (f.sql.tier < 3 && /readScale\s*:\s*'Enabled'/.test(bicep)) throw new Error('Invalid read scale');
  for (const [name, state] of [['Cache', f.cache], ['Protected Edge', f.protectedEdge]] as const) if (state.present && !state.active && !caveats.some(c => c.includes(name) && /provision|not active/i.test(c))) throw new Error('Missing activity caveat');
  return { title, bicep, parametersJson, resources, caveats };
}

export async function handleExportBicep(body: string, client: ExportClient): Promise<ExportResponse> {
  if (Buffer.byteLength(body) > 20_000) throw new ApiError('Request too large', 413);
  let request: ExportRequest;
  try { request = parseExportRequest(JSON.parse(body)); } catch { throw new ApiError('Invalid export request', 400); }
  let response: unknown;
  try { response = await client.createResponse({ instructions: EXPORT_INSTRUCTIONS, input: `Run data (all values are game-simulation values):\n${JSON.stringify(request, null, 2)}`, schema: exportBicepSchema, schemaName: 'architecture_export', maxOutputTokens: 2500, timeoutMs: 25_000 }); }
  catch { throw new ApiError('AI service unavailable', 502); }
  try { return validateExportResponse(response, request); } catch { throw new ApiError('AI output rejected', 502); }
}
