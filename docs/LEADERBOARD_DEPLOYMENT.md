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
| `CORS_ORIGINS` | `http://localhost:5173,...,https://yeongseon.github.io` | Comma-separated allowed origins |
| `LEADERBOARD_STORAGE` | `memory` | `memory` or `file` |
| `LEADERBOARD_FILE_PATH` | `./data/leaderboard.json` | Path for file storage |
| `TRUST_PROXY` | `false` | Set `true` behind reverse proxy to trust X-Forwarded-For |
| `BUILD_SHA` | (empty) | Git commit SHA shown in `/api/health` response |
| `AZURE_OPENAI_ENDPOINT` | (empty) | Server-only HTTPS Azure OpenAI resource origin; no path/query |
| `AZURE_OPENAI_API_KEY` | (empty) | Server-only credential; never a `VITE_` variable |
| `AZURE_OPENAI_DEPLOYMENT` | (empty) | Deployment name supporting Responses and Structured Outputs (e.g. a supported gpt-4.1/4o/5-family deployment) |
| `AZURE_OPENAI_API_VERSION` | (empty) | Optional compatibility override; default GA `/openai/v1/responses` needs no query |

### Optional Export to Azure proxy

Agent follow-up #322 adds `/api/export-agent` and `BICEP_CLI_PATH` (approved absolute compiler executable; default empty/off). Health `agent: configured|off` reflects configuration only, not a successful upstream/compile probe. The UI calls this bounded agent endpoint; the original single-shot endpoint remains for compatibility. Both share 5/IP/min; agent execution additionally caps concurrent workflows at two/process. Model/compiler/total limits and deployment-isolation requirements are in [Architecture Export Agent](ARCHITECTURE_EXPORT_AGENT.md). No automatic compiler download or App Service setup is included or authorized.

Implementation checkpoint (#315): shell AI credentials are absent; real model output from a played run has **not** been verified. Only mocked responses and an explicitly hand-authored Bicep fixture have been tested/compiled. This section is setup guidance, not evidence of a configured production export service.

An authorized operator must configure the first three `AZURE_OPENAI_*` values in App Service → Configuration → Application settings; leave the fourth empty for v1 GA unless the chosen service explicitly supports that override. These settings are not configured by this change or by CI. The export endpoint returns **503 Export not configured** until configured; `/api/health` reports `ai: off` or `configured` (configuration presence, not an upstream connectivity test).

The compatibility override is appended as `?api-version=…`; current v1 documentation does not guarantee dated preview versions on this path. Prefer default GA. Verify model/region Responses and Structured Outputs support. The adapter uses Node 22 built-in fetch, `store:false`, strict JSON output, 2500 output tokens and a 25-second timeout. Truncation/refusal/malformed output fails closed as 502, without forwarding upstream error bodies. Larger WAF templates may exceed the budget; no automatic retry/deployment occurs.

`POST /api/export-bicep` is stateless and independent of leaderboard storage/replay. It accepts at most 20,000 UTF-8 bytes, with a separate 5-request/minute/IP limiter and denied disallowed browser origins. Runs are structurally validated, not replay-authenticated. No player name, free-form prompt, generated content or request body is logged. Provider retention/abuse monitoring is separate from `store:false`.

Bicep resource declarations require `@API-version`; this syntax is narrowly permitted. URLs remain forbidden in Bicep; the conventional parameters JSON `$schema` URL is separately allowed. Required Entra administrator parameters have no invented identity/default; fill them yourself. Parameters JSON includes only location/namePrefix defaults. Generated infrastructure is a reviewable scaffold, not application code, SQL app permissions, private connectivity or guaranteed regional SKU availability.

Manual smoke (no deployment):

```bash
# Terminal 1: set real AZURE_OPENAI_ENDPOINT/API_KEY/DEPLOYMENT securely in the shell.
# Do not echo them, put literal keys in command history, or use VITE_ names.
pnpm --filter @stack-and-survive/leaderboard-api dev
# Terminal 2
VITE_LEADERBOARD_API=http://localhost:3001 pnpm dev
# Open the printed URL with /?tycoon, finish a run, Export to Azure and download files.
az bicep build --file /path/to/downloaded/main.bicep
```

Record exact source, model deployment/version (not keys), generation outcome and compiler output in the PR. Compilation of a hand-authored/mock fixture is not actual AI-output evidence. Missing shell credentials mean a blocked smoke test, not a pass. No `az deployment` or Azure settings change is authorized by CI.

Offline compiler regressions (not real-model evidence): `pnpm --filter @stack-and-survive/leaderboard-api exec tsx scripts/smoke-export.ts --fixture` and the same command with `--all-resources` compile hand-authored App/SQL and App/SQL/Managed Redis/WAF scaffolds. Generated files stay in ignored `test-results/`. `pnpm typecheck` checks both web/shared code and the API using a pinned, development-only Node 22 type package; no OpenAI SDK or web runtime dependency is added.

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

## Existing Azure App Service deployment (not an agent deployment)

The agent follow-up in #322 and its base PR #316 are unmerged development work. The older deployment example below is not proof that either AI endpoint or an approved compiler is running. Read main's current release/MCAPS status before any operational action; no live AI/agent verification has occurred in this branch.

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
   - `CORS_ORIGINS=https://yeongseon.github.io`
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
curl -i -H "Origin: https://yeongseon.github.io" \
  "https://stack-survive-leaderboard.azurewebsites.net/api/leaderboard?challenge=<hash>"
# Should include: Access-Control-Allow-Origin: https://yeongseon.github.io

# CORS verification (rejected origin)
curl -i -H "Origin: https://example.invalid" \
  "https://stack-survive-leaderboard.azurewebsites.net/api/health"
# Should NOT include Access-Control-Allow-Origin

# Full smoke test (read-only)
LEADERBOARD_API=https://stack-survive-leaderboard.azurewebsites.net \
  SMOKE_ORIGIN=https://yeongseon.github.io \
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
- CORS restricts origins to configured Pages URL + local dev
- Rate limiting: 10 POST/min, 60 GET/min per IP
- X-Forwarded-For only trusted when `TRUST_PROXY=true` (best-effort abuse protection; single-replica in-memory limiter, not an authentication boundary)
- No stack traces or internal paths in error responses
- Graceful shutdown on SIGTERM/SIGINT
- HTTP timeouts: request 30s, headers 15s, keepAlive 10s
