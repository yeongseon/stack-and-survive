import { createServer, type Server } from 'node:http';
import { InMemoryStorage, type LeaderboardStorage } from './storage';
import { FileStorage } from './file-storage';
import { handleGetTop, handleSubmit, ApiError } from './handler';
import { RateLimiter } from './rate-limit';
import { azureOpenAiConfigured, createResponse, createToolResponse, type ExportClient, type AgentClient } from './azure-openai';
import { handleExportBicep } from './export-bicep';
import { AgentError, handleAgentExport } from './export-agent';
import { compilerConfigured, localCompiler, type BicepCompiler } from './bicep-compiler';

export interface ServerOptions {
  port?: number;
  corsOrigins?: string[];
  trustProxy?: boolean;
  storageMode?: string;
  storagePath?: string;
  buildSha?: string;
  exportClient?: ExportClient;
  exportConfigured?: boolean;
  agentClient?: AgentClient;
  agentCompiler?: BicepCompiler;
}

export function createLeaderboardServer(options: ServerOptions = {}): {
  server: Server;
  storage: LeaderboardStorage;
  start: (callback?: () => void) => void;
  stop: () => Promise<void>;
} {
  const port = options.port ?? 3001;
  const allowedOrigins = options.corsOrigins ?? ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://yeongseon.github.io'];
  const trustProxy = options.trustProxy ?? false;
  const storageMode = options.storageMode ?? 'memory';
  const storagePath = options.storagePath ?? './data/leaderboard.json';
  const buildSha = options.buildSha ?? '';

  const storage: LeaderboardStorage = storageMode === 'file' ? new FileStorage(storagePath) : new InMemoryStorage();
  const submitLimiter = new RateLimiter(10, 60_000);
  const getLimiter = new RateLimiter(60, 60_000);
  const exportLimiter = new RateLimiter(5, 60_000);
  const aiConfigured = options.exportConfigured ?? azureOpenAiConfigured();
  const exportClient = options.exportClient ?? { createResponse };
  const agentClient = options.agentClient ?? { createToolResponse };
  const compiler = options.agentCompiler ?? localCompiler();
  let activeAgents = 0;
  let requestCount = 0;
  const startTime = Date.now();

  const cleanupInterval = setInterval(() => { submitLimiter.cleanup(); getLimiter.cleanup(); exportLimiter.cleanup(); }, 300_000);
  cleanupInterval.unref();

  function clientIp(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
    if (trustProxy) {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress ?? 'unknown';
  }

  function cors(origin: string | undefined) {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
    if (origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
  }

  const server = createServer(async (req, res) => {
    requestCount++;
    const origin = req.headers.origin;
    const corsHeaders = cors(origin);
    for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const ip = clientIp(req);

    try {
      if (url.pathname === '/api/export-bicep' || url.pathname === '/api/export-agent') {
        const agent = url.pathname === '/api/export-agent';
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' });
          res.end(JSON.stringify({ error: 'Method not allowed' })); return;
        }
        if (origin && !allowedOrigins.includes(origin)) throw new ApiError('Origin not allowed', 403);
        if (!exportLimiter.check(ip)) throw new ApiError('Too many exports. Try again in a minute.', 429);
        if (!aiConfigured) throw new ApiError('Export not configured', 503);
        if (agent && !options.agentCompiler && !await compilerConfigured()) throw new ApiError('Compiler not configured', 503);
        if (agent && activeAgents >= 2) throw new ApiError('Agent busy. Try again shortly.', 429);
        const chunks: Buffer[] = []; let size = 0;
        for await (const chunk of req) {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          size += bytes.length;
          if (size > 20_000) throw new ApiError('Request too large', 413);
          chunks.push(bytes);
        }
        const body = Buffer.concat(chunks).toString('utf8');
        let result;
        if (agent) {
          if (activeAgents >= 2) throw new ApiError('Agent busy. Try again shortly.', 429);
          activeAgents++;
          try { result = await handleAgentExport(body, agentClient, compiler); } finally { activeAgents--; }
        } else result = await handleExportBicep(body, exportClient);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result)); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
        if (!getLimiter.check(ip)) { console.warn(`Rate limited GET from ${ip}`); res.writeHead(429, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Too many requests. Try again shortly.' })); return; }
        const challengeHash = url.searchParams.get('challenge');
        if (!challengeHash) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing challenge parameter' })); return; }
        const result = await handleGetTop(storage, challengeHash);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/leaderboard') {
        if (!submitLimiter.check(ip)) { console.warn(`Rate limited POST from ${ip}`); res.writeHead(429, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Too many submissions. Try again in a minute.' })); return; }
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += (chunk as Buffer).length;
          if (size > 200_000) { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Request too large' })); return; }
          chunks.push(chunk as Buffer);
        }
        const body = Buffer.concat(chunks).toString('utf-8');
        const result = await handleSubmit(storage, body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/health') {
        const health: Record<string, unknown> = {
          status: 'ok',
          ai: aiConfigured ? 'configured' : 'off',
          agent: aiConfigured && (options.agentCompiler || await compilerConfigured()) ? 'configured' : 'off',
          storage: storageMode,
          requests: requestCount,
          uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        };
        if (buildSha) health.version = buildSha;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
        return;
      }

      if (url.pathname === '/api/leaderboard') {
        res.writeHead(405, { 'Content-Type': 'application/json', 'Allow': 'GET, POST, OPTIONS' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err) {
      if (err instanceof ApiError) {
        res.writeHead(err.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, ...(err instanceof AgentError ? { steps: err.steps } : {}) }));
      } else {
        if (url.pathname !== '/api/export-bicep' && url.pathname !== '/api/export-agent') console.error('Unexpected error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });

  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 10_000;

  return {
    server,
    storage,
    start(callback?: () => void) {
      server.listen(port, callback);
    },
    stop() {
      clearInterval(cleanupInterval);
      return new Promise<void>((resolve, reject) => {
        server.close(err => err ? reject(err) : resolve());
      });
    },
  };
}

// Bootstrap: only run when executed directly (not imported for testing)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('/server.js') ||
  process.argv[1].endsWith('/server.ts') ||
  process.argv[1].includes('dist/server')
);

if (isDirectRun) {
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,https://yeongseon.github.io').split(',').map(s => s.trim());
  const app = createLeaderboardServer({
    port: Number(process.env.PORT ?? 3001),
    corsOrigins,
    trustProxy: process.env.TRUST_PROXY === 'true',
    storageMode: process.env.LEADERBOARD_STORAGE ?? 'memory',
    storagePath: process.env.LEADERBOARD_FILE_PATH ?? './data/leaderboard.json',
    buildSha: process.env.BUILD_SHA ?? '',
  });

  function shutdown(signal: string) {
    console.log(`\n${signal} received, shutting down...`);
    app.stop().then(() => process.exit(0)).catch(() => process.exit(1));
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  app.start(() => {
    console.log(`Leaderboard API running on port ${Number(process.env.PORT ?? 3001)}`);
  });
}
