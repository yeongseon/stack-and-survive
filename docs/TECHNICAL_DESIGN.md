# Stack & Survive — Technical Design

Version: 1.1. Browser-local TypeScript/React/Phaser, with an owner-authorized static GitHub Pages demo. No game backend or outbound product telemetry. Public source and demo hosting do not imply general release rights approval.

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

`ChallengeApplication` offers the approved three-objective ladder with separate validated local completion progress. `useRunHistory` records terminal results once and handles storage failures without interrupting gameplay. `run-history.ts` retains 20 recent attempts plus independent eligible bests, validates full provenance by engine replay at load/write boundaries, and compares only exact challenge conditions. Resetting records does not reset progression or other settings. See [Run history](RUN_HISTORY.md); profiles and richer replay results remain #157/#158.

## Renderer and coordinates

`world.ts` asynchronously mounts Phaser, subscribes to views, forwards permitted input and returns cleanup. **Camera is presentation state, not runtime state.** TycoonGame owns one player-navigation external store shared by GameFloor and Phaser. Native camera applies effectiveZoom/canonical center to fixed2400×1350 geometry exactly once; plaques/badges use the same worldToScreen transform and hits use screenToWorld. Viewport changes do not reflow facilities, art scale or environment. World-target derivation reads actual resources/bays; release-only taps resolve through existing controller contracts. Pan/pinch/cancel cannot create actions. QA retains its original viewportCamera/project/unproject path. No distance changes throughput/latency.

The parent orchestrates renderer-ready Fit→operational opening before calling existing beginGame/countdown. A presentation Clock adapter holds startup callbacks during hidden PREPARATION or portrait gate; orientation pauses RUNNING through the existing controller and remembers whether it interrupted gameplay. Continue never undoes a prior manual Pause. Fullscreen/landscape lock is best-effort user-gesture enhancement; stale completions are invalidated on restart/unmount. See [implemented camera lifecycle](PLAYER_CAMERA.md). Engine state/actions/scoring remain unchanged.

Navigation-only state is excluded from geometry/texture regeneration signatures. Frame effects are separate from transformed world effects; input listeners/captures are disposed with the world. `construction-art` projects accepted remaining/due ticks into scaffold/boot/progress marks without owning timers or active capacity. Environment plinths add decorative depth only. GameResult's first layer shows outcome and replay; native Details retains prior analytical evidence and record semantics.

Environment redraws on viewport change; structures/lanes use a meaningful signature cache. Original building PNGs have measured alpha anchors/bounds and procedural fallback. `resourceVisualState` separates installation/pressure/activity. Active servers, empty sockets and construction are distinct, never extra capacity.

`PacketSprites` builds reusable class/endpoint textures and pools at most 200 images. Flow sampling stays bounded; packets are not requests. Do not re-tessellate rounded geometry per packet per frame. Preserve Cache/Edge/loss provenance, dynamic reduced-motion preferences and offscreen render-only culling. Dispose observers/subscriptions/timers/containers on shutdown. Phaser owns packet animation, not a React-per-frame layout loop.

TitleWorld is bounded decorative SVG/CSS without controller calls; unmount removes it on entry. Its illustration is not an initial architecture save.

## Assets

Editable originals: `art/buildings/*.svg` and `bounds.json`. Export: `scripts/export-building-sprites.mjs`. Official Azure SVG import is pinned/hash checked; badges remain separate and unchanged. [Attribution](../apps/web/public/assets/ATTRIBUTION.md) records actual provenance; [Asset Strategy](ASSET_STRATEGY.md) defines future sourcing. No blanket code license covers third-party assets.

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

No secrets, customer telemetry or private platform information belongs in client code. The public repo has licensing/security review tracked in #164; public visibility is not policy clearance. GitHub Pages serves the approved static demo; there is no game backend, outbound product analytics or broader hosted production service beyond that exception.

Protocol/observability packages, Azure Static Web Apps/Functions/Container Apps/Redis/Cosmos and online features are future options requiring concrete need and approval. Do not provision services to make a cloud-themed game appear more cloud-native.
