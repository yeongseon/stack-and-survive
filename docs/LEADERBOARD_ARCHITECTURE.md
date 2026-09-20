# Leaderboard Architecture

## Overview

This describes merged source, not production compatibility. The configured MCAPS API still rejects the current 0.4 hash (#306); [Current status](CURRENT_STATUS.md) owns dated deployment evidence. Export to Azure and Learn links remain in unmerged draft #316, independent of this replay flow.

Stack & Survive uses a **server-verified leaderboard** where the browser never sends a trusted score. The server replays the player's infrastructure decisions using the same deterministic simulation engine that powers the game.

## Flow

```
Browser                          Server (leaderboard-api)
  |                                |
  |  Player completes a run        |
  |  Score shown locally           |
  |                                |
  |  POST /api/leaderboard         |
  |  {                             |
  |    nickname,                   |
  |    challengeContentHash,       |
  |    actions: [                  |
  |      { type, time, sequence }  |
  |    ]                           |
  |  }                             |
  |  ----------------------------→ |
  |                                |  1. Validate nickname
  |                                |  2. Resolve supported challenge
  |                                |  3. Load canonical start architecture
  |                                |  4. Validate action schedule
  |                                |  5. Deterministic simulation replay
  |                                |  6. Calculate authoritative score
  |                                |  7. Require objective completion
  |                                |  8. Persist verified entry
  |                                |  9. Calculate rank
  |  ←---------------------------- |
  |  { rank, score, top: [...] }   |
  |                                |
  |  Display global leaderboard    |
```

## Trust Boundary

The server does NOT trust:
- Score submitted by the browser
- Availability, NBV, or any computed metric
- Final architecture state
- Objective completion claim

The server trusts only:
- Challenge identity (verified by content hash against supported list)
- Action schedule (validated types, time bounds, sequence, count limit)

Everything else is computed by replaying the action schedule from the canonical starting architecture through the deterministic simulation.

## Deterministic Replay

The replay verifier (`packages/simulation/src/replay.ts`) runs the same simulation code used during gameplay:

1. Load the canonical player starting architecture (`canonicalPlayerStart()`)
2. Initialize simulation state with the challenge's workload scenario
3. Apply each action at its declared simulation second
4. Run until completion or failure
5. Calculate score using the same formula as gameplay

The same verifier is used by:
- **Browser run history** — validates saved runs can be reproduced
- **Leaderboard API** — produces authoritative scores from action provenance

## Canonical Starting Architecture

The server never accepts a client-provided starting architecture. Both browser and server import `canonicalPlayerStart()` from `@stack-and-survive/cloud-domain`, ensuring:

- No pre-existing Cache or Protected Edge
- No extra App instances at t=0
- No moved or modified resources
- Exact resource positions matching player mode

## Challenge Identity

Challenges are identified by their content hash (`contentHash`), which includes:
- Schema version, challenge ID, version, rules version
- Seed algorithm and seed value
- Full workload specification (duration, budget, traffic phases, targets)
- Objective definition

Rules 0.2/0.3/0.4 identities are separated by `rulesVersion` and complete challenge content. Current API source allowlists the 0.4 ladder plus legacy 0.3 ladder; preserving 0.2 engine fixtures does not mean the API accepts arbitrary 0.2 submissions.

## Ranking

Entries are ranked by:
1. **Score** (descending) — 0 to 10,000
2. **Availability** (descending) — tie-break
3. **Submission time** (ascending) — second tie-break (earlier wins)

Only `COMPLETED` runs that meet the challenge objective qualify.

## Local Fallback

The browser maintains a localStorage-based local leaderboard that:
- Works offline
- Shows results immediately without waiting for the server
- Falls back when the global API is unavailable
- Uses the same ranking rules as the server

When both are available, the global leaderboard takes visual priority with the local board as fallback.

## Privacy and Data

The server stores only:
- Self-reported nickname (2-16 alphanumeric characters)
- Verified score and availability
- Submission timestamp
- Challenge identity hash
- Action digest (for deduplication, not full replay data)

No authentication, user accounts, device IDs, IP addresses, or personal data beyond the chosen nickname.

## Duplicate Prevention

Runs are deduplicated by `challengeContentHash + clientRunId`. The browser generates a UUID for each completed run. This means:

- An identical retry returns the existing entry/rank with HTTP 200; no duplicate is created. Reusing the ID with a different nickname or action digest returns 409.
- Two different players who happen to make identical infrastructure decisions are both accepted (different clientRunIds)
- `actionDigest` is retained as provenance metadata but is NOT the duplicate key

## Deployment

```
# Development (in-memory, non-persistent)
cd apps/leaderboard-api
pnpm dev

# Production build
pnpm build
LEADERBOARD_STORAGE=file node dist/server.js

# Docker
docker build -f apps/leaderboard-api/Dockerfile -t leaderboard-api .
docker run -p 3001:3001 -v leaderboard-data:/app/data leaderboard-api
```

Environment variables: see `apps/leaderboard-api/.env.example`

## Limitations

- **File-based storage**: Production uses JSON file persistence. Suitable for hackathon scale. Azure Table Storage can be added later.
- **No authentication**: Nicknames are not unique or verified. Different players can use the same nickname.
- **No anti-cheat beyond replay**: The server verifies that submitted actions produce the claimed outcome, but cannot prevent automated play or action optimization outside the game.
- **Rate limiting**: 10 submissions/min and 60 reads/min per IP. `TRUST_PROXY=true` required behind reverse proxy.
