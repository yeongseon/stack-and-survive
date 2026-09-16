#!/usr/bin/env node
/**
 * Operational smoke test for the leaderboard API.
 * Usage: LEADERBOARD_API=http://localhost:3001 node scripts/smoke-leaderboard.mjs
 * Set SMOKE_MUTATE=true to submit a test run (writes to the leaderboard).
 */

const API = process.env.LEADERBOARD_API ?? 'http://localhost:3001';
const MUTATE = process.env.SMOKE_MUTATE === 'true';
let passed = 0, failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

async function main() {
  console.log(`Smoke testing: ${API}`);
  console.log(`Mutation: ${MUTATE ? 'ENABLED' : 'disabled (set SMOKE_MUTATE=true to submit)'}\n`);

  // 1. Health
  console.log('1. Health endpoint');
  try {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    assert(res.ok, `GET /api/health → ${res.status}`);
    assert(data.status === 'ok', `status: ${data.status}`);
    assert(typeof data.storage === 'string', `storage: ${data.storage}`);
    assert(typeof data.uptimeSeconds === 'number', `uptime: ${data.uptimeSeconds}s`);
  } catch (e) { assert(false, `Health failed: ${e.message}`); }

  // 2. GET Top 10 (may be empty)
  console.log('\n2. GET leaderboard');
  // Use a known challenge hash from the game
  const { blackFridayChallenge } = await import('../packages/scenarios/src/challenge.ts');
  const challengeHash = blackFridayChallenge.contentHash;
  try {
    const res = await fetch(`${API}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
    const data = await res.json();
    assert(res.ok, `GET /api/leaderboard → ${res.status}`);
    assert(data.available === true, 'available: true');
    assert(Array.isArray(data.entries), `entries: ${data.entries.length} entries`);
  } catch (e) { assert(false, `GET failed: ${e.message}`); }

  // 3. GET with missing challenge param
  console.log('\n3. Missing challenge parameter');
  try {
    const res = await fetch(`${API}/api/leaderboard`);
    assert(res.status === 400, `Missing param → ${res.status}`);
  } catch (e) { assert(false, `Request failed: ${e.message}`); }

  if (MUTATE) {
    // 4. Submit a valid run
    console.log('\n4. Submit qualifying run');
    const clientRunId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const submission = {
      nickname: 'SmokeTest',
      clientRunId,
      challengeContentHash: challengeHash,
      actions: [
        { type: 'SCALE_OUT', time: 5, sequence: 0 },
        { type: 'SCALE_OUT', time: 15, sequence: 1 },
      ],
    };
    try {
      const res = await fetch(`${API}/api/leaderboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      const data = await res.json();
      if (res.ok) {
        assert(true, `POST accepted → rank #${data.rankContext?.rank}`);
        assert(data.rankContext?.score > 0, `score: ${data.rankContext?.score}`);
        assert(Array.isArray(data.top), `top: ${data.top?.length} entries`);
      } else {
        // May fail if objective not met with these actions
        assert(false, `POST rejected: ${data.error}`);
      }
    } catch (e) { assert(false, `Submit failed: ${e.message}`); }

    // 5. Duplicate submission
    console.log('\n5. Duplicate rejection');
    try {
      const res = await fetch(`${API}/api/leaderboard`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      assert(res.status === 409, `Duplicate → ${res.status}`);
    } catch (e) { assert(false, `Duplicate test failed: ${e.message}`); }

    // 6. Verify entry in GET
    console.log('\n6. Verify entry persisted');
    try {
      const res = await fetch(`${API}/api/leaderboard?challenge=${encodeURIComponent(challengeHash)}`);
      const data = await res.json();
      const found = data.entries.some(e => e.nickname === 'SmokeTest');
      assert(found, 'SmokeTest entry found in GET');
    } catch (e) { assert(false, `Verify failed: ${e.message}`); }
  }

  // 7. Invalid submission
  console.log(`\n${MUTATE ? '7' : '4'}. Invalid submission`);
  try {
    const res = await fetch(`${API}/api/leaderboard`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'X', clientRunId: 'bad', challengeContentHash: 'fake', actions: [] }),
    });
    assert(res.status === 400, `Invalid → ${res.status}`);
  } catch (e) { assert(false, `Invalid test failed: ${e.message}`); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
