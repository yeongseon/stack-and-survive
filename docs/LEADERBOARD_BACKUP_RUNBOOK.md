# Leaderboard Backup and Recovery Runbook

## Current deployment

- **Service:** Azure App Service (`stack-survive-leaderboard`)
- **Storage:** FileStorage at `/home/data/leaderboard.json`
- **Persistent path:** `/home/` survives restarts and redeploys
- **Replicas:** Single instance (required for file-based storage)

## Pre-demo backup

Before any demo or presentation:

```bash
# 1. Record current state
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
API=https://stack-survive-leaderboard.azurewebsites.net

curl -s "$API/api/health" | jq .
curl -s "$API/api/leaderboard?challenge=<hash>" | jq '.entries[:10]'

# 2. Download leaderboard data via Kudu/SSH
# Azure Portal -> App Service -> SSH
cat /home/data/leaderboard.json | jq . > /tmp/leaderboard-backup-$TIMESTAMP.json

# 3. Save locally
# scp or copy from Azure SSH session
```

Record alongside the backup:
- API URL
- Backend build SHA (from health `version` field)
- Health response (storage mode, uptime)
- Top 10 entries
- CORS allowed origins
- Pages resolved origin
- Timestamp

## Recovery procedures

### Scenario 1: Bad code deployment

1. Redeploy the previous known-good ZIP package
2. `/home/data/leaderboard.json` is preserved across deploys
3. Verify: `curl .../api/health` returns 200
4. Verify: Top 10 entries match pre-deployment snapshot

### Scenario 2: Corrupted leaderboard data

The server automatically quarantines corrupt files on startup, renaming them to `leaderboard.json.corrupt.<timestamp>`.

**Do NOT delete `leaderboard.json` as the first recovery step.**

Recovery sequence:

1. Stop accepting new submissions if necessary (scale to 0 instances or block POST at App Service networking level)
2. SSH into the App Service via Azure Portal
3. Preserve the current file:
   ```bash
   cp /home/data/leaderboard.json /home/data/leaderboard.json.bak.$(date +%s)
   ```
4. Check quarantine directory for auto-preserved copies:
   ```bash
   ls -la /home/data/leaderboard.json.corrupt.*
   ```
5. Inspect the backup to determine if data is recoverable:
   ```bash
   cat /home/data/leaderboard.json | python3 -m json.tool 2>&1 || echo "INVALID JSON"
   ```
6. Restore known-good backup:
   ```bash
   cp /home/data/leaderboard-backup-<timestamp>.json /home/data/leaderboard.json
   ```
   Or intentionally reset only with owner approval:
   ```bash
   echo "[]" > /home/data/leaderboard.json
   ```
7. Restart the App Service:
   ```bash
   az webapp restart --name stack-survive-leaderboard --resource-group <rg>
   ```
8. Verify:
   ```bash
   curl .../api/health
   curl ".../api/leaderboard?challenge=<hash>" | jq '.entries[:10]'
   ```

### Scenario 3: Instance loss / migration

1. Create new App Service (Node 22 LTS)
2. Set environment variables (see LEADERBOARD_DEPLOYMENT.md)
3. Upload saved backup to `/home/data/leaderboard.json`
4. Deploy `dist/server.js`
5. Verify health and Top 10

## Restart persistence verification

After any restart, verify entries survive:

```bash
# Record before restart
curl -s ".../api/leaderboard?challenge=<hash>" | jq '.entries | length'

# Restart
az webapp restart --name stack-survive-leaderboard --resource-group <rg>

# Wait for health
until curl -sf .../api/health > /dev/null; do sleep 5; done

# Verify entries are identical
curl -s ".../api/leaderboard?challenge=<hash>" | jq '.entries | length'
```

## Important warnings

- **Never** delete `/home/data/leaderboard.json` without preserving a backup first
- **Never** run multiple replicas with file-based storage
- The server startup validates entries and silently filters invalid ones (logged as warnings)
- Quarantined files are not automatically cleaned up -- review and remove periodically
