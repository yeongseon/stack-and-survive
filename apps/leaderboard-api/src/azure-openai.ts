import { ApiError } from './handler';
import type { JsonSchema } from './export-bicep-schema';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim() ?? '';
const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim() ?? '';
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim() ?? '';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim() ?? '';
const validEndpoint = (() => {
  try { const url = new URL(endpoint); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && /^\/?$/.test(url.pathname); }
  catch { return false; }
})();
export const azureOpenAiConfigured = () => validEndpoint && !!apiKey && !!deployment;
export type ResponseInput = { instructions: string; input: string; schema: JsonSchema; schemaName: string; maxOutputTokens: number; timeoutMs: number };
export type ExportClient = { createResponse: (input: ResponseInput) => Promise<unknown> };

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }

export async function createResponse(input: ResponseInput): Promise<unknown> {
  if (!azureOpenAiConfigured()) throw new ApiError('Export not configured', 503);
  try {
    const url = new URL('/openai/v1/responses', endpoint);
    if (apiVersion) url.searchParams.set('api-version', apiVersion);
    const response = await fetch(url, {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      signal: AbortSignal.timeout(input.timeoutMs),
      body: JSON.stringify({ model: deployment, instructions: input.instructions, input: input.input,
        max_output_tokens: input.maxOutputTokens, store: false,
        text: { format: { type: 'json_schema', name: input.schemaName, strict: true, schema: input.schema } } }),
    });
    if (!response.ok || !response.body) throw new Error('Upstream unavailable');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 100_000) { await reader.cancel(); throw new Error('Upstream response too large'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!object(data) || data.status !== 'completed' || data.error || !Array.isArray(data.output)) throw new Error('Incomplete response');
    const content = data.output.flatMap(item => object(item) && Array.isArray(item.content) ? item.content : []);
    if (content.some(item => object(item) && item.type === 'refusal')) throw new Error('Refused');
    const output = content.find(item => object(item) && item.type === 'output_text');
    if (!object(output) || typeof output.text !== 'string') throw new Error('Missing output');
    return JSON.parse(output.text);
  } catch { throw new ApiError('AI service unavailable', 502); }
}
