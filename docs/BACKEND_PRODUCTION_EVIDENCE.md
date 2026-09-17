# Backend Production Evidence

Captured: 2026-09-17T10:46Z

## Deployment

| Property | Value |
|---|---|
| Frontend URL | `https://yeongseon.github.io/stack-and-survive/` |
| API URL | `https://stack-survive-leaderboard.azurewebsites.net` |
| Storage | `file` |
| Uptime | 25+ hours at verification time |
| CORS allowed origin | `https://yeongseon.github.io` |
| Main SHA | `cdbae97` |

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
- Top 10 contains exactly 2 entries (SmokeTest + ProdVerify)

## CORS Verification

- `Origin: https://yeongseon.github.io` -> `Access-Control-Allow-Origin: https://yeongseon.github.io`
- `Origin: https://evil.example` -> No `Access-Control-Allow-Origin` header
- OPTIONS preflight -> 204, POST allowed, Content-Type allowed

## Current Top 10

| Rank | Nickname | Score | Availability |
|---|---|---|---|
| 1 | SmokeTest | 8500 | 100% |
| 2 | ProdVerify | 8500 | 100% |

## Remaining Manual Verification

- [ ] Two independent browser profiles see shared global board
- [ ] App Service restart preserves leaderboard data
- [ ] API unavailability -> local fallback works -> API recovery
