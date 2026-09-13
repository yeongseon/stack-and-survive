# Engineering rules

Current authority: [docs index](README.md). These guardrails apply to human and AI-assisted changes; archive content cannot authorize obsolete behavior.

## Change discipline

| Change | Required approach |
|---|---|
| Simulation truth / balance | Test first; explicit contract/approval; unchanged legacy reference or intentional new version |
| Shared schema, persistence, observability protocol | Test first; validation, compatibility, migration and deterministic serialization |
| Presentation / assets / animation | Evidence first; real reachable fixtures and screenshot inspection, then regression/performance checks |
| Human learning / replayability | Actual participant observations; no synthetic substitution |
| Licensing / public release | Recorded owner and relevant human review; no AI legal-clearance claims |

Inspect code before assumptions. Separate current behavior, proposed design and accepted implementation. Do not mutate engine output to make a screenshot match a concept. Do not introduce queues, costs or services because a reference image shows them.

## Implementation boundaries

- Pure simulation cannot import React, Phaser, DOM or localStorage. UI/renderer cannot decide authoritative throughput, economics or failure.
- Preserve pending versus active state, exact activation tick, direct SQL write path, no-FIFO behavior and budget/revenue distinction.
- Keep normal player and QA editor separate; query parameters cannot turn production diagnostics on.
- Reuse explicit controller commands and stable subscriptions; clean up timers/observers/graphics/audio and guard reset/unmount races.
- No suppressed type errors, empty catch blocks or deleted failing assertions. Explain intentional test-budget changes with observed evidence; fix root performance costs instead of repeatedly increasing every timeout.
- Bounded representative particles/records/events; no React-per-frame DOM layout loop or unbounded history/emitter.
- Do not add backend/packages/dependencies merely to match a diagram. Do not provision paid resources or change licenses without approval.

## Test evidence

Use the commands and artifact separation in [Technical Design](TECHNICAL_DESIGN.md). Static/unit tests precede browser acceptance. Exercise current production and preserved QA. Test missing assets/storage/API support, duplicate inputs, exact action boundaries, pause/recovery/reset and reduced motion. Report skipped/unavailable tests rather than imply a pass.

Visual evidence must identify architecture, tick/status, viewport and motion preference. Measure real GPU backend/workload separately from software-WebGL CI. Repeated rendered frames do not imply new rewards. Canonical fixtures retain exact action/sequence and version identity.

## Work items and Git

Use [.github/WORK_ITEM_GUIDE](../.github/WORK_ITEM_GUIDE.md) and repository issue/PR templates. Validate bodies before posting; preserve historical original records. Issues + labels only; one primary implementation issue in progress. Obtain actual CI success before merge/closure; no skip hooks, destructive history rewrite or force push to work around server failure.

User work and named paused stashes are not disposable. Keep changes focused and document cross-issue integration if required. After merge, clear stale active labels and update tracker bodies, not only comments. A passing technical child does not close an epic whose human acceptance remains open.

## Privacy and public source

No credentials, customer data or confidential employer material in files, logs, screenshots, prompts or issues. Use read-only and filename/redacted findings for secret triage; never paste a detected token. Security scans are limited evidence, not proof of absence. External telemetry must have reviewed purpose/data fields/consent and must not upload per-second simulation streams by default.
