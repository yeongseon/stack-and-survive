import { afterEach, expect, it, vi } from 'vitest';
import { blackFridayChallenge } from '@stack-and-survive/scenarios/challenge';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });
async function client() {
  vi.stubEnv('VITE_LEADERBOARD_API', 'https://example.invalid');
  return import('./global-leaderboard');
}
const entry = { rank: 1, nickname: 'PLAYER', score: 9000, availability: .99, submittedAt: 1 };
const top = { challengeHash: blackFridayChallenge.contentHash, available: true, entries: [entry] };
const submitted = { accepted: true, top: [entry], rankContext: { rank: 1, totalEntries: 1, score: 9000, availability: .99, nextRank: null, pointsToNextRank: null, tieBreakReason: null } };
function response(body: unknown, status = 200) { vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))); }

it('accepts valid and empty challenge-scoped boards and verified submission results', async () => {
  const api = await client();
  response(top); expect(await api.fetchGlobalTop(blackFridayChallenge)).toEqual([entry]);
  response({ ...top, entries: [] }); expect(await api.fetchGlobalTop(blackFridayChallenge)).toEqual([]);
  response(submitted); expect(await api.submitToGlobal('PLAYER', blackFridayChallenge, [], 'run')).toEqual(submitted);
});

it.each([null, {}, { ...top, entries: {} }, { ...top, available: false }, { ...top, challengeHash: 'wrong' },
  { ...top, entries: [null] }, { ...top, entries: [{ ...entry, score: '9000' }] },
  { ...top, entries: [{ ...entry, availability: 2 }] }, { ...top, entries: [{ ...entry, nickname: {} }] }])('rejects invalid board response %# without exposing it to UI', async body => {
  const api = await client(); response(body); expect(await api.fetchGlobalTop(blackFridayChallenge)).toBeNull();
});

it.each([null, {}, { ...submitted, accepted: false }, { ...submitted, top: [null] },
  { ...submitted, rankContext: null }, { ...submitted, rankContext: { ...submitted.rankContext, rank: 0 } },
  { ...submitted, rankContext: { ...submitted.rankContext, nextRank: {} } }])('rejects malformed submission confirmation %#', async body => {
  const api = await client(); response(body); expect(await api.submitToGlobal('PLAYER', blackFridayChallenge, [], 'run')).toBeNull();
});

it('handles network, timeout, invalid JSON and HTTP failures without throwing', async () => {
  const api = await client();
  for (const error of [new TypeError('Offline'), new DOMException('Timed out', 'TimeoutError')]) {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    expect(await api.fetchGlobalTop(blackFridayChallenge)).toBeNull();
    expect(await api.submitToGlobal('PLAYER', blackFridayChallenge, [], 'run')).toBeNull();
  }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));
  expect(await api.fetchGlobalTop(blackFridayChallenge)).toBeNull();
  expect(await api.submitToGlobal('PLAYER', blackFridayChallenge, [], 'run')).toBeNull();
  for (const status of [409, 429, 500]) {
    response({}, status);
    expect(await api.fetchGlobalTop(blackFridayChallenge)).toBeNull();
    expect(await api.submitToGlobal('PLAYER', blackFridayChallenge, [], 'run')).toBeNull();
  }
});
