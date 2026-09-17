import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createLeaderboardServer } from './server';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';
import type { Action } from '@stack-and-survive/simulation/runtime';

const challengeHash = blackFridayChallenge.contentHash;

const qualifyingActions: Action[] = [
  { type: 'SCALE_OUT', time: 16, sequence: 0 },
  { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
  { type: 'SCALE_OUT', time: 57, sequence: 2 },
  { type: 'SCALE_OUT', time: 102, sequence: 3 },
];

let baseUrl: string;
let app: ReturnType<typeof createLeaderboardServer>;

beforeAll(async () => {
  app = createLeaderboardServer({
    port: 0, // random available port
    corsOrigins: ['https://yeongseon.github.io', 'https://test.example'],
    buildSha: 'test-abc123',
  });
  await new Promise<void>(resolve => {
    app.server.listen(0, () => {
      const addr = app.server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await app.stop();
});

let runCounter = 0;
function nextRunId() { return `http-test-${++runCounter}-${Date.now()}`; }

describe('Health', () => {
  it('GET /api/health returns 200', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.storage).toBe('memory');
    expect(typeof data.uptimeSeconds).toBe('number');
    expect(data.version).toBe('test-abc123');
  });
});

describe('GET /api/leaderboard', () => {
  it('known challenge returns 200', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.available).toBe(true);
    expect(Array.isArray(data.entries)).toBe(true);
  });

  it('missing challenge returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Missing');
  });

  it('unknown challenge returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard?challenge=unknown-hash`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Unsupported');
  });
});

describe('POST /api/leaderboard', () => {
  it('valid qualifying request returns 200', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'HttpTest',
        clientRunId: nextRunId(),
        challengeContentHash: challengeHash,
        actions: qualifyingActions,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accepted).toBe(true);
    expect(data.rankContext.score).toBe(8500);
  });

  it('invalid JSON returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    });
    expect(res.status).toBe(400);
  });

  it('bad action returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'BadAction',
        clientRunId: nextRunId(),
        challengeContentHash: challengeHash,
        actions: [{ type: 'HACK', time: 0, sequence: 0 }],
      }),
    });
    expect(res.status).toBe(400);
  });

  it('objective miss returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'NoActions',
        clientRunId: nextRunId(),
        challengeContentHash: challengeHash,
        actions: [],
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Objective not met');
  });

  it('oversized request returns 413', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'x'.repeat(200_001),
    });
    expect(res.status).toBe(413);
  });
});

describe('Methods', () => {
  it('PUT /api/leaderboard returns 405', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, { method: 'PUT' });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toContain('GET');
  });

  it('DELETE /api/leaderboard returns 405', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, { method: 'DELETE' });
    expect(res.status).toBe(405);
  });

  it('unknown route returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    expect(res.status).toBe(404);
  });
});

describe('CORS', () => {
  it('allowed origin gets Access-Control-Allow-Origin', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { 'Origin': 'https://yeongseon.github.io' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('https://yeongseon.github.io');
  });

  it('second allowed origin also works', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { 'Origin': 'https://test.example' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('https://test.example');
  });

  it('rejected origin does not get Access-Control-Allow-Origin', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { 'Origin': 'https://example.invalid' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('OPTIONS preflight returns 204 with correct headers', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://yeongseon.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://yeongseon.github.io');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    expect(res.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('content-type');
  });
});

describe('Rate limiting', () => {
  it('POST rate limit returns 429 after threshold', async () => {
    // Create a server with low POST limit (the default is 10/min, but we use the shared server)
    const rlApp = createLeaderboardServer({
      port: 0,
      corsOrigins: ['https://test.example'],
    });
    // The submit limiter is 10/min. We need a separate server to avoid polluting the main one.
    await new Promise<void>(resolve => { rlApp.server.listen(0, resolve); });
    const addr = rlApp.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const url = `http://127.0.0.1:${port}`;

    try {
      // Send 10 POST requests (all will be processed, may return 400 for bad data but consume rate limit)
      for (let i = 0; i < 10; i++) {
        await fetch(`${url}/api/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: 'RL', clientRunId: `rl-test-run-${i}`, challengeContentHash: 'bad', actions: [] }),
        });
      }
      // 11th should be rate limited
      const res = await fetch(`${url}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain('Too many');
    } finally {
      await rlApp.stop();
    }
  });

  it('GET rate limit returns 429 after threshold', async () => {
    const rlApp = createLeaderboardServer({
      port: 0,
      corsOrigins: ['https://test.example'],
    });
    await new Promise<void>(resolve => { rlApp.server.listen(0, resolve); });
    const addr = rlApp.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const url = `http://127.0.0.1:${port}`;

    try {
      // Send 60 GET requests
      for (let i = 0; i < 60; i++) {
        await fetch(`${url}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
      }
      // 61st should be rate limited
      const res = await fetch(`${url}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain('Too many');
    } finally {
      await rlApp.stop();
    }
  });

  it('rate limit response is safe (no internal details)', async () => {
    const rlApp = createLeaderboardServer({
      port: 0,
      corsOrigins: ['https://test.example'],
    });
    await new Promise<void>(resolve => { rlApp.server.listen(0, resolve); });
    const addr = rlApp.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const url = `http://127.0.0.1:${port}`;

    try {
      for (let i = 0; i < 10; i++) {
        await fetch(`${url}/api/leaderboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      }
      const res = await fetch(`${url}/api/leaderboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      expect(res.status).toBe(429);
      const text = await res.text();
      expect(text).not.toContain('127.0.0.1');
      expect(text).not.toContain('limiter');
    } finally {
      await rlApp.stop();
    }
  });
});

describe('TRUST_PROXY / X-Forwarded-For', () => {
  it('uses X-Forwarded-For first value when trustProxy is true', async () => {
    const proxyApp = createLeaderboardServer({
      port: 0,
      corsOrigins: ['https://test.example'],
      trustProxy: true,
    });
    await new Promise<void>(resolve => { proxyApp.server.listen(0, resolve); });
    const addr = proxyApp.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const url = `http://127.0.0.1:${port}`;

    try {
      // Exhaust POST rate limit for a forwarded IP
      for (let i = 0; i < 10; i++) {
        await fetch(`${url}/api/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.1, 192.168.1.1' },
          body: '{}',
        });
      }
      // 11th from same forwarded IP should be rate limited
      const limited = await fetch(`${url}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.1' },
        body: '{}',
      });
      expect(limited.status).toBe(429);

      // Different forwarded IP should still work
      const other = await fetch(`${url}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.2' },
        body: '{}',
      });
      expect(other.status).not.toBe(429);
    } finally {
      await proxyApp.stop();
    }
  });

  it('ignores X-Forwarded-For when trustProxy is false', async () => {
    const noProxyApp = createLeaderboardServer({
      port: 0,
      corsOrigins: ['https://test.example'],
      trustProxy: false,
    });
    await new Promise<void>(resolve => { noProxyApp.server.listen(0, resolve); });
    const addr = noProxyApp.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const url = `http://127.0.0.1:${port}`;

    try {
      // Even with different X-Forwarded-For, all requests come from same socket IP
      for (let i = 0; i < 10; i++) {
        await fetch(`${url}/api/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.0.0.${i}` },
          body: '{}',
        });
      }
      // Should be rate limited based on socket IP, not forwarded header
      const limited = await fetch(`${url}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.99' },
        body: '{}',
      });
      expect(limited.status).toBe(429);
    } finally {
      await noProxyApp.stop();
    }
  });
});

describe('Internal failure', () => {
  it('storage failure returns safe 500', async () => {
    // Create a server with a broken storage
    const brokenApp = createLeaderboardServer({
      port: 0,
      corsOrigins: ['https://test.example'],
    });
    // Sabotage storage to throw
    const origGetTop = brokenApp.storage.getTop.bind(brokenApp.storage);
    brokenApp.storage.getTop = async () => { throw new Error('disk on fire'); };

    await new Promise<void>(resolve => {
      brokenApp.server.listen(0, resolve);
    });
    const addr = brokenApp.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Internal server error');
      // Must NOT leak internal details
      expect(JSON.stringify(data)).not.toContain('disk on fire');
    } finally {
      brokenApp.storage.getTop = origGetTop;
      await brokenApp.stop();
    }
  });
});
