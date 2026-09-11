# Stack & Survive

> **Your architecture is your defense.**
>
> Build the cloud. Survive the traffic.

Stack & Survive is a cloud architecture strategy game where players build and grow a cloud environment, then defend it against realistic traffic, failures, and cost pressure.

## Project status

**Hackathon MVP — Scope Locked · PRD v0.5**

The browser MVP in `apps/web/` now includes a verified headless simulation, resource placement/connections/provisioning, live interventions, pause/recovery, classified traffic, result analysis, redesign/comparison, local architecture saves and contextual help. Automated integrated QA is in progress; real first-time-player learning validation remains pending. There is no Azure deployment, backend or outbound product telemetry. The old engine comparison remains isolated in `apps/engine-spike/`.

## MVP

- One Black Friday scenario, targeting 3–4 minutes.
- Four deployable resources: App Service, Azure SQL, Cache, and WAF.
- Placement, directional connections, scale-out, and provisioning delays.
- Deterministic, renderer-independent simulation with data-driven scenarios.
- Live intervention, revenue, infrastructure cost, failure detection, and scoring.
- Explainable results, architecture redesign, replay, and browser-local persistence.

The MVP simulates Azure architecture concepts. It does **not** deploy real Azure resources, use real Azure performance data, or require a backend.

## Core loop

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
  PRD.md                 Product requirements v0.5
  GAMEPLAY_SPEC.md       Gameplay specification v0.3
  SIMULATION_SPEC.md     Simulation specification v0.2
  TECHNICAL_DESIGN.md    Technical design v0.2
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

From the repository root with Node 22.22.0 and pnpm 10.32.1: `pnpm install --frozen-lockfile`, then `pnpm dev`. Open the local URL printed by Vite. Inspect or edit your architecture, wait for required provisioning, then Start traffic. Use Redesign & Retry after the result to compare attempts. Reset baseline restores the predefined one-instance design; Clear local state removes the saved architecture. Saves never resume a running scenario. The developer inspector steps real ticks and stops automatic time; normal play is 1×.

Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. For browser checks, install Chromium with `pnpm exec playwright install chromium`, build first, then run `pnpm test:browser`. Tests start/stop a production preview on port 43872; screenshots are generated under ignored `test-results/`. CI runs these same checks. Software-WebGL browser tests verify behavior, not hardware FPS. The engine spike stays outside the production workspace.

For a separate local GPU measurement on macOS, run `pnpm test:performance` after building. It uses full Chromium with ANGLE Metal on port 43873, prints the actual WebGL renderer, and samples 20 seconds of peak traffic; inspect that renderer before claiming hardware acceleration. The configuration is not a portable CI FPS gate. Two measured runs on an M1 Pro MacBook Pro with 32 GB RAM, Chromium 153.0.8010.12, 1440×900 at DPR 1 used `ANGLE Metal Renderer: Apple M1 Pro`: 59.77 and 60.03 FPS, p95 frame interval 16.7 ms, at most 62 representative markers, and 20 simulation ticks per sample. The second sample used the final integrated-QA build (1,201 frames over 20.008 seconds). These are single-machine measurements, not guarantees for other hardware or mobile devices.

## Run the engine experiment

From `apps/engine-spike/`, run `pnpm install --frozen-lockfile`, then `pnpm dev --port 43871 --strictPort`. Open `http://127.0.0.1:43871/` and use the renderer selector to compare the two views.

Use Node 22.22.0 and pnpm 10.32.1. Verification commands and limits are documented in [ADR-002](docs/adr/ADR-002-GAME-ENGINE.md#reproduction-and-evidence). This is a synthetic rendering experiment, not playable Black Friday.

## Documents

- [Product Requirements Document](docs/PRD.md) — What we are building and why; scope, product principles, and acceptance criteria (v0.5).
- [Gameplay Specification](docs/GAMEPLAY_SPEC.md) — What the player sees, does, and experiences (v0.3).
- [Simulation Specification](docs/SIMULATION_SPEC.md) — Corrected simulation rules, authoritative values, and arithmetic reference matrix (v0.2).
- [Technical Design](docs/TECHNICAL_DESIGN.md) — Software structure, state ownership, intended stack, and deployment design (v0.2).
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Phased delivery, scope guardrails, and verification gates (v0.5, draft); work is tracked with GitHub Issues and labels, without milestones or a Project board.

The [ordered MVP backlog (#7)](https://github.com/yeongseon/stack-and-survive/issues/7) links all currently planned work. Prepare the backlog first, then execute one issue at a time in dependency order; individual issues are the source of status and completion evidence.
- [ADR-002: Game Engine Selection](docs/adr/ADR-002-GAME-ENGINE.md) — Executed comparison and accepted Phaser 3.90.0 decision.

`SIMULATION_SPEC.md` is the source of truth for numerical simulation behavior. `TECHNICAL_DESIGN.md` documents the architecture. The implemented local loop still requires human learning validation before demo-readiness claims; hosting requires separate authorization.

Document expansion is frozen at these six documents for the MVP. The headless engine passes the independent nine-configuration reference matrix and intervention/replay checks; browser tests exercise editing, pause/graphics recovery, live actions, local save recovery, results and Cache/WAF redesign. Automated checks do not establish that a first-time human understands the lessons. Phaser is accepted; human playtesting, Azure deployment and external telemetry retain separate approval/evidence gates.

## Important boundaries

- All capacities, costs, and timings are gameplay assumptions, not Azure specifications or pricing.
- AWS/GCP, accounts, multiplayer, AI features, regions, and real infrastructure deployment are out of scope.
- No third-party game assets, internal Microsoft data, or confidential telemetry should be added.
- Public release and license selection require review of applicable employer, IP, OSS, trademark, and Hackathon policies. No open-source license has been selected yet.
