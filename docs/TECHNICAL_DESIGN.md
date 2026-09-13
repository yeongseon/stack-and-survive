# Stack & Survive — Technical Design

Version: 1.0. Implemented baseline PR #140 / `816a7a5`. Browser-local TypeScript/React/Phaser. Hosting and outbound product telemetry are deferred; public GitHub is not a deployed game service.

## Architecture

```text
main.tsx — compile-time normal / QA boundary
 ├ TycoonGame
 │  ├ TitleWorld (decorative SVG/CSS)
 │  ├ GameHUD, BuildPad, local cards, Learn
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

`createSimulation`, `advanceSimulation`, `simulateScenario` run without browser APIs. Runtime validates monotonic action sequence and absolute activation ticks, including Cache/Edge deployment and atomic routing. Economy/outcomes/attribution/results own their calculations. [Simulation](SIMULATION_SPEC.md) specifies ordering and numeric comparison.

Player initialization uses fixed `tycoon-layout`. Title schedules no simulation; Start Game starts a five-second countdown. Generation/cancellation guards prevent stale callbacks after reset/unmount; errors halt progression and recovery resumes only the appropriate phase. Rendering cannot award capacity or revenue.

## Mode and persistence

`mode.ts` enables diagnostics only for development or explicit compile-time `qa`. Normal `dist` renders TycoonGame; URL parameters cannot enable editor/JSON/manual steps. `dist-qa` defaults to editor with `?tycoon` available. Never deploy QA output as the ordinary game.

Normal player disables architecture persistence/manual edits. The QA shell is a full alternate application including redesign/comparison, not just diagnostics. QA `persistence.ts` implements a synchronous injected localStorage repository; controller startup automatically loads it and architecture changes automatically save when attached, alongside explicit Save/Clear controls. It validates the versioned architecture payload and surfaces corrupt/unavailable storage. It does not persist runtime/history/personal best. `comparison.ts` checks scenario/schema/balance identity and duration, with actual phase data for qualified comparisons; cheap short failures are not equivalent efficiency evidence.

Future full challenge identity, run history and profiles belong to #153–#158, not existing APIs. Preserve original initial architecture and action schedule for replay; final architecture is not the initial state.

## Renderer and coordinates

`world.ts` asynchronously mounts Phaser, subscribes to views, forwards permitted input and returns cleanup. Player canvas/hit testing/DOM pads share `tycoonPoint` responsive anchors. QA retains `viewportCamera` and paired `project/unproject`. Distances do not change latency/throughput.

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

CI checks templates/static/unit/build and both browser modes; it does not deploy Azure or Pages. PR-body checks run trusted base code, not privileged untrusted PR code. [Engineering Rules](ENGINEERING_RULES.md) defines change gates.

## Security and deferred architecture

No secrets, customer telemetry or private platform information belongs in client code. The public repo has licensing/security review tracked in #164; public visibility is not policy clearance. There is no backend, outbound product analytics or chosen hosted production service.

Protocol/observability packages, Azure Static Web Apps/Functions/Container Apps/Redis/Cosmos and online features are future options requiring concrete need and approval. Do not provision services to make a cloud-themed game appear more cloud-native.
