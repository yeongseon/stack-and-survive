# Global Leaderboard - Demo Technical Evidence

> This source-architecture and historical deployment checklist is not a current live-service verification. The configured origin is now `https://stack-survive-mcaps-ychoe.azurewebsites.net`, with current 0.4 support blocked in #306. The deployment table below records the earlier endpoint; retention is not restart proof. See [Current status](CURRENT_STATUS.md) before presenting.

## Architecture

```
Frontend (GitHub Pages)
        |
        v
  nickname + challenge identity + action schedule
        |
        v
Azure App Service Leaderboard API
        |
        v
  canonical challenge definition
  canonical starting architecture
  deterministic simulation replay
        |
        v
  server-computed authoritative score
        |
        v
  persistent leaderboard (FileStorage)
```

## Key security property

> The leaderboard never trusts a score sent by the browser.
> The server replays the player's architecture decisions through the same
> deterministic simulation engine and calculates the authoritative score.

## What the browser sends

- `nickname` (2-16 ASCII alphanumeric characters)
- `clientRunId` (unique run identifier for idempotency)
- `challengeContentHash` (identifies which challenge scenario)
- `actions[]` (timestamped architecture decisions: SCALE_OUT, DEPLOY_RESOURCE, etc.)

## What the browser does NOT send

- Score
- Availability percentage
- Final result / objective status
- Any computed metrics

## What the server does

1. Validates the challenge hash against the known challenge ladder
2. Validates action types, timing, and structure
3. Replays the action schedule against the canonical challenge using the deterministic simulation engine
4. Computes the authoritative score and availability
5. Rejects runs that do not meet the objective
6. Stores the entry with server-computed results
7. Returns rank context and Top 10

## Deployment facts

| Property | Value |
|---|---|
| Frontend | GitHub Pages (`yeongseon.github.io`) |
| API | Azure App Service (`stack-survive-leaderboard.azurewebsites.net`) |
| Runtime | Node 22 LTS |
| Storage | FileStorage at `/home/data/leaderboard.json` |
| Persistence | Azure App Service `/home/` (survives restarts) |
| CORS | `https://yeongseon.github.io` |
| Rate limits | 10 POST/min, 60 GET/min per IP |
| Replicas | Single instance |

## Verification checklist

- [ ] API health returns 200 with storage mode and uptime
- [ ] GET leaderboard returns entries for known challenge
- [ ] Browser shows Global Leaderboard (not local fallback)
- [ ] Two independent profiles see shared scores
- [ ] Entries survive App Service restart
- [ ] Local fallback works when API is unavailable

## Future storage comparison

| | FileStorage (current) | Azure Table Storage | Cosmos DB |
|---|---|---|---|
| Persistence | App Service `/home/` | Azure-managed | Azure-managed |
| Multi-replica safety | No | Yes | Yes |
| Query/ranking | In-memory sort | Partition + sort key | SQL-like queries |
| Cost | Uses the existing App Service plan; not inherently free | Depends on actual usage/tier | Depends on actual usage/tier |
| Deployment complexity | Minimal | Moderate | Moderate |
| Migration effort | N/A | Medium | Medium |

Current single-replica FileStorage is acceptable for the Hackathon. Migrate only if persistence proves unreliable or multi-replica is required.
