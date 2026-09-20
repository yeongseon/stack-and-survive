# Leaderboard Threat Model

Scope: merged leaderboard API, not draft Export #316. See [current deployed compatibility and draft boundary](CURRENT_STATUS.md). No AI endpoint or model credentials are present in main.

## Overview

The global leaderboard accepts player action schedules, replays them through the deterministic simulation engine, and stores server-computed authoritative scores. It does not trust any score sent by the browser.

## Threat matrix

| Threat | Current mitigation | Residual risk | Future option |
|---|---|---|---|
| Fake/inflated score | Server-side deterministic replay | Low -- score is never client-provided | Preserve |
| Modified actions | Action validation + replay verification | Crafted valid strategies allowed (intended) | Expected behavior |
| Duplicate submission | `clientRunId` idempotency check | Intentional new IDs possible | Rate limiting |
| Nickname abuse | ASCII alphanumeric whitelist (2-16 chars) | Offensive ASCII names possible | Moderation later |
| Spam submissions | Per-IP rate limiter (10 POST/min) | Proxy/VPN IP rotation | Stronger limiter later |
| Huge request body | 200KB body limit, 500 action limit | Bounded | Preserve |
| Unknown challenge | Challenge allowlist from ladder | Low | Preserve |
| Storage corruption | Quarantine + atomic writes | Backup still needed | Automated backup |
| Instance loss | Persistent `/home/` on App Service | Single-instance limitation | Azure-native DB later |
| Cross-origin access | Origin allowlist, no wildcard response header | CORS is not auth or a server-side write guard; non-browser callers can submit | Separate authorization if needed |
| IP spoofing via X-Forwarded-For | Socket IP unless `TRUST_PROXY=true`, then first forwarded value | Safe only when trusted proxy sanitizes client-supplied values; verify actual ingress behavior | Stronger trusted-proxy validation |

## Not in scope (Hackathon)

The following are explicitly out of scope and should not be added before submission:

- Login / OAuth / accounts
- CAPTCHA
- Admin portal / reset endpoint
- Multiplayer / real-time
- Analytics / telemetry

## Key security property

> The leaderboard never trusts a score sent by the browser.
> The server replays the player's architecture decisions through the same
> deterministic simulation engine and calculates the authoritative score.
