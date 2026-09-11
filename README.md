# Stack & Survive

> **Your architecture is your defense.**
>
> Build the cloud. Survive the traffic.

Stack & Survive is a cloud architecture strategy game where players build and grow a cloud environment, then defend it against realistic traffic, failures, and cost pressure.

## Project status

**Hackathon MVP — Scope Locked · PRD v0.5**

This repository currently contains planning documents and an initial directory structure. The game, simulation engine, build tooling, and automated tests have not been implemented. The technical design records the intended stack and recommended tooling; the renderer engine remains pending a PlayCanvas vs Phaser spike. No implementation or deployment has started.

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
    ADR-002-GAME-ENGINE.md Engine selection (Proposed; spike pending)
apps/
  game/                  Future browser game and renderer
packages/
  schema/                Future shared schemas and validation
  cloud-domain/          Future provider-neutral architecture model
  simulation/            Future deterministic simulation engine
  scenarios/             Future data-driven scenario definitions
```

The application and package directories are placeholders, not configured workspaces. The proposed structure in [Technical Design](docs/TECHNICAL_DESIGN.md) uses `apps/web/` and additional packages; the current directories have not been reorganized or implemented.

## Documents

- [Product Requirements Document](docs/PRD.md) — What we are building and why; scope, product principles, and acceptance criteria (v0.5).
- [Gameplay Specification](docs/GAMEPLAY_SPEC.md) — What the player sees, does, and experiences (v0.3).
- [Simulation Specification](docs/SIMULATION_SPEC.md) — Corrected simulation rules, authoritative values, and arithmetic reference matrix (v0.2).
- [Technical Design](docs/TECHNICAL_DESIGN.md) — Software structure, state ownership, intended stack, and deployment design (v0.2).
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Phased delivery, scope guardrails, and verification gates (v0.3, draft); project management rules are accepted.
- [ADR-002: Game Engine Selection](docs/adr/ADR-002-GAME-ENGINE.md) — Comparative spike criteria; no engine selected yet (Proposed).

`SIMULATION_SPEC.md` is the source of truth for numerical simulation behavior. `TECHNICAL_DESIGN.md` documents the implementation architecture; the engine spike, implementation, and Azure deployment remain future work.

Document expansion is frozen at these six documents for the MVP. The reviewed balance and lifecycle corrections are now reflected in the existing specifications. Reference metrics were checked arithmetically; engine tests and player playtesting have not run. Renderer selection remains Proposed pending its spike.

## Important boundaries

- All capacities, costs, and timings are gameplay assumptions, not Azure specifications or pricing.
- AWS/GCP, accounts, multiplayer, AI features, regions, and real infrastructure deployment are out of scope.
- No third-party game assets, internal Microsoft data, or confidential telemetry should be added.
- Public release and license selection require review of applicable employer, IP, OSS, trademark, and Hackathon policies. No open-source license has been selected yet.
