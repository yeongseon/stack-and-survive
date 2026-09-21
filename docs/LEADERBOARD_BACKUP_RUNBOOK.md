# Leaderboard Backup and Recovery Runbook

## Current deployment

- **Service:** MCAPS Azure App Service `stack-survive-mcaps-ychoe`, resource group `rg-stack-survive`
- **Storage:** FileStorage at `/home/data/leaderboard.json`
- **Persistent path:** `/home/` is intended persistent storage; actual restart-event durability evidence is still required
- **Replicas:** Single instance (required for file-based storage)

## Pre-demo backup

Read [current status](CURRENT_STATUS.md) first: current 0.4 reads are blocked (#306), deployment access returned 403, and backup/restart instructions are not proof or authorization to execute them. Preserve raw backups privately; never commit public-board data or credentials.

Before any demo or presentation:

```bash
# 1. Record current state
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
API=https://stack-survive-mcaps-ychoe.azurewebsites.net

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

1. Arrange authorized maintenance and stop/block writes through the approved operational path; do not assume scaling the App Service plan to zero is available.
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
    az webapp restart --subscription <confirmed-mcaps-subscription-id> --name stack-survive-mcaps-ychoe --resource-group rg-stack-survive
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
az webapp restart --subscription <confirmed-mcaps-subscription-id> --name stack-survive-mcaps-ychoe --resource-group rg-stack-survive

# Wait for health
until curl -sf .../api/health > /dev/null; do sleep 5; done

# Compare complete entries/identities/ranks to the saved snapshot; count alone is insufficient
curl -s ".../api/leaderboard?challenge=<hash>" | jq '.entries | length'
```

## Important warnings

- **Never** delete `/home/data/leaderboard.json` without preserving a backup first
- **Never** run multiple replicas with file-based storage
- The server startup validates entries and silently filters invalid ones (logged as warnings)
- Quarantined files are not automatically cleaned up -- review and remove periodically
