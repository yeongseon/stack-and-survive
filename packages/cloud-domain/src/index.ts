import { array, integer, number, record, text, type Architecture, type Kind, type Resource } from '@stack-and-survive/schema';

export const definitions: Record<Kind, { name: string; cost: number; provisioning: number }> = {
  internet: { name: 'Internet', cost: 0, provisioning: 0 },
  compute: { name: 'Azure App Service', cost: 5, provisioning: 5 },
  database: { name: 'Azure SQL', cost: 12, provisioning: 6 },
  cache: { name: 'Azure Managed Redis', cost: 8, provisioning: 5 },
  edge: { name: 'Protected Edge / WAF', cost: 3, provisioning: 4 },
};
const allowed = new Set(['internet:compute', 'internet:edge', 'edge:compute', 'compute:database', 'compute:cache', 'cache:database']);
export function parseArchitecture(input: unknown): Architecture {
  const raw = record(input, 'architecture');
  if (raw.version !== 1) throw new Error('Unsupported architecture version');
  const resources = array(raw.resources, 'resources').map((item): Resource => {
    const r = record(item, 'resource'); const kind = text(r.kind, 'kind');
    if (!Object.prototype.hasOwnProperty.call(definitions, kind)) throw new Error(`Unsupported resource ${kind}`);
    const instances = integer(r.instances, 'instances', 1, kind === 'compute' ? 4 : 1);
    return { id: text(r.id, 'id'), kind: kind as Kind, instances,
      x: number(r.x, 'x', -10000, 10000), y: number(r.y, 'y', -10000, 10000), remaining: integer(r.remaining, 'remaining', 0, 8) };
  });
  if (new Set(resources.map(r => r.id)).size !== resources.length) throw new Error('Duplicate resource IDs');
  const connections = array(raw.connections, 'connections').map(item => {
    const c = record(item, 'connection'); return { from: text(c.from, 'from'), to: text(c.to, 'to') };
  }).filter((c, i, all) => all.findIndex(a => a.from === c.from && a.to === c.to) === i);
  for (const c of connections) {
    const from = resources.find(r => r.id === c.from); const to = resources.find(r => r.id === c.to);
    if (!from || !to || !allowed.has(`${from.kind}:${to.kind}`)) throw new Error('Invalid connection direction or endpoint');
  }
  for (const kind of Object.keys(definitions) as Kind[]) {
    const count = resources.filter(r => r.kind === kind).length;
    if (count > 1) throw new Error(`Only one logical ${kind} resource is allowed`);
  }
  return { version: 1, resources, connections };
}
export function validateStart(architecture: Architecture): string[] {
  let a: Architecture;
  try { a = parseArchitecture(architecture); } catch (e) { return [e instanceof Error ? e.message : 'Invalid architecture']; }
  const errors: string[] = [];
  const get = (kind: Kind) => a.resources.find(r => r.kind === kind);
  const has = (from: Kind, to: Kind) => a.connections.some(c => c.from === get(from)?.id && c.to === get(to)?.id);
  for (const kind of ['internet', 'compute', 'database'] as Kind[]) if (!get(kind)) errors.push(`Missing required ${definitions[kind].name}`);
  const direct = has('internet', 'compute'); const protectedPath = has('internet', 'edge') && has('edge', 'compute');
  if (Number(direct) + Number(protectedPath) !== 1) errors.push('Exactly one complete Internet to App ingress path is required');
  if (!has('compute', 'database')) errors.push('Direct App to SQL write connection is required');
  for (const kind of ['edge', 'cache'] as Kind[]) {
    const r = get(kind); if (!r) continue;
    const incident = a.connections.filter(c => c.from === r.id || c.to === r.id).length;
    const complete = kind === 'edge' ? protectedPath : has('compute', 'cache') && has('cache', 'database');
    if (incident > 0 && !complete) errors.push(`Incomplete ${definitions[kind].name} path`);
  }
  for (const r of a.resources) {
    const required = ['internet', 'compute', 'database'].includes(r.kind) || a.connections.some(c => c.from === r.id || c.to === r.id);
    if (required && r.remaining > 0) errors.push(`${definitions[r.kind].name} is provisioning`);
  }
  return errors;
}
export function baseline(instances = 1, cache = false, edge = false): Architecture {
  const kinds: Kind[] = ['internet', 'compute', 'database', ...(cache ? ['cache' as const] : []), ...(edge ? ['edge' as const] : [])];
  return { version: 1, resources: kinds.map((kind, i) => ({ id: kind, kind, x: i * 160, y: i % 2 * 80, instances: kind === 'compute' ? instances : 1, remaining: 0 })),
    connections: [...(edge ? [{ from: 'internet', to: 'edge' }, { from: 'edge', to: 'compute' }] : [{ from: 'internet', to: 'compute' }]), { from: 'compute', to: 'database' }, ...(cache ? [{ from: 'compute', to: 'cache' }, { from: 'cache', to: 'database' }] : [])] };
}
