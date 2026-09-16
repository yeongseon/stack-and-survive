# Leaderboard API Deployment

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
pnpm build        # esbuild -> dist/server.js (55KB bundle)
node dist/server.js
```

No tsx required in production.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGINS` | `http://localhost:5173,...,https://yeongseon.github.io,https://yeongseon.dev` | Comma-separated allowed origins |
| `LEADERBOARD_STORAGE` | `memory` | `memory` or `file` |
| `LEADERBOARD_FILE_PATH` | `./data/leaderboard.json` | Path for file storage |
| `TRUST_PROXY` | `false` | Set `true` behind reverse proxy to trust X-Forwarded-For |
| `BUILD_SHA` | (empty) | Git commit SHA shown in `/api/health` response |

### CORS origins vs page URLs

The game is served from GitHub Pages at:

    https://yeongseon.github.io/stack-and-survive/

which may redirect via custom domain to:

    https://yeongseon.dev/stack-and-survive/

CORS `Origin` headers contain only the scheme + host (no path), so the
required allowed origins are:

    https://yeongseon.github.io
    https://yeongseon.dev

Both must be in `CORS_ORIGINS`. Omitting either will block browser
leaderboard requests from that origin.

## Docker deployment

```bash
# Build
docker build -f apps/leaderboard-api/Dockerfile -t leaderboard-api .

# Run with persistent storage
docker run -p 3001:3001 \
  -v leaderboard-data:/app/data \
  -e CORS_ORIGINS="https://yeongseon.github.io,https://yeongseon.dev" \
  leaderboard-api
```

## Azure App Service deployment (current production)

Current production deployment:

- **Service:** Azure App Service
- **Runtime:** Node 22 LTS
- **URL:** `https://stack-survive-leaderboard.azurewebsites.net`
- **Storage:** `LEADERBOARD_STORAGE=file`
- **Persistent path:** `/home/data/leaderboard.json`
- **Proxy:** `TRUST_PROXY=true` (App Service fronts with a reverse proxy)
- **Replicas:** Single instance (required for file-based storage)

### Setup steps

1. Create an Azure App Service (Node 22 LTS)
2. Set environment variables in Configuration -> Application settings:
   - `CORS_ORIGINS=https://yeongseon.github.io,https://yeongseon.dev`
   - `LEADERBOARD_STORAGE=file`
   - `LEADERBOARD_FILE_PATH=/home/data/leaderboard.json`
   - `TRUST_PROXY=true`
   - `BUILD_SHA=<git-sha>` (optional, for health endpoint)
3. Deploy `apps/leaderboard-api/dist/server.js` via ZIP deploy
4. App Service persistent storage at `/home/` survives restarts and redeploys
5. Verify with `curl https://stack-survive-leaderboard.azurewebsites.net/api/health`

## GitHub Pages wiring

The browser game reads the API URL from `VITE_LEADERBOARD_API` at build time.

In the Pages deployment workflow, set:

```yaml
env:
  VITE_LEADERBOARD_API: ${{ vars.LEADERBOARD_API_URL }}
```

Repository variable `LEADERBOARD_API_URL` should be the deployed API origin (e.g., `https://stack-survive-leaderboard.azurewebsites.net`).

If the variable is empty or unset, the game operates in local-only mode with no global leaderboard. This is safe -- the local leaderboard still works.

## Verification

```bash
# Health check
curl https://stack-survive-leaderboard.azurewebsites.net/api/health

# CORS verification (allowed origin)
curl -i -H "Origin: https://yeongseon.dev" \
  "https://stack-survive-leaderboard.azurewebsites.net/api/leaderboard?challenge=<hash>"
# Should include: Access-Control-Allow-Origin: https://yeongseon.dev

# CORS verification (rejected origin)
curl -i -H "Origin: https://example.invalid" \
  "https://stack-survive-leaderboard.azurewebsites.net/api/health"
# Should NOT include Access-Control-Allow-Origin

# Full smoke test (read-only)
LEADERBOARD_API=https://stack-survive-leaderboard.azurewebsites.net \
  SMOKE_ORIGIN=https://yeongseon.dev \
  SMOKE_REJECT_ORIGIN=https://example.invalid \
  node scripts/smoke-leaderboard.mjs

# Full smoke test (with submission)
LEADERBOARD_API=https://stack-survive-leaderboard.azurewebsites.net \
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

1. Stop accepting new submissions if necessary (scale to 0 or block POST)
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
az webapp restart --name stack-survive-leaderboard --resource-group <rg>

# Wait for health, then verify entries are identical
curl .../api/health
curl ".../api/leaderboard?challenge=<hash>"
```

## Scaling

**Run exactly ONE API replica.** File-based storage is not safe for concurrent multi-instance writes. If multiple replicas are needed, migrate to a concurrency-safe backend (Azure Table Storage, Cosmos DB, or PostgreSQL) first.

## Security notes

- Never commit storage credentials or connection strings
- CORS restricts origins to configured Pages URLs + local dev
- Rate limiting: 10 POST/min, 60 GET/min per IP
- X-Forwarded-For only trusted when `TRUST_PROXY=true` (best-effort abuse protection; single-replica in-memory limiter, not an authentication boundary)
- No stack traces or internal paths in error responses
- Graceful shutdown on SIGTERM/SIGINT
- HTTP timeouts: request 30s, headers 15s, keepAlive 10s
