# Leaderboard Threat Model

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
| CORS bypass | Origin allowlist, no wildcard | Standard browser enforcement | Preserve |
| IP spoofing via X-Forwarded-For | First value trusted when `TRUST_PROXY=true` | Azure infra controls header | Document limitation |

## Not in scope (Hackathon)

### AI export endpoint

Agent follow-up adds `/api/export-agent` on the same quota with strict allowlisted function tools and two concurrent workflows/process. An exact-byte hash binds the returned artifact to completed compilation/property checks, not to a trusted signature. The compiler is a fixed executable in a temporary directory, with no inherited Azure secrets, no restore, denied file/module/extension syntax, timeout/output/.NET heap limits and cleanup. This is not an OS sandbox: operator egress/low-privilege isolation and compiler patching are required before public enablement. See [full limits and residual risks](ARCHITECTURE_EXPORT_AGENT.md); compilation is never claimed as deployment/security approval.

`POST /api/export-bicep` is a post-run text-generation boundary. Export metrics are not replay-verified and never update scores/records.

| Threat | Mitigation | Residual risk |
|---|---|---|
| Cost/quota burn | Separate 5/IP/min, 20 KB UTF-8 body, 25 s upstream timeout, 2500 output tokens | No auth/global quota: rotated IPs can consume quota; operator spending/capacity controls remain necessary |
| Prompt injection | No player free text; allowlisted challenge/cause/action tokens and canonical tier fields; extra fields rejected | HTTP input remains untrusted; numeric claims can be forged; not replay verification |
| Unsafe/generated misinformation | Strict JSON schema plus structural/mapping/credential filters; client validation; escaped text | Numeric-token checks do not prove grounding or deployability; human review required |
| Secret exposure | Server-only settings; sanitized errors; redirects denied; no request/output logging | Provider retention/abuse monitoring follows Azure policy |
| Stored model/player state | `store:false`, no conversation ID, no export persistence/telemetry | Existing request counter and platform/provider operational logs remain separate |
| Cross-origin cost abuse | Allowlist and reject disallowed Origin before AI call | CORS is not auth; non-browser callers can omit/spoof Origin |

Only mandatory resource-declaration `@API-version` is allowed; URLs/modules/scripts/credential-looking Bicep are rejected. The inert parameters JSON schema URL is separately allowlisted. Returned code is never run. SQL uses Entra-only administrator parameters, with no generated credentials. GP read replicas require a caveat rather than unsupported `readScale`.

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
