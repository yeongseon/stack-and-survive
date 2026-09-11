# Stack & Survive

> **Your architecture is your defense.**
>
> Build the cloud. Survive the traffic.

Stack & Survive is a cloud architecture strategy game where players build and grow a cloud environment, then defend it against realistic traffic, failures, and cost pressure.

## Project status

**Hackathon MVP — Scope Locked · PRD v0.5**

This repository contains planning documents, a minimal production workspace in `apps/web/`, and an isolated Phaser/PlayCanvas comparison in `apps/engine-spike/`. Root commands run production lint, types, tests and build; GitHub Actions runs the same quality checks. The game, simulation engine and Azure deployment remain in progress/not implemented. The owner has accepted Phaser 3.90.0 for production development.

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
  web/                   Production React shell; Phaser selected
packages/
  schema/                Future shared schemas and validation
  cloud-domain/          Future provider-neutral architecture model
  simulation/            Future deterministic simulation engine
  scenarios/             Future data-driven scenario definitions
```

From the repository root with Node 22.22.0 and pnpm 10.32.1: `pnpm install --frozen-lockfile`, then `pnpm dev`. Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. The initial web shell is not the playable game. Packages are added only when their implementation issue starts. The engine spike is excluded from the production workspace; run its commands from its own directory.

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

`SIMULATION_SPEC.md` is the source of truth for numerical simulation behavior. `TECHNICAL_DESIGN.md` documents the production architecture; the simulation/game implementation and Azure deployment remain future work.

Document expansion is frozen at these six documents for the MVP. Simulation reference metrics were checked arithmetically; gameplay tests and player playtesting have not run. The rendering spike's unit/browser tests have run, but do not verify simulation correctness. Phaser is accepted; human playtesting, Azure deployment and external telemetry retain separate approval/evidence gates.

## Important boundaries

- All capacities, costs, and timings are gameplay assumptions, not Azure specifications or pricing.
- AWS/GCP, accounts, multiplayer, AI features, regions, and real infrastructure deployment are out of scope.
- No third-party game assets, internal Microsoft data, or confidential telemetry should be added.
- Public release and license selection require review of applicable employer, IP, OSS, trademark, and Hackathon policies. No open-source license has been selected yet.
