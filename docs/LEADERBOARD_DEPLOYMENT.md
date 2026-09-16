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
pnpm build        # esbuild → dist/server.js (55KB bundle)
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

## Azure App Service deployment

1. Create an Azure App Service (Node 20 LTS)
2. Set environment variables in Configuration → Application settings
3. Deploy `apps/leaderboard-api/dist/server.js` via ZIP deploy or container
4. For persistent storage, use Azure Files mounted to `/app/data`
5. Set `CORS_ORIGINS` to your Pages URL
6. Set `TRUST_PROXY=true` (App Service uses a reverse proxy)

## Azure Container Apps deployment

```bash
az containerapp create \
  --name leaderboard-api \
  --resource-group <rg> \
  --image <acr>.azurecr.io/leaderboard-api:latest \
  --target-port 3001 \
  --env-vars LEADERBOARD_STORAGE=file CORS_ORIGINS=https://yeongseon.github.io TRUST_PROXY=true
```

Mount Azure Files for persistent storage.

## GitHub Pages wiring

The browser game reads the API URL from `VITE_LEADERBOARD_API` at build time.

In the Pages deployment workflow, set:

```yaml
env:
  VITE_LEADERBOARD_API: ${{ vars.LEADERBOARD_API_URL }}
```

Repository variable `LEADERBOARD_API_URL` should be the deployed API origin (e.g., `https://leaderboard-api.azurewebsites.net`).

If the variable is empty or unset, the game operates in local-only mode with no global leaderboard. This is safe — the local leaderboard still works.

## Verification

```bash
# Health check
curl http://localhost:3001/api/health

# Smoke test
LEADERBOARD_API=http://localhost:3001 SMOKE_MUTATE=true node scripts/smoke-leaderboard.mjs
```

## Rollback

1. Redeploy the previous container/ZIP
2. Leaderboard data in the file/volume is preserved across deploys
3. If data is corrupted, delete `leaderboard.json` — server starts with empty board

## Security notes

- Never commit storage credentials or connection strings
- CORS restricts origins to configured Pages URL + local dev
- Rate limiting: 10 POST/min, 60 GET/min per IP
- X-Forwarded-For only trusted when `TRUST_PROXY=true`
- No stack traces or internal paths in error responses
