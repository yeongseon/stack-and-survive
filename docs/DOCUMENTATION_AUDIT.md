# Documentation synchronization audit

Issue #320 · reviewed 2026-09-21 against main/runtime `c68ec0c`. Inventory: **92 tracked Markdown documents** before this refresh, plus this audit and [CURRENT_STATUS](CURRENT_STATUS.md). This is a documentation/code/release cross-check, not fresh human acceptance or legal review. Runtime source, art, media bytes, PDF and historical numeric measurements are unchanged.

## Authority and evidence checked

- Source: cloud-domain tier/instance/replica definitions, challenge/ladder identities, run-history/progress keys, controller actions, final architecture/report UI, scaling controls, service guide and active-tier geometry.
- Deployment: exact-main Quality 35517501080; actual Pages build/deploy 35522927900 for `c68ec0c`. A duplicate successful workflow with a skipped deploy is not counted.
- Pending implementation: draft #316/head `5ed4b9e` is not main. Its 718 tests, stricter API typecheck, Bicep export and curated Learn links remain branch-only; actual AI smoke needs resources/settings and human review.
- Operations: configured MCAPS origin, current 0.4 rejection (#306), file storage/one-instance limit, deployment access 403 and unproven restart event. No cloud writes or public test submissions were performed by this docs update.

## Coverage and disposition

| Document group | Files covered | Disposition |
|---|---|---|
| Entry/coordination | `README.md`, `INTEGRATION_NOTES.md`, `docs/README.md`, `apps/web/src/DESIGN.md` | Align current entry points, integrated work and draft boundaries. |
| Product/rules | `PRD`, `GAMEPLAY_SPEC`, `SIMULATION_SPEC`, `INFRASTRUCTURE_SCALING`, `CHALLENGE_SYSTEM`, `RUN_HISTORY`, `REPLAYABILITY_DESIGN`, `ARCHITECTURE_PROFILES`, `OPERATION_REPORT`, `WORLD_GUIDE`, `PLAYER_GUIDE` | Correct active controls/versions/storage keys/profile status; retain accurate profile thresholds and legacy arithmetic. |
| Plans/visuals | `PRODUCT_ROADMAP`, `IMPLEMENTATION_PLAN`, `VISUAL_DIRECTION`, `RESOURCE_VISUAL_STATES`, `PLAYER_CAMERA`, `PLAYER_CAMERA_AND_WORLD_INTERACTION` | Remove active no-scale-in/no-SQL claims; distinguish retired #132 from delivered #305 and archived #245 from runtime art. |
| Technical/development | `TECHNICAL_DESIGN`, `DEVELOPMENT`, `simulation-metrics`, `SUBMISSION_TECHNICAL_NOTES` | Existing API versus local game state; no measured CPU/p95 claim; current commands, renderer, scaling and pending AI. |
| API/operations | `LEADERBOARD_ARCHITECTURE`, `LEADERBOARD_API_CONTRACT`, `LEADERBOARD_DEPLOYMENT`, `LEADERBOARD_BACKUP_RUNBOOK`, `LEADERBOARD_THREAT_MODEL` | Correct retry semantics, MCAPS address, proxy/CORS limitations and source-versus-deployed contract. No unauthorized restart instructions implied. |
| Historical numeric/API records | `ARCHITECTURE_STRATEGY_BALANCE`, `BALANCE_REPORT`, `SCALE_IN_EVALUATION`, `BACKEND_PRODUCTION_EVIDENCE`, `LEADERBOARD_DEMO_EVIDENCE` | Add explicit historical/supersession notices; do not recalculate observations or turn retention into restart proof. |
| Presentation | `DEMO_VIDEO`, `showcase/README.md`, `showcase/SPEAKER_NOTES.md`, all 12 `docs/submission/*.md`, `docs/images/README.md` | Current status pointers, honest media sources and scaling/AI Q&A. Blank participant forms, image provenance and fixed historical records retain their original evidence. |
| Asset/rights | `ASSET_STRATEGY`, `azure-assets`, `LICENSING_STATUS`, `PAGES_DEMO_EXCEPTION`, `art/v3/PROVENANCE.md`, `apps/web/public/assets/ATTRIBUTION.md` | Update current code-synthesis/visual descriptions; preserve licenses, authorizations, source hashes and unapproved-rights boundaries. No third-party notices rewritten. |
| Workstream history | `docs/workstreams/azure-visual-experience.md`, `azure-operations.md` | Mark delivered historical work and preserve baseline counts/captures. |
| Unchanged guardrails | `CONTRIBUTING.md`, `ENGINEERING_RULES`, `AUDIO_FEEDBACK`, `GAME_DESIGN_REFERENCES`, four `.github/*.md` work-item templates/guides | Existing workflow/privacy/manual-evidence rules remain applicable; no approval fabricated. |
| Historical design/ADR | six `docs/archive/*.md`, `docs/adr/ADR-002-GAME-ENGINE.md` | Preserve designs, benchmarks and accepted decision; repair the ADR's obsolete technical-design anchor only. Archives remain non-authoritative for current controls. |
| External-art candidate history | nine `art/candidates/external/**/{README,SOURCE}.md`, experiment root README and eight `art/experiments/external-art-spike/reports/*.md` | Preserve source/license/iteration records; not adopted production art, current plans or new rights approval. |

Names without paths/extensions in the table refer to `docs/<name>.md`. “Covered” includes classification and targeted claim/link checks; immutable archives are not re-executed experiments or newly approved designs.

## Validation procedure

1. Inventory tracked Markdown and compare active current-behavior claims against implementation, especially scale-in, SQL tiers/replicas, defaults, history keys and API idempotency.
2. Check Markdown relative destinations and local anchors outside code fences. Historical examples/archived generated artifacts are classified separately; local links to nonexistent files are not silently called valid.
3. Run `git diff --check`; confirm the diff changes Markdown only. Re-run the showcase layout/link check because presenter notes/index links changed; do not regenerate immutable historical video/PDF merely to produce a new timestamp.
4. Preserve counts and measurements under their original SHA. No tests from the draft AI branch are attributed to main.

## Ongoing maintenance

Link-check result: 94 Markdown files and 395 local links checked; the one obsolete ADR anchor was repaired. No missing local targets or unresolved checked Markdown anchors remain. No remote availability or legal approval is inferred from this local check.

Update `CURRENT_STATUS.md` when implementation merges or a new actual deployment/service check changes evidence. A docs-only commit after `c68ec0c` does not change that runtime baseline. Feature-specific contracts own details; the status page owns delivery state. When #316 merges, reconcile its overlapping docs rather than preserving contradictory “draft” and “live” statements. Human/audio/rights/event gates stay open until their own required evidence exists.
