#!/usr/bin/env node
/**
 * Operational smoke test for the leaderboard API.
 *
 * Usage:
 *   LEADERBOARD_API=http://localhost:3001 node scripts/smoke-leaderboard.mjs
 *
 * Options (env vars):
 *   SMOKE_MUTATE=true          Submit a test run (writes to the leaderboard)
 *   SMOKE_ORIGIN=<origin>      Verify CORS allows this origin
 *   SMOKE_REJECT_ORIGIN=<origin>  Verify CORS rejects this origin
 */

const API = process.env.LEADERBOARD_API ?? 'http://localhost:3001';
const MUTATE = process.env.SMOKE_MUTATE === 'true';
const SMOKE_ORIGIN = process.env.SMOKE_ORIGIN || '';
const SMOKE_REJECT_ORIGIN = process.env.SMOKE_REJECT_ORIGIN || '';
let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  \u2713 ${message}`); }
  else { failed++; console.error(`  \u2717 ${message}`); }
}

async function main() {
  console.log(`Smoke testing: ${API}`);
  console.log(`Mutation: ${MUTATE ? 'ENABLED' : 'disabled (set SMOKE_MUTATE=true to submit)'}`);
  if (SMOKE_ORIGIN) console.log(`CORS allowed origin: ${SMOKE_ORIGIN}`);
  if (SMOKE_REJECT_ORIGIN) console.log(`CORS rejected origin: ${SMOKE_REJECT_ORIGIN}`);
  console.log();

  // 1. Health
  console.log('1. Health endpoint');
  try {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    assert(res.ok, `GET /api/health -> ${res.status}`);
    assert(data.status === 'ok', `status: ${data.status}`);
    assert(typeof data.storage === 'string', `storage: ${data.storage}`);
    assert(typeof data.uptimeSeconds === 'number', `uptime: ${data.uptimeSeconds}s`);
  } catch (e) { assert(false, `Health failed: ${e.message}`); }

  // 2. GET Top 10 (may be empty)
  console.log('\n2. GET leaderboard');
  const { blackFridayChallenge } = await import('../packages/scenarios/src/challenge.ts');
  const challengeHash = blackFridayChallenge.contentHash;
  try {
    const res = await fetch(`${API}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
    const data = await res.json();
    assert(res.ok, `GET /api/leaderboard -> ${res.status}`);
    assert(data.available === true, 'available: true');
    assert(Array.isArray(data.entries), `entries: ${data.entries.length} entries`);
  } catch (e) { assert(false, `GET failed: ${e.message}`); }

  // 3. GET with missing challenge param
  console.log('\n3. Missing challenge parameter');
  try {
    const res = await fetch(`${API}/api/leaderboard`);
    assert(res.status === 400, `Missing param -> ${res.status}`);
  } catch (e) { assert(false, `Request failed: ${e.message}`); }

  let stepNum = 4;

  // CORS verification (P0-3)
  if (SMOKE_ORIGIN) {
    console.log(`\n${stepNum}. CORS allowed origin: ${SMOKE_ORIGIN}`);
    try {
      const res = await fetch(`${API}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`, {
        headers: { 'Origin': SMOKE_ORIGIN },
      });
      const acao = res.headers.get('access-control-allow-origin');
      assert(acao === SMOKE_ORIGIN, `Access-Control-Allow-Origin: ${acao}`);
    } catch (e) { assert(false, `CORS GET failed: ${e.message}`); }

    stepNum++;
    console.log(`\n${stepNum}. CORS preflight for ${SMOKE_ORIGIN}`);
    try {
      const res = await fetch(`${API}/api/leaderboard`, {
        method: 'OPTIONS',
        headers: {
          'Origin': SMOKE_ORIGIN,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      assert(res.status === 204, `OPTIONS -> ${res.status}`);
      const acao = res.headers.get('access-control-allow-origin');
      assert(acao === SMOKE_ORIGIN, `Allow-Origin: ${acao}`);
      const methods = res.headers.get('access-control-allow-methods') || '';
      assert(methods.includes('POST'), `Allow-Methods includes POST: ${methods}`);
      const headers = res.headers.get('access-control-allow-headers') || '';
      assert(headers.toLowerCase().includes('content-type'), `Allow-Headers includes Content-Type: ${headers}`);
    } catch (e) { assert(false, `CORS preflight failed: ${e.message}`); }
    stepNum++;
  }

  if (SMOKE_REJECT_ORIGIN) {
    console.log(`\n${stepNum}. CORS rejected origin: ${SMOKE_REJECT_ORIGIN}`);
    try {
      const res = await fetch(`${API}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`, {
        headers: { 'Origin': SMOKE_REJECT_ORIGIN },
      });
      const acao = res.headers.get('access-control-allow-origin');
      assert(!acao, `No Access-Control-Allow-Origin for rejected origin (got: ${acao ?? 'none'})`);
    } catch (e) { assert(false, `CORS reject test failed: ${e.message}`); }
    stepNum++;
  }

  // Deterministic qualifying fixture: Cache+Scale strategy
  // Expected: COMPLETED, 180s, availability 100%, score 8500
  const qualifyingActions = [
    { type: 'SCALE_OUT', time: 16, sequence: 0 },
    { type: 'DEPLOY_RESOURCE', kind: 'cache', time: 17, sequence: 1, x: 190, y: -100 },
    { type: 'SCALE_OUT', time: 57, sequence: 2 },
    { type: 'SCALE_OUT', time: 102, sequence: 3 },
  ];
  const EXPECTED_SCORE = 8500;

  if (MUTATE) {
    console.log(`\n${stepNum}. Submit qualifying run (deterministic Cache+Scale fixture)`);
    const clientRunId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const submission = {
      nickname: 'SmokeTest',
      clientRunId,
      challengeContentHash: challengeHash,
      actions: qualifyingActions,
    };
    let firstScore;
    try {
      const res = await fetch(`${API}/api/leaderboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      const data = await res.json();
      assert(res.status === 200, `POST -> ${res.status}`);
      assert(data.accepted === true, `accepted: ${data.accepted}`);
      assert(data.rankContext?.score === EXPECTED_SCORE, `score: ${data.rankContext?.score} (expected ${EXPECTED_SCORE})`);
      assert(data.rankContext?.availability >= 0.99, `availability: ${data.rankContext?.availability}`);
      assert(data.rankContext?.rank >= 1, `rank: ${data.rankContext?.rank}`);
      assert(Array.isArray(data.top), `top: ${data.top?.length} entries`);
      firstScore = data.rankContext?.score;
    } catch (e) { assert(false, `Submit failed: ${e.message}`); }
    stepNum++;

    console.log(`\n${stepNum}. Idempotent retry (same clientRunId)`);
    try {
      const res = await fetch(`${API}/api/leaderboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      const retryData = await res.json();
      assert(res.status === 200, `Retry -> ${res.status} (idempotent)`);
      assert(retryData.accepted === true, 'Retry accepted: true');
      assert(retryData.rankContext?.score === firstScore, `Retry same score: ${retryData.rankContext?.score}`);
    } catch (e) { assert(false, `Retry test failed: ${e.message}`); }
    stepNum++;

    console.log(`\n${stepNum}. Verify single entry (no duplicate)`);
    try {
      const res = await fetch(`${API}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
      const data = await res.json();
      const matches = data.entries.filter(e => e.nickname === 'SmokeTest');
      assert(matches.length >= 1, `SmokeTest entry found in GET`);
      // Idempotent retry should not create a duplicate
      const dupes = data.entries.filter(e => e.nickname === 'SmokeTest' && e.score === EXPECTED_SCORE);
      assert(dupes.length === 1 || matches.length === 1, 'No duplicate entry from retry');
    } catch (e) { assert(false, `Verify failed: ${e.message}`); }
    stepNum++;
  }

  // Invalid submission
  console.log(`\n${stepNum}. Invalid submission`);
  try {
    const res = await fetch(`${API}/api/leaderboard`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'X', clientRunId: 'bad', challengeContentHash: 'fake', actions: [] }),
    });
    assert(res.status === 400, `Invalid -> ${res.status}`);
  } catch (e) { assert(false, `Invalid test failed: ${e.message}`); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
