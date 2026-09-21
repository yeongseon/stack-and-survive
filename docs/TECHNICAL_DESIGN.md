# Stack & Survive — Technical Design

## Infrastructure scaling integration (rules 0.4)

The existing shared runtime now supports deterministic App shrink/tier changes, SQL tier changes and SQL read replicas; [details](INFRASTRUCTURE_SCALING.md). Optional additive resource tier/replica fields survive parse/replay/history. One strict action parser is shared by runtime validation, saved action parsing, pending-submission validation and backend submission. Current challenge identity is version2/rules0.4; old rules retain distinct exports and storage keys.

Rendering reads pending changes and active resource state only. Optional tier textures use the V3 inventory and fall back to required base textures. `activeBuildingScale` applies SQL's active-tier 58/78/100% size consistently to sprites, anchors, lighting and hit bounds. Source supports 0.4 replay, but the configured production API still rejects current hashes (#306); source support is not deployment proof.

Version: 1.3. Based on main `faf5444` (runtime `c68ec0c`) plus draft Export PR #316. Browser-local game state remains authoritative; the optional Node API replays leaderboard submissions, not game ticks. This branch adds a stateless post-run AI proxy but is not a deployed feature. [Current status](CURRENT_STATUS.md) records the release boundary, incompatible deployed API and unresolved verification.

### AI boundary

The #322 follow-up adds a bounded tool loop, not autonomous gameplay. Azure Responses selects mapping or validation; failed real compiler/property results can prompt a revised candidate, at most twice. Server-side exact-artifact completion and browser SHA-256 verification precede downloads. Only actual tool names/outcomes are shown. The workflow remains stateless and independent of simulation, history and replay; [Architecture Export Agent](ARCHITECTURE_EXPORT_AGENT.md) owns limits, compiler isolation requirements and pending live-model evidence.

`azure-learn.ts` owns the fixed HTTPS Microsoft Learn destinations. The result lists only represented final resources plus Bicep guidance, independently of API configuration; generated resource explanations reuse the same allowlist. Links open with `noopener noreferrer`, with no click telemetry or AI-generated URL fields.

Export to Azure is an explicitly requested, post-run operation. Its input is bounded run numbers, final resource configuration and allowlisted engine strings/accepted action tokens; no nickname, prompt free text or per-tick stream is sent. The server validates all HTTP fields (even engine-derived values are untrusted over HTTP), uses Azure Responses Structured Outputs with `store:false`, then validates the returned JSON again. The browser also validates the response and renders it as escaped text. No AI output is executed or fed into runtime, score, replay, history or leaderboard calculations.

The only browser setting is the existing public `VITE_LEADERBOARD_API` origin. Azure OpenAI origin/key/deployment remain on the API. Requests are capped at 20 KB and 5/IP/min, with 25-second upstream timeout and sanitized failures; the panel fails independently of the result. Reasons cite supplied numeric evidence, but lexical checking cannot prove factual grounding. Bicep is a reviewed candidate scaffold, not proof of deployability or equivalence between gameplay tiers and Azure performance. Compilation, region/SKU availability, identity, networking, app code and integration remain the operator's responsibility. No telemetry or model conversation is stored by this implementation; provider abuse-monitoring/retention policy is separate from `store:false`.
Real model output is still unverified because AI resources/settings were absent. Offline compiled fixtures and green branch CI do not prove a live service. Keep AI Coach separate. `/api/export-bicep` and `ai` health fields are implemented on this branch, not in the deployed runtime until an authorized rollout.

## Architecture

```text
main.tsx — compile-time normal / QA boundary
 ├ ChallengeApplication (level selection, local progress/records)
 │ └ TycoonGame
 │  ├ TitleWorld (decorative SVG/CSS)
 │  ├ GameHUD
 │  ├ GameFloor (Phaser mount, shared navigation consumer, projected local actions and keyboard equivalents)
 │  ├ LearnDialog (help/metrics/concepts, explicit view and callbacks)
 │  ├ GameResult
 │  └ controller (external store, lifecycle, action intent)
 └ QA editor (BuildPanel, old HUD, comparison, persistence)
            ↓
schema + cloud-domain + scenarios → simulation runtime/economy/outcomes/results
            ↓ authoritative state and snapshots
resource-visual-state / traffic / pressure / business-feedback
            ↓
Phaser world — cached environment/lanes, buildings/bays,
               pooled packet images, effects, separate DOM Azure badges
```

Four shared workspace packages exist: `schema`, `cloud-domain`, `simulation`, `scenarios`. UI/orchestration/rendering are separate modules in `apps/web/src`, not mandatory extra packages. `apps/engine-spike` is an isolated historical experiment. Phaser 3.90.0 is accepted in [ADR-002](adr/ADR-002-GAME-ENGINE.md).

## State ownership and lifecycle

`createController` exposes subscribe/getSnapshot/commands. React uses `useSyncExternalStore`; dialogs and focus use local hooks. There is no Zustand store. Controller schedules preparation/runtime/countdown, queues intent, handles pause/reset/recovery and mode boundaries. Pure engine transitions own accepted actions, actual request processing, budget, losses and scores.

`TycoonGame` owns one controller instance and top-level entry/restart/dialog focus. `GameFloor` owns the asynchronous Phaser mount, observer cleanup, viewport-aligned input and selected-resource focus; changes to Learn do not remount it. `LearnDialog` receives a view, dialog ref and close/restart callbacks; it does not own game scheduling. These are app-local boundaries for subsequent quality work, not a new generic application framework. `player-boundaries.spec.ts` checks repeated inspection preserves the same canvas, Learn restart restores title focus, and a new run has exactly one fresh world.

`createSimulation`, `advanceSimulation`, `simulateScenario` run without browser APIs. Runtime validates monotonic action sequence and absolute activation ticks, including Cache/Edge deployment and atomic routing. Economy/outcomes/attribution/results own their calculations. [Simulation](SIMULATION_SPEC.md) specifies ordering and numeric comparison.

Player initialization uses fixed `tycoon-layout`. Title schedules no simulation; Start Game starts a five-second countdown. Generation/cancellation guards prevent stale callbacks after reset/unmount; errors halt progression and recovery resumes only the appropriate phase. Rendering cannot award capacity or revenue.

## Mode and persistence

`mode.ts` enables diagnostics only for development or explicit compile-time `qa`. Normal `dist` renders ChallengeApplication with a keyed TycoonGame; URL parameters cannot enable editor/JSON/manual steps. `dist-qa` defaults to editor with `?tycoon` available. Never deploy QA output as the ordinary game.

Normal player disables architecture persistence/manual edits. The QA shell is a full alternate application including redesign/comparison, not just diagnostics. QA `persistence.ts` implements a synchronous injected localStorage repository; controller startup automatically loads it and architecture changes automatically save when attached, alongside explicit Save/Clear controls. It validates the versioned architecture payload and surfaces corrupt/unavailable storage. It does not persist runtime/history/personal best. `comparison.ts` checks scenario/schema/balance identity and duration, with actual phase data for qualified comparisons; cheap short failures are not equivalent efficiency evidence.

`scenarios/challenge` (#153) owns immutable validated conditions, deterministic canonical identity and survive/availability objective evaluation. `createController` accepts an optional fourth challenge input (default Black Friday); its View and terminal result retain that challenge. Controller simulation calls, player HUD/pressure/guide, events and result labels use the injected workload. Terminal results additionally retain the actual initial architecture and ordered action outcomes, so replay does not start from the upgraded final architecture. Comparisons reject unlike complete challenge conditions and mixed legacy/new identity.

`ChallengeApplication` offers the three-objective ladder with separate validated local progress. `useRunHistory` records terminal results once and handles storage failure without interrupting play. `run-history.ts` retains 20 attempts plus eligible bests, validates provenance by replay and compares exact conditions, using balance-0.4 keys. Resetting records does not reset progression/settings. Descriptive profiles and richer result/comparison UI (#157/#158) are implemented; see [Run history](RUN_HISTORY.md) and [Operation report](OPERATION_REPORT.md).

## Renderer and coordinates

`world.ts` asynchronously mounts Phaser, subscribes to views, forwards permitted input and returns cleanup. **Camera is presentation state, not runtime state.** TycoonGame owns one player-navigation external store shared by GameFloor and Phaser. Native camera applies effectiveZoom/canonical center to fixed2400×1350 geometry exactly once; plaques/badges use the same worldToScreen transform and hits use screenToWorld. Viewport changes do not reflow facilities, art scale or environment. World-target derivation reads actual resources/bays; release-only taps resolve through existing controller contracts. Pan/pinch/cancel cannot create actions. QA retains its original viewportCamera/project/unproject path. No distance changes throughput/latency.

The parent orchestrates renderer-ready Fit→operational opening before calling existing beginGame/countdown. A presentation Clock adapter holds startup callbacks during hidden PREPARATION or portrait gate; orientation pauses RUNNING through the existing controller and remembers whether it interrupted gameplay. Continue never undoes a prior manual Pause. Fullscreen/landscape lock is best-effort user-gesture enhancement; stale completions are invalidated on restart/unmount. See [implemented camera lifecycle](PLAYER_CAMERA.md). Engine state/actions/scoring remain unchanged.

Navigation-only state is excluded from geometry/texture regeneration signatures. Frame effects are separate from transformed world effects; input listeners/captures are disposed with the world. `construction-art` projects accepted remaining/due ticks into scaffold/boot/progress marks without owning timers or active capacity. Environment plinths add decorative depth only. GameResult's first layer shows outcome and replay; native Details retains prior analytical evidence and record semantics.

Production uses the original V3 facilities registered in `art/v3/runtime-inventory.json`, with bounds/module offsets derived from their exported source. V3 constructs the fixed hall's 72 decorative equipment images once, grouping cooling, racks and power equipment rather than repeating uniform rows. Camera-only changes do not rebuild these objects. Structures/lanes retain meaningful signature caches. QA/editor keeps the earlier PNG/procedural fallback path; missing required V3 textures stop the player renderer with a recoverable error rather than inventing partial capacity. `resourceVisualState` separates installation/pressure/activity.

`V3Sprites` displays only real active App modules, independent empty/queued/construction layers, tick-derived construction progress, measured per-bank SQL warnings and actual hit/filter activity. Duplicate generic effects are not painted over V3 layers. Activation cues use the newly active App bay, remain deduplicated and static under reduced motion. Selected local-action panels prefer space beside the projected building and clamp to the viewport; their cost/delay/eligibility still come from controller contracts.

`PacketSprites` builds reusable class/endpoint textures and pools at most 200 images. Flow sampling stays bounded; packets are not requests. Do not re-tessellate rounded geometry per packet per frame. Preserve Cache/Edge/loss provenance, dynamic reduced-motion preferences and offscreen render-only culling. Dispose observers/subscriptions/timers/containers on shutdown. Phaser owns packet animation, not a React-per-frame layout loop.

TitleWorld is bounded decorative SVG/CSS without controller calls; unmount removes it on entry. Its illustration is not an initial architecture save.

## Assets

Editable V3 generators and exported SVG sources live under `art/v3/`; approved production PNGs live under `apps/web/public/assets/v3/`. `check:assets:v3` verifies source/PNG/manifest/geometry identity. The old `art/buildings` sources remain for QA/editor compatibility. Official Azure SVG import is pinned/hash checked; badges stay separate and unchanged. [Attribution](../apps/web/public/assets/ATTRIBUTION.md) and [V3 provenance](../art/v3/PROVENANCE.md) record original authorship and the explicitly expanded, exact-inventory Pages demo exception. General rights remain unresolved; no blanket code license covers third-party assets.

## Verification/tooling

Baseline toolchain: Node 22.22.0, pnpm 10.32.1, TypeScript 5.9, React 19, Vite 6, Phaser 3.90, Vitest 4 and Playwright; manifests/lockfile pin exact versions.

| Command | Purpose and artifact |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | Static/headless regressions |
| `node --test scripts/work-item-format.test.mjs` | Work-item format checks |
| `pnpm build` then `pnpm test:player` | Real-time normal game; 43874; `test-results-player/` |
| `pnpm build:qa` then `pnpm test:browser` | Editor/player integration; 43872; `test-results/` |
| `pnpm build:qa` then `pnpm test:performance` | Disclosed macOS ANGLE Metal backend; 43873; `test-results-performance/` |

PR #140 passed 192 unit / 61 QA / seven player cases. Preserve coverage, not merely counts. Hardware results around 60 FPS on one M1 Pro are not universal or SwiftShader performance claims. Distinct output folders prevent concurrent artifact deletion.

Quality CI checks templates/static/unit/build, both browser modes and the project-path Pages build. A separate `pages.yml` workflow deploys only after successful Quality on the current main push; it checks main SHA and the exact owner-approved asset inventory, builds production `dist-pages` with `/stack-and-survive/`, then deploys via the Pages environment. PR code cannot deploy. No Azure resources are provisioned. PR-body checks run trusted base code, not privileged untrusted PR code. [Demo exception](PAGES_DEMO_EXCEPTION.md) and [Engineering Rules](ENGINEERING_RULES.md) define the boundaries.

## Security and deferred architecture

No secrets, customer telemetry or private platform information belongs in client code. #164 tracks rights; public visibility is not clearance. Pages serves the approved frontend; the optional API handles replay verification and persistent ranking, not game state. Current backend compatibility is blocked (#306). This branch's optional stateless export stores no player telemetry and creates no Azure resources; cloud configuration still needs separate authorization.

Additional protocol/observability packages and alternate hosting/storage require concrete need and approval. The existing leaderboard is not a future-only feature. Export/AI remains draft-only as described above; no cloud provisioning follows from a UI or documentation change.
