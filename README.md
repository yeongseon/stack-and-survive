# Stack & Survive

> **Build. Scale. Keep the business flowing.**

Stack & Survive is a real-time cloud infrastructure management game where players scale and optimize Azure architecture as demand grows, keeping requests flowing, customers served, and costs under control.

## Project status

**Hackathon MVP — Core simulation locked · Tycoon presentation implemented · Human learning validation pending · PRD v0.6**

The [data-center reframe](docs/TYCOON_REFRAME_IMPLEMENTATION_PLAN.md) now includes the indoor facility, original production building sprites, directional processing lanes, representative App/SQL pressure, a four-concept HUD, on-demand analysis and separate Build/Manage tools. The reference image guides composition, not purchase prices or queue semantics. Pressure markers do not represent real buffered requests; this is not a pixel-identical reproduction of the reference art.

The browser MVP in `apps/web/` includes separate official Azure badges, state-driven processing effects, actual objectives/events, live interventions, pause/recovery, result analysis, redesign/comparison, local saves and contextual help. Ordinary player builds exclude developer diagnostics. Verification includes 172 unit/regression tests, 54 QA browser cases and six ordinary-player cases. Real first-time-player learning validation remains pending in #25. Hosting (including GitHub Pages) is deferred by the owner; no repository visibility or account-plan changes were made. There is no backend or outbound product telemetry.

## MVP

- One Black Friday scenario, targeting 3–4 minutes.
- Four deployable resources: App Service, Azure SQL, Cache, and WAF.
- Placement, directional connections, scale-out, and provisioning delays.
- Deterministic, renderer-independent simulation with data-driven scenarios.
- Live intervention, revenue, infrastructure cost, failure detection, and scoring.
- Explainable results, architecture redesign, replay, and browser-local persistence.

The MVP simulates Azure architecture concepts. It does **not** deploy real Azure resources, use real Azure performance data, or require a backend.

## Core loop

The primary player experience is demand → flow → pressure → expansion/optimization → observed business outcome. Results and redesign/replay support that loop. Better decisions can improve outcomes; more capacity alone does not guarantee more profit.

```text
Architecture Decision
        ↓
Traffic
        ↓
Observable Consequence
        ↓
Understanding
        ↓
Better Architecture
```

## Repository structure

```text
docs/
  PRD.md                 Product requirements v0.6
  GAMEPLAY_SPEC.md       Gameplay specification v0.4
  SIMULATION_SPEC.md     Simulation specification v0.2
  TECHNICAL_DESIGN.md    Technical design v0.3 (implemented structure)
  VISUAL_DIRECTION.md    Visual direction v0.3: data-center flow tycoon
  TYCOON_REFRAME_IMPLEMENTATION_PLAN.md  Reference image and sequential reframe plan
  IMPLEMENTATION_PLAN.md Delivery phases and pre-implementation gates
  adr/
    ADR-002-GAME-ENGINE.md Engine experiment evidence (Accepted: Phaser 3.90.0)
apps/
  engine-spike/          Disposable two-engine experiment and tests
  web/                   React/Phaser editor, gameplay, results and local saves
packages/
  schema/                Shared schemas and validation primitives
  cloud-domain/          Azure resource roles and architecture validation
  simulation/            Deterministic simulation and reference regressions
  scenarios/             Versioned Black Friday content
```

From the repository root with Node 22.22.0 and pnpm 10.32.1: `pnpm install --frozen-lockfile`, then `pnpm dev` for development. For ordinary play use `pnpm build` followed by `pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1`; open the printed URL. Inspect or edit the infrastructure, wait for provisioning, then Start operation. Redesign & Retry preserves your architecture and compares attempts. Reset restores the one-instance baseline; saves never resume runtime progress.

Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Install Chromium with `pnpm exec playwright install chromium`, then `pnpm test:player` tests ordinary `dist` on port 43874 using real-time gameplay. Next run `pnpm build:qa` and `pnpm test:browser`; separate `dist-qa` on port 43872 enables the inspector for full regressions. CI runs both variants in this order. Player screenshots live under ignored `test-results-player/`; QA screenshots/traces use `test-results/`. Only development and compile-time `qa` contain JSON/manual-step/renderer diagnostics; URL parameters cannot enable them in production. Do not deploy `dist-qa`. Run `pnpm build:qa` before `pnpm test:performance` too. Software-WebGL tests verify behavior, not hardware FPS.

For a separate local GPU measurement on macOS, run `pnpm build:qa` then `pnpm test:performance`. It uses full Chromium with ANGLE Metal on port 43873, prints the actual WebGL renderer, and samples 20 seconds of peak traffic. The configuration is not a portable CI FPS gate. Reframe measurements on an M1 Pro MacBook Pro with 32 GB RAM, Chromium 153.0.8010.12, 1440×900 at DPR 1 used `ANGLE Metal Renderer: Apple M1 Pro`: two runs at 60.0194 and 60.0212 FPS, p95 frame interval 16.8 ms, at most 62 representative packets and 20 simulation ticks per sample. Each rendered 1,201 frames over approximately 20.010 seconds. These include production sprites, processing effects and the new HUD/drawers. They are single-machine measurements, not guarantees for other hardware or mobile devices.

Visual acceptance screenshots are regenerated by `pnpm test:player` at 320, 390, 1024, 1440 and 1920-pixel widths and by the QA suite for actual SQL overload, Cache/WAF behavior, reduced motion and label collisions. The protected cached scene does not fabricate a SQL bottleneck: the separate four-instance, uncached reference run demonstrates real SQL overload. The desktop test requires at least 75% world area within the playfield with analysis closed, not within the entire document. Very short screens scroll to actions rather than clipping facility badges; this is not a native-mobile redesign.

## Run the engine experiment

From `apps/engine-spike/`, run `pnpm install --frozen-lockfile`, then `pnpm dev --port 43871 --strictPort`. Open `http://127.0.0.1:43871/` and use the renderer selector to compare the two views.

Use Node 22.22.0 and pnpm 10.32.1. Verification commands and limits are documented in [ADR-002](docs/adr/ADR-002-GAME-ENGINE.md#reproduction-and-evidence). This is a synthetic rendering experiment, not playable Black Friday.

## Documents

- [Product Requirements Document](docs/PRD.md) — Product scope, flow-management principles, and acceptance criteria (v0.6).
- [Gameplay Specification](docs/GAMEPLAY_SPEC.md) — Player-facing flow-management experience (v0.4).
- [Simulation Specification](docs/SIMULATION_SPEC.md) — Corrected simulation rules, authoritative values, and arithmetic reference matrix (v0.2).
- [Technical Design](docs/TECHNICAL_DESIGN.md) — Actual four-package structure, app-local controller/renderer/UI, and planned hosting (v0.3).
- [Visual Direction](docs/VISUAL_DIRECTION.md) — Data-center flow tycoon direction with separate official Azure identity (v0.3).
- [Tycoon Reframe Plan](docs/TYCOON_REFRAME_IMPLEMENTATION_PLAN.md) — Reference interpretation, delivery evidence and human-playtest handoff (v0.3). Original production PNGs and editable SVG sources are integrated; environment and effects remain procedural.
- [Asset provenance](apps/web/public/assets/ATTRIBUTION.md) — Original V24 Azure SVG sources, checksums, bundled terms and remaining usage-review limitations.
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Current reframe sequence and human-validation/deferred-hosting gates (v0.8); issues and labels, not milestones or a Project board.

The [ordered MVP backlog (#7)](https://github.com/yeongseon/stack-and-survive/issues/7) links all currently planned work. Prepare the backlog first, then execute one issue at a time in dependency order; individual issues are the source of status and completion evidence.
- [ADR-002: Game Engine Selection](docs/adr/ADR-002-GAME-ENGINE.md) — Executed comparison and accepted Phaser 3.90.0 decision.

`SIMULATION_SPEC.md` is the source of truth for numerical simulation behavior. `TECHNICAL_DESIGN.md` documents the architecture. The implemented local loop still requires human learning validation before demo-readiness claims; hosting requires separate authorization.

The owner explicitly added Visual Direction to the original six-document set. Further document expansion remains deferred unless requested. The headless engine passes the independent nine-configuration reference matrix and intervention/replay checks; browser tests exercise editing, pause/graphics recovery, live actions, local save recovery, results and Cache/WAF redesign. Automated checks do not establish that a first-time human understands the lessons. Phaser is accepted; human playtesting, Azure deployment and external telemetry retain separate approval/evidence gates.

## Important boundaries

- All capacities, costs, and timings are gameplay assumptions, not Azure specifications or pricing.
- AWS/GCP, accounts, multiplayer, AI features, regions, and real infrastructure deployment are out of scope.
- No third-party game assets, internal Microsoft data, or confidential telemetry should be added.
- Public release and license selection require review of applicable employer, IP, OSS, trademark, and Hackathon policies. No open-source license has been selected yet.
- Azure SVGs are separate, unchanged service-identification images, not project-owned art or the product logo. Integration follows the owner's explicit request; no separate Microsoft permission or policy clearance has been established. Review applicable use and distribution conditions before public release; source terms are preserved with the assets.
