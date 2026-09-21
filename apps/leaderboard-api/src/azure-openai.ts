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
export type ToolInput = { instructions: string; input: unknown[]; tools: JsonSchema[]; maxOutputTokens: number; timeoutMs: number };
export type ToolCall = { type: 'function_call'; call_id: string; name: string; arguments: string };
export type ToolTurn = { calls: ToolCall[]; continuation: unknown[] };
export type AgentClient = { createToolResponse: (input: ToolInput) => Promise<ToolTurn> };

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }

async function responseBody(body: Record<string, unknown>, timeoutMs: number): Promise<Record<string, unknown>> {
  if (!azureOpenAiConfigured()) throw new ApiError('Export not configured', 503);
  try {
    const url = new URL('/openai/v1/responses', endpoint);
    if (apiVersion) url.searchParams.set('api-version', apiVersion);
    const response = await fetch(url, {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({ model: deployment, store: false, ...body }),
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
    return data;
  } catch { throw new ApiError('AI service unavailable', 502); }
}

export async function createResponse(input: ResponseInput): Promise<unknown> {
  const data = await responseBody({ instructions: input.instructions, input: input.input, max_output_tokens: input.maxOutputTokens,
    text: { format: { type: 'json_schema', name: input.schemaName, strict: true, schema: input.schema } } }, input.timeoutMs);
  try {
    const content = (data.output as unknown[]).flatMap(item => object(item) && Array.isArray(item.content) ? item.content : []);
    const output = content.find(item => object(item) && item.type === 'output_text');
    if (!object(output) || typeof output.text !== 'string') throw new Error('Missing output');
    return JSON.parse(output.text);
  } catch { throw new ApiError('AI service unavailable', 502); }
}

export async function createToolResponse(input: ToolInput): Promise<ToolTurn> {
  const data = await responseBody({ instructions: input.instructions, input: input.input, max_output_tokens: input.maxOutputTokens,
    tools: input.tools, tool_choice: 'required', parallel_tool_calls: false, include: ['reasoning.encrypted_content'] }, input.timeoutMs);
  try {
    const calls: ToolCall[] = [], continuation: unknown[] = [];
    for (const item of data.output as unknown[]) {
      if (!object(item)) throw new Error('Invalid item');
      if (item.type === 'function_call') {
        if (typeof item.call_id !== 'string' || !/^[\w-]{1,200}$/.test(item.call_id) || typeof item.name !== 'string'
          || typeof item.arguments !== 'string' || Buffer.byteLength(item.arguments) > 32_000) throw new Error('Invalid call');
        const call: ToolCall = { type: 'function_call', call_id: item.call_id, name: item.name, arguments: item.arguments };
        calls.push(call); continuation.push(call);
      } else if (item.type === 'reasoning') {
        if (typeof item.encrypted_content !== 'string' || item.encrypted_content.length > 16000) throw new Error('Missing stateless context');
        continuation.push({ type: 'reasoning', encrypted_content: item.encrypted_content, summary: [] });
      } else throw new Error('Only approved tool calls expected');
    }
    if (calls.length !== 1) throw new Error('Exactly one tool call required');
    return { calls, continuation };
  } catch { throw new ApiError('AI service unavailable', 502); }
}
