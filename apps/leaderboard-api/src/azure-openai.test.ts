import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
async function configured(version = '') {
  vi.stubEnv('AZURE_OPENAI_ENDPOINT', 'https://example.openai.azure.com'); vi.stubEnv('AZURE_OPENAI_API_KEY', 'test-only-not-a-real-key');
  vi.stubEnv('AZURE_OPENAI_DEPLOYMENT', 'test-deployment'); vi.stubEnv('AZURE_OPENAI_API_VERSION', version); vi.resetModules();
  return import('./azure-openai');
}
const request = { instructions: 'Rules', input: 'Numbers', schema: { type: 'object' }, schemaName: 'export', maxOutputTokens: 2500, timeoutMs: 25000 };
describe('Azure Responses fetch adapter', () => {
  it('uses v1, deployment name, api-key and strict text.format with stateless storage', async () => {
    const client = await configured();
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'completed', output: [{ type: 'reasoning' }, { content: [{ type: 'output_text', text: '{"ok":true}' }] }] })));
    vi.stubGlobal('fetch', fetch);
    expect(client.azureOpenAiConfigured()).toBe(true); expect(await client.createResponse(request)).toEqual({ ok: true });
    const [url, options] = fetch.mock.calls[0]; expect(String(url)).toBe('https://example.openai.azure.com/openai/v1/responses');
    expect(options.headers['api-key']).toBe('test-only-not-a-real-key'); expect(options.redirect).toBe('error');
    expect(JSON.parse(options.body)).toEqual({ model: 'test-deployment', instructions: 'Rules', input: 'Numbers', max_output_tokens: 2500, store: false, text: { format: { type: 'json_schema', name: 'export', strict: true, schema: request.schema } } });
  });
  it('passes explicit compatibility version only when configured', async () => {
    const client = await configured('2025-04-01-preview');
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{}' }] }] })));
    vi.stubGlobal('fetch', fetch); await client.createResponse(request);
    expect(String(fetch.mock.calls[0][0])).toBe('https://example.openai.azure.com/openai/v1/responses?api-version=2025-04-01-preview');
  });
  it.each([
    new Response('private upstream details', { status: 429 }),
    new Response(JSON.stringify({ status: 'incomplete', output: [] })),
    new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'No' }] }] })),
    new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{' }] }] })),
    new Response('x'.repeat(100001)),
  ])('masks non-success, refused, truncated and oversized upstream bodies', async response => {
    const client = await configured(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(client.createResponse(request)).rejects.toMatchObject({ statusCode: 502, message: 'AI service unavailable' });
  });
  it('masks timeout and avoids upstream calls when unconfigured', async () => {
    const client = await configured(); const fetch = vi.fn().mockRejectedValue(new DOMException('Timeout', 'TimeoutError')); vi.stubGlobal('fetch', fetch);
    await expect(client.createResponse(request)).rejects.toMatchObject({ statusCode: 502 });
    vi.stubEnv('AZURE_OPENAI_API_KEY', ''); vi.resetModules(); const off = await import('./azure-openai');
    expect(off.azureOpenAiConfigured()).toBe(false); fetch.mockClear();
    await expect(off.createResponse(request)).rejects.toMatchObject({ statusCode: 503 }); expect(fetch).not.toHaveBeenCalled();
  });
});
