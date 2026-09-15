export type Kind = 'internet' | 'compute' | 'database' | 'cache' | 'edge';
export type Resource = { id: string; kind: Kind; x: number; y: number; instances: number; remaining: number };
export type Connection = { from: string; to: string };
export type Architecture = { version: 1; resources: Resource[]; connections: Connection[] };
export type Phase = Readonly<{ start: number; end: number; rps: number; botRatio: number }>;
export type Scenario = Readonly<{
  schemaVersion: 1; balanceVersion: '0.2' | '0.3'; id: string; duration: number; budget: number;
  businessMix: Readonly<{ browse: number; order: number }>; traffic: readonly Phase[];
  targets: Readonly<{ availability: number; latencyMs: number; netBusinessValue: number }>;
}>;

export function record(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${label}: expected an object`);
  return input as Record<string, unknown>;
}
export function number(input: unknown, label: string, min = 0, max = Infinity): number {
  if (typeof input !== 'number' || !Number.isFinite(input) || input < min || input > max) throw new Error(`${label}: invalid finite number`);
  return input;
}
export function integer(input: unknown, label: string, min = 0, max = Infinity): number {
  const value = number(input, label, min, max);
  if (!Number.isInteger(value)) throw new Error(`${label}: expected an integer`);
  return value;
}
export function text(input: unknown, label: string): string {
  if (typeof input !== 'string' || !input.trim()) throw new Error(`${label}: expected nonempty text`);
  return input;
}
export function array(input: unknown, label: string): unknown[] {
  if (!Array.isArray(input)) throw new Error(`${label}: expected an array`);
  return input;
}
