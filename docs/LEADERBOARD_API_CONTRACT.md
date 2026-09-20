# Leaderboard API Contract

Current merged source contract at `c68ec0c`. Deployed MCAPS compatibility is separately blocked in #306; see [Current status](CURRENT_STATUS.md). `/api/export-bicep` and the `ai` health field exist only in draft PR #316, not this API contract.

## POST /api/leaderboard

Submit a completed run for server-verified scoring.

### Request

```json
{
  "nickname": "PlayerName",
  "clientRunId": "uuid-or-unique-id",
  "challengeContentHash": "fnv1a64:...",
  "actions": [
    { "type": "SCALE_OUT", "time": 16, "sequence": 0 },
    { "type": "DEPLOY_RESOURCE", "kind": "cache", "time": 17, "sequence": 1, "x": 190, "y": -100 }
  ]
}
```

The server ignores any client-provided `score`, `availability`, `objectiveMet`, `finalArchitecture`, or `rank`. These are computed by deterministic replay.

### Server processing

1. Validate nickname (2-16 alphanumeric/hyphen/underscore)
2. Validate clientRunId (8–64 ASCII letters/digits, underscore or hyphen)
3. Resolve challenge by contentHash (must be in supported list)
4. Parse and validate action schedule
5. Load canonical starting architecture
6. Deterministic simulation replay
7. Require objective completion
8. Persist verified entry (atomic file write)
9. Return rank context + Top 10

### Response (200)

```json
{
  "accepted": true,
  "rankContext": {
    "rank": 3,
    "totalEntries": 15,
    "score": 8500,
    "availability": 1.0,
    "nextRank": { "rank": 2, "score": 9474, "availability": 0.996 },
    "pointsToNextRank": 974,
    "tieBreakReason": null
  },
  "top": [
    { "rank": 1, "nickname": "Top", "score": 9474, "availability": 0.996, "submittedAt": 1726000000000 }
  ]
}
```

### Idempotency

Same `challengeContentHash + clientRunId` with matching `nickname` and `actionDigest`: returns 200 with existing rank (no duplicate created).

Same `clientRunId` with different actions or nickname: returns 409.

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid JSON, missing/invalid fields, unsupported challenge, unsupported action, objective not met |
| 409 | clientRunId reused for different submission |
| 413 | Body exceeds 200KB |
| 429 | Rate limit exceeded (10 POST/min per IP) |
| 500 | Unexpected server error (safe message only) |

## GET /api/leaderboard?challenge=\<contentHash\>

### Response (200)

```json
{
  "challengeHash": "fnv1a64:...",
  "available": true,
  "entries": [
    { "rank": 1, "nickname": "Top", "score": 9474, "availability": 0.996, "submittedAt": 1726000000000 }
  ]
}
```

Returns `available: true` even for empty boards (server is reachable).

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | Missing challenge parameter or unsupported challenge hash |
| 429 | Rate limit exceeded (60 GET/min per IP) |

## GET /api/health

An optional `version` field is included when `BUILD_SHA` is set. Its absence is not a verified source identity. A healthy response does not prove the currently played challenge is supported.

```json
{ "status": "ok", "storage": "file", "requests": 42, "uptimeSeconds": 3600 }
```

## Method restrictions

| Method | /api/leaderboard | /api/health |
|--------|-----------------|-------------|
| GET | Top 10 | Health |
| POST | Submit | 404 |
| OPTIONS | CORS preflight | CORS preflight |
| PUT/DELETE | 405 | 404 |

## Ranking rules

1. **Score** descending (0–10,000)
2. **Availability** descending (tie-break)
3. **Submission time** ascending (second tie-break: earlier wins)

Only `COMPLETED` runs meeting the challenge objective qualify.

## Data stored per entry

- id, clientRunId, nickname, score, availability, submittedAt, challengeHash, actionDigest

NOT stored: IP addresses, device IDs, full action schedules, personal data beyond nickname.

## Local fallback

The browser always saves scores locally first. If the API is unavailable, the local leaderboard is displayed. Network failures never block gameplay or result display.

## Single-replica limitation

Current file-based storage requires exactly one API replica. Concurrent replicas would produce inconsistent state. Azure Table Storage migration is documented for future multi-replica needs.
