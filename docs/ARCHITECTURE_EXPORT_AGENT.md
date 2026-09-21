# Architecture Export Agent — bounded verification and repair

Issue #322; follow-up to unmerged Export PR #316 on `feat/agentic-architecture-export`. **Not merged, deployed or verified against a live Azure model.** The AI Coach branch is unrelated and untouched. Local compiler fixtures and mocked model calls are explicitly not a live agent demo.

## What makes this agentic

The user provides a finished game architecture and a bounded goal: create equivalent infrastructure-as-code without changing the gameplay choices. Azure Responses function calls let the model choose `lookup_mapping` or `validate_export`. The latter performs real output-policy checking, local Bicep compilation and comparison of the compiled ARM to the supplied final architecture. Failed tool results are returned to the next model turn for correction. The server, not the model, decides completion.

Successful first attempts do not invent a repair. A failed candidate followed by a revised passing candidate records both. Plain assistant text/self-certification, unknown tools, extra tool arguments, parallel calls and repeated call IDs are rejected. No arbitrary shell, URL lookup, file path or deployment operation is exposed to the model. Encrypted provider reasoning context may be passed statelessly to the next turn, but summaries/internal reasoning are never returned to the browser.

## Contract and limits

An identical Bicep/parameters pair is not a repair: a repeated candidate hash is rejected without invoking the compiler again. The trace reports candidate checks, not a guarantee that the model improved every semantic property.

- New `POST /api/export-agent` uses the existing exact finished-run request DTO (numbers and allowlisted engine strings only). Existing `/api/export-bicep` remains available and unchanged for older clients.
- Uses the existing server-only Azure configuration, `store:false`, strict function schemas, `tool_choice: required`, `parallel_tool_calls:false`, manually supplied conversation items and `function_call_output`; no `previous_response_id`, persistence or new telemetry.
- Maximum **4 model turns**, **2 candidate validations**, **3500 output tokens per turn** (14,000 worst-case output allocation), **12 seconds per model call**, **8 seconds per compiler**, **60 seconds for the workflow**. Browser request timeout is 65 seconds. Longer/richer templates can fail closed under these limits; there is no hidden unbounded retry.
- **20,000-byte HTTP body**, shared **5 exports/IP/min** quota with the older export route and **2 concurrent agents per API process**. Multiple instances/IP rotation can still exceed these local protections; an operator needs provider/global spend controls before enabling public service.
- No compiler configuration or AI configuration: 503. Invalid request: 400/413. Origin/method/quota failure: 403/405/429. Unavailable model, unsupported tool, exhausted budget or validation failure: sanitized 502; compiler infrastructure failure can return 503.

Success returns `{ export, verification: { artifactSha256, attempts, steps } }`. `export` preserves the existing Bicep/parameters/resources/caveats schema. SHA-256 covers `JSON.stringify([bicep, parametersJson])` in UTF-8; the browser recomputes it before offering a download. This is artifact binding, not a signature or protection against a compromised server. A final answer cannot swap bytes after a passing compiler result: the server returns the exact validated candidate directly, without a post-validation model turn.

Failure may return `{ error, steps }`, containing only actually completed tool outcomes. Each step has allowlisted `tool`, `status` and `attempt`; no model narration, diagnostics/source or host path is displayed. Partial/failed output is not downloadable. The UI preserves score, history, primary result focus, retry and curated Learn links. Trace arrives after the request, not fake streaming progress.

## Local compiler boundary

`BICEP_CLI_PATH` must be an operator-approved absolute executable path. The application never installs/upgrades/downloads it and never calls Azure CLI or a shell. A per-candidate private `mkdtemp` directory contains only `main.bicep` and an app-authored `bicepconfig.json`; cleanup runs in `finally`. Invocation is fixed: `bicep build <temp>/main.bicep --stdout --no-restore`. No output file/deployment command is accepted from the model.

Before execution, both existing Export output filters and the stricter compiler-input policy reject modules/imports/extensions/providers, load-file functions, multiline strings/comments, URLs and list/reference functions. This deliberately rejects some valid general Bicep programs to keep the supported subset small. Input is <=12 KB. Compiler output is capped at 512 KB, timeout kills the process, child environment excludes Azure/API secrets and uses a temporary HOME. .NET heap is bounded at 256 MiB; this is **not a total OS memory/CPU guarantee**. Only BCP codes and line/column positions are fed back, not raw stderr, source excerpts or absolute paths.

`--no-restore` plus denied source constructs prevents normal registry/module fetches and compiler file-loading features. It is **not an OS sandbox or absolute egress guarantee**. Public enablement requires an approved patched compiler and deployment-level low-privilege/egress/resource isolation. The agent is off without explicit compiler configuration; CI success does not authorize installing one on App Service.

## What is actually checked

Compiled JSON must be a bounded, flat resource-group ARM resource list with exactly the allowed resources. No nested/conditional/copy resources, outputs, user functions or experimental templates. Checks include App plan SKU/Linux/instance count and generated plan reference; SQL SKU, Entra-only parameter references and readScale limitations; Managed Redis fixed SKU/protocol/cluster/port; WAF_v2 referencing the generated Prevention policy, static Standard public IP and required gateway configuration lists. Tags must identify this export/challenge. Current canonical tiers/counts, not proposed AI alternatives, are authoritative.

This is a **bounded property checker**, not a complete ARM semantic evaluator. Equivalent clever expressions may be rejected rather than evaluated. Compilation and matching properties do not guarantee deployment, tenant identity, SQL permissions, TLS certificates, private networking, regional SKUs, generated reasoning correctness or production security. App code is not deployed. GP read replicas remain a documented unsupported mapping; Business Critical readScale is not a literal replica-count guarantee. Human review is mandatory.

## Verification and remaining gate

Offline tests cover mapping/candidate tool choice, actual diagnostic handoff, bounded correction, exact-byte binding, rejected compiler capabilities, unknown/parallel/duplicate calls, quotas/concurrency, timeouts, partial failure traces, no-API behavior, stale UI responses and unchanged results. Real local compiler smoke:

```bash
BICEP_CLI_PATH=/absolute/approved/bicep \
  pnpm --filter @stack-and-survive/leaderboard-api exec tsx scripts/smoke-agent.ts
```

This runs hand-authored minimal and App/SQL/Redis/WAF fixtures through the actual compiler: intentional syntax failure → mocked repaired candidate → actual compile and architecture pass, plus wrong-capacity rejection. It never calls Azure or deploys. It proves orchestration/tool behavior, **not live model capability**.

Live gate remains: operator supplies approved Azure OpenAI deployment/settings and compiler, starts the local API and `VITE_LEADERBOARD_API=http://localhost:3001 pnpm dev`, plays a real run, chooses Export, records actual tool outcomes and verifies the downloaded artifact locally. Never print/commit secrets or claim success from mocked tool choices. No resources were created/configured by this implementation.

Official references: [Azure Responses](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses), [Structured Outputs](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs), [Bicep CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-cli), [Bicep compile-time file functions](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-files).
