# Backend Production Evidence

Last updated: 2026-09-17T11:51Z

## Deployment

| Property | Value |
|---|---|
| Frontend URL | `https://yeongseon.github.io/stack-and-survive/` |
| API URL | `https://stack-survive-leaderboard.azurewebsites.net` |
| Storage | `file` |
| Uptime | 25+ hours at verification time |
| CORS allowed origin | `https://yeongseon.github.io` |
| Main SHA | `8f6744c` |

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

## Remaining Manual Verification

- [ ] App Service restart preserves leaderboard data (requires Azure portal)
