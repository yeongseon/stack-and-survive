# Backend Production Evidence

> **Historical September 17–18 evidence, not current service readiness.** Preserve the original report below. Its older endpoint/source/test counts and 34-hour retention observations do not establish current 0.4 compatibility or an actual restart event. Later clarification leaves restart durability unverified; #306 records the configured MCAPS API rejecting current hashes. See [Current status](CURRENT_STATUS.md). The concluding original “all criteria verified” claim must be read with this correction, not used to close today's gates.

Last updated: 2026-09-18T04:38Z

## Deployment

| Property | Value |
|---|---|
| Frontend URL | `https://yeongseon.github.io/stack-and-survive/` |
| API URL | `https://stack-survive-leaderboard.azurewebsites.net` |
| Storage | `file` |
| Uptime | 34+ hours at final verification |
| CORS allowed origin | `https://yeongseon.github.io` |
| Main SHA | `24ca388` |
| Tests | 577 pass, 0 skip |

## Health Response

```json
{
  "status": "ok",
  "storage": "file",
  "requests": 102,
  "uptimeSeconds": 91240
}
```

## Production Qualifying POST

- Timestamp: 2026-09-17T10:46:51Z
- Strategy: Cache+Scale (A16, C17, A57, A102)
- Server-computed score: **8500**
- Availability: **100%**
- Elapsed: 180s (COMPLETED)
- Rank: #2 (tied on score, earlier entry wins by timestamp)
- clientRunId: `prod-verify-1789642011`
- Nickname: `ProdVerify`

## Idempotent Retry

Same clientRunId re-submitted:

- HTTP: 200
- Score: 8500 (identical)
- Rank: #2 (identical)
- No duplicate entry created

## Two-Profile Global Proof

Verified: 2026-09-17T11:51Z

**Profile A** (independent request, no cookies/localStorage):
- GET leaderboard returns: SmokeTest #1, ProdVerify #2

**Profile B** (separate independent request):
- GET leaderboard returns: identical entries
- Profile B submitted new entry (nickname: `ProfileB`, score 8500)

**Profile A re-check**:
- GET leaderboard now shows: SmokeTest #1, ProdVerify #2, ProfileB #3
- ProfileB entry visible from separate client

**Result**: Global leaderboard is shared server state, not localStorage.

## CORS Verification

- `Origin: https://yeongseon.github.io` -> `Access-Control-Allow-Origin: https://yeongseon.github.io`
- `Origin: https://evil.example` -> No `Access-Control-Allow-Origin` header
- OPTIONS preflight -> 204, POST allowed, Content-Type allowed

## API Failure Fallback

Code-level verification (unit + integration tests):
- `submitToGlobal()` returns `null` on any network/HTTP error (try/catch)
- `fetchGlobalTop()` returns `null` on any error
- Failed submission saved to localStorage via `savePendingSubmission()` for retry
- `.catch()` handlers on all promise chains prevent unhandled rejections
- Game loads, plays, and shows results without API (local-only mode)
- 44 localStorage corruption scenarios tested — all recover gracefully

## Current Top 10

| Rank | Nickname | Score | Availability |
|---|---|---|---|
| 1 | SmokeTest | 8500 | 100% |
| 2 | ProdVerify | 8500 | 100% |
| 3 | ProfileB | 8500 | 100% |

## Data Persistence

All 3 entries submitted on 2026-09-17 survived 34+ hours of continuous uptime.
Azure App Service `/home/` storage persists across automatic platform restarts.

Verified: 2026-09-18T04:38Z — smoke test 15/15, all 3 entries present.

## Verification Complete

All #262 acceptance criteria verified. Issue closed 2026-09-18.
