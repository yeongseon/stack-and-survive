# Leaderboard API Deployment

Reviewed against merged `c68ec0c`. [Current status](CURRENT_STATUS.md) is the release authority. Main has only leaderboard/health routes; Export/OpenAI settings and `/api/export-bicep` remain in draft #316. No Azure OpenAI account or model was created by that work. Current 0.4 API compatibility is blocked in #306 despite source support.

## Local development

```bash
cd apps/leaderboard-api
pnpm install
pnpm dev          # runs with tsx, in-memory storage
```

Server starts at `http://localhost:3001`. Health: `GET /api/health`.

## Production build

```bash
cd apps/leaderboard-api
pnpm build        # esbuild -> dist/server.js; measure this revision, not a historical bundle size
node dist/server.js
```

No tsx required in production.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGINS` | `http://localhost:5173,...,https://yeongseon.github.io` | Comma-separated allowed origins |
| `LEADERBOARD_STORAGE` | `memory` | `memory` or `file` |
| `LEADERBOARD_FILE_PATH` | `./data/leaderboard.json` | Path for file storage |
| `TRUST_PROXY` | `false` | Set `true` behind reverse proxy to trust X-Forwarded-For |
| `BUILD_SHA` | (empty) | Git commit SHA shown in `/api/health` response |

### CORS origins vs page URLs

The game is served from GitHub Pages at:

    https://yeongseon.github.io/stack-and-survive/

CORS `Origin` headers contain only the scheme + host (no path), so the
required allowed origin is:

    https://yeongseon.github.io

This must be in `CORS_ORIGINS`. If a custom domain is added later,
its origin must also be included.

## Docker deployment

```bash
# Build
docker build -f apps/leaderboard-api/Dockerfile -t leaderboard-api .

# Run with persistent storage
docker run -p 3001:3001 \
  -v leaderboard-data:/app/data \
  -e CORS_ORIGINS="https://yeongseon.github.io" \
  leaderboard-api
```

## Azure App Service deployment (configured production, compatibility blocked)

Current production deployment:

- **Service:** Azure App Service
- **Runtime:** Node 22 LTS
- **URL:** `https://stack-survive-mcaps-ychoe.azurewebsites.net`
- **Subscription / resource group:** MCAPS / `rg-stack-survive`
- **App / plan:** `stack-survive-mcaps-ychoe` / `plan-stack-survive`
- **Storage:** `LEADERBOARD_STORAGE=file`
- **Persistent path:** `/home/data/leaderboard.json`
- **Proxy:** `TRUST_PROXY=true` (App Service fronts with a reverse proxy)
- **Replicas:** Single instance (required for file-based storage)

### Setup steps

These are operator instructions, not permission to provision, redeploy or restart. Existing deployment metadata requests returned 403; preserve storage/settings and coordinate with the backend owner. Verify the MCAPS subscription explicitly rather than relying on the CLI default. `/home/` is the intended persistent path, but actual restart-event durability has not been demonstrated by the historical uptime observations.

1. Create an Azure App Service (Node 22 LTS)
2. Set environment variables in Configuration -> Application settings:
   - `CORS_ORIGINS=https://yeongseon.github.io`
   - `LEADERBOARD_STORAGE=file`
   - `LEADERBOARD_FILE_PATH=/home/data/leaderboard.json`
   - `TRUST_PROXY=true`
   - `BUILD_SHA=<git-sha>` (optional, for health endpoint)
3. Deploy `apps/leaderboard-api/dist/server.js` via ZIP deploy
4. App Service persistent storage at `/home/` survives restarts and redeploys
5. Verify health and both current/legacy challenge reads at the configured origin; 0.4 `400 Unsupported challenge` must not be called success.

## GitHub Pages wiring

The browser game reads the API URL from `VITE_LEADERBOARD_API` at build time.

In the Pages deployment workflow, set:

```yaml
env:
  VITE_LEADERBOARD_API: ${{ vars.LEADERBOARD_API_URL }}
```

Repository variable `LEADERBOARD_API_URL` is currently `https://stack-survive-mcaps-ychoe.azurewebsites.net`. Re-read it before an operational change; changing docs does not update the deployed bundle.

If the variable is empty or unset, the game operates in local-only mode with no global leaderboard. This is safe -- the local leaderboard still works.

## Verification

```bash
# Health check
curl https://stack-survive-mcaps-ychoe.azurewebsites.net/api/health

# CORS verification (allowed origin)
curl -i -H "Origin: https://yeongseon.github.io" \
  "https://stack-survive-mcaps-ychoe.azurewebsites.net/api/leaderboard?challenge=<hash>"
# Should include: Access-Control-Allow-Origin: https://yeongseon.github.io

# CORS verification (rejected origin)
curl -i -H "Origin: https://example.invalid" \
  "https://stack-survive-mcaps-ychoe.azurewebsites.net/api/health"
# Should NOT include Access-Control-Allow-Origin

# Full smoke test (read-only)
LEADERBOARD_API=https://stack-survive-mcaps-ychoe.azurewebsites.net \
  SMOKE_ORIGIN=https://yeongseon.github.io \
  SMOKE_REJECT_ORIGIN=https://example.invalid \
  node scripts/smoke-leaderboard.mjs

# Mutation example: isolated local API only; public POST needs explicit coordination
LEADERBOARD_API=http://127.0.0.1:3001 \
  SMOKE_MUTATE=true \
  node scripts/smoke-leaderboard.mjs
```

## Rollback / Recovery

### Bad code deployment

1. Redeploy the previous ZIP package or container
2. Leaderboard data at `/home/data/leaderboard.json` is preserved across deploys
3. Verify health and Top 10 after rollback

### Corrupted leaderboard data

**Do NOT delete `leaderboard.json` as the first step.** The server
automatically quarantines corrupt files on startup.

Recovery sequence:

1. Arrange an authorized maintenance window and stop/block writes through the approved service path; do not assume App Service plans support scaling to zero.
2. Preserve the current/corrupt file: `cp leaderboard.json leaderboard.json.bak.<timestamp>`
3. Check the quarantine directory for auto-preserved copies
4. Inspect the backup to determine if data is recoverable
5. Restore a known-good backup, or intentionally reset only with owner approval
6. Restart the API
7. Verify health and Top 10

### App Service restart persistence test

After any restart, verify leaderboard entries survive:

```bash
# Record current state
curl .../api/health
curl ".../api/leaderboard?challenge=<hash>"

# Restart App Service
az webapp restart --subscription <confirmed-mcaps-subscription-id> --name stack-survive-mcaps-ychoe --resource-group rg-stack-survive

# Wait for health, then verify entries are identical
curl .../api/health
curl ".../api/leaderboard?challenge=<hash>"
```

## Scaling

**Run exactly ONE API replica.** File-based storage is not safe for concurrent multi-instance writes. If multiple replicas are needed, migrate to a concurrency-safe backend (Azure Table Storage, Cosmos DB, or PostgreSQL) first.

## Security notes

- Never commit storage credentials or connection strings
- CORS controls browser response access; it is not authentication and does not prevent a non-browser POST.
- Rate limiting: 10 POST/min, 60 GET/min per IP
- X-Forwarded-For only trusted when `TRUST_PROXY=true` (best-effort abuse protection; single-replica in-memory limiter, not an authentication boundary)
- No stack traces or internal paths in error responses
- Graceful shutdown on SIGTERM/SIGINT
- HTTP timeouts: request 30s, headers 15s, keepAlive 10s
