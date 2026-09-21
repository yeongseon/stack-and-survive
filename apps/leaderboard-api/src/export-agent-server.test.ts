import { expect, it, vi } from 'vitest';
import { createLeaderboardServer } from './server';
import { exportRequestFixture as request, exportResponseFixture as response } from './export-bicep.fixture';
import type { AgentClient, ToolCall } from './azure-openai';

async function serve(configured = true, client?: AgentClient) {
  let sequence = 0;
  const createToolResponse = vi.fn(async () => {
    const call: ToolCall = { type: 'function_call', name: 'validate_export', arguments: JSON.stringify({ candidate: { ...response, bicep: `${response.bicep}\n// candidate ${sequence}` } }), call_id: `call_${++sequence}` };
    return { calls: [call], continuation: [call] };
  });
  const compile = vi.fn(async () => ({ ok: false as const, diagnostics: ['Error BCP018 at line 1, column 1'] }));
  const app = createLeaderboardServer({ exportConfigured: configured, corsOrigins: ['https://allowed.invalid'], agentClient: client ?? { createToolResponse }, agentCompiler: { compile } });
  await new Promise<void>(resolve => app.server.listen(0, resolve));
  const address = app.server.address(); if (!address || typeof address === 'string') throw new Error('Missing port');
  return { app, url: `http://127.0.0.1:${address.port}/api/export-agent`, createToolResponse, compile };
}
it('agent route is off without AI configuration and rejects methods/origins before model calls', async () => {
  const { app, url, createToolResponse } = await serve(false);
  try {
    expect((await fetch(url, { method: 'POST', body: '{}' })).status).toBe(503);
    expect((await fetch(url)).status).toBe(405);
    expect((await fetch(url, { method: 'OPTIONS', headers: { Origin: 'https://allowed.invalid' } })).status).toBe(204);
    expect((await fetch(url, { method: 'POST', headers: { Origin: 'https://denied.invalid' }, body: '{}' })).status).toBe(403);
    expect(createToolResponse).not.toHaveBeenCalled();
  } finally { await app.stop(); }
});
it('agent route preserves only actual failed tool trace and exposes no template on failure', async () => {
  const { app, url, compile } = await serve();
  try {
    const result = await fetch(url, { method: 'POST', headers: { Origin: 'https://allowed.invalid' }, body: JSON.stringify(request) });
    expect(result.status).toBe(502); expect(result.headers.get('access-control-allow-origin')).toBe('https://allowed.invalid');
    expect(result.headers.get('cache-control')).toBe('no-store');
    const body = await result.json(); expect(body.error).toBe('Agent verification limit reached'); expect(body.export).toBeUndefined();
    expect(body.steps).toContainEqual({ tool: 'compile', status: 'failed', attempt: 2 }); expect(compile).toHaveBeenCalledTimes(2);
    expect((await app.storage.getTop('anything', 10))).toEqual([]);
  } finally { await app.stop(); }
});
it('agent route shares the export quota and enforces body and input limits', async () => {
  const { app, url, createToolResponse } = await serve();
  try {
    expect((await fetch(url, { method: 'POST', body: 'x'.repeat(20001) })).status).toBe(413);
    for (let i = 0; i < 4; i++) expect((await fetch(url, { method: 'POST', body: '{}' })).status).toBe(400);
    expect((await fetch(url, { method: 'POST', body: '{}' })).status).toBe(429);
    expect(createToolResponse).not.toHaveBeenCalled();
  } finally { await app.stop(); }
});
it('caps concurrent agents and releases the slot after failure', async () => {
  const releases: (() => void)[] = [];
  const client: AgentClient = { createToolResponse: () => new Promise((_, reject) => releases.push(() => reject(new Error('offline')))) };
  const { app, url } = await serve(true, client);
  const post = () => fetch(url, { method: 'POST', body: JSON.stringify(request) });
  try {
    const first = post(), second = post();
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    expect((await post()).status).toBe(429);
    releases.splice(0).forEach(release => release());
    expect((await first).status).toBe(502); expect((await second).status).toBe(502);
    const third = post(); await vi.waitFor(() => expect(releases).toHaveLength(1)); releases[0]();
    expect((await third).status).toBe(502);
  } finally { releases.forEach(release => release()); await app.stop(); }
});
