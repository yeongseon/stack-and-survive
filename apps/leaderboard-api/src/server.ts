import { createServer } from 'node:http';
import { InMemoryStorage, type LeaderboardStorage } from './storage';
import { FileStorage } from './file-storage';
import { handleGetTop, handleSubmit, ApiError } from './handler';
import { RateLimiter } from './rate-limit';

const PORT = Number(process.env.PORT ?? 3001);
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,https://yeongseon.github.io').split(',').map(s => s.trim());
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const STORAGE_MODE = process.env.LEADERBOARD_STORAGE ?? 'memory';
const STORAGE_PATH = process.env.LEADERBOARD_FILE_PATH ?? './data/leaderboard.json';

function createStorage(): LeaderboardStorage {
  if (STORAGE_MODE === 'file') return new FileStorage(STORAGE_PATH);
  return new InMemoryStorage();
}
const storage = createStorage();
const submitLimiter = new RateLimiter(10, 60_000);
const getLimiter = new RateLimiter(60, 60_000);
let requestCount = 0;
const startTime = Date.now();

setInterval(() => { submitLimiter.cleanup(); getLimiter.cleanup(); }, 300_000).unref();

function clientIp(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
  if (TRUST_PROXY) {
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
  if (origin && ALLOWED_ORIGINS.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
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
    if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
      if (!getLimiter.check(ip)) { res.writeHead(429, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Too many requests. Try again shortly.' })); return; }
      const challengeHash = url.searchParams.get('challenge');
      if (!challengeHash) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Missing challenge parameter' })); return; }
      const result = await handleGetTop(storage, challengeHash);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/leaderboard') {
      if (!submitLimiter.check(ip)) { res.writeHead(429, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Too many submissions. Try again in a minute.' })); return; }
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', storage: STORAGE_MODE, requests: requestCount, uptimeSeconds: Math.floor((Date.now() - startTime) / 1000) }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    if (err instanceof ApiError) {
      res.writeHead(err.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    } else {
      const message = err instanceof Error ? err.message : 'Internal error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
  }
});

server.listen(PORT, () => { console.log(`Leaderboard API running on port ${PORT}`); });
