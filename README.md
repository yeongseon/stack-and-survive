# Stack & Survive

> **Build. Scale. Keep the business flowing.**

> **Same workload. Different architectures. Different outcomes.**

Stack & Survive is a real-time cloud infrastructure management game where players scale and optimize Azure architecture as demand grows, keeping requests flowing, customers served, and costs under control.

## Project status

**Living-operation gameplay and visual technical acceptance delivered through PR #140 · Human baseline pending (#25) · Production Quality and Replayability planned, not implemented**

Start with the [documentation authority index](docs/README.md). Current normal behavior is in [Gameplay](docs/GAMEPLAY_SPEC.md); future work is in [Product Roadmap](docs/PRODUCT_ROADMAP.md). `docs/archive/` preserves history and must not guide new implementation. The repository is public source; no project-wide open-source license has been selected. #164 tracks license, third-party rights and security decisions.

Ordinary play now enters through **Start Game / How to Play / About**, then a five-second countdown into a living business. Use world-local **+** controls to expand App capacity or install Cache/Protected Edge during operation. Routing is automatic; no placement, wiring or initial-instance setup is required. Click intake for rate limiting or active Edge for filtering boost. Budget, demand and availability remain visible; **Learn** contains explanations and analysis. Revenue is not spendable budget. The existing architecture editor is retained in the QA/development build, while `?tycoon` there selects the new player flow. Production never exposes editor/diagnostic controls through URL parameters.

The [visual-state contract](docs/RESOURCE_VISUAL_STATES.md) now distinguishes real active App servers, empty sockets and construction bays. The player world has a framed indoor production aisle, larger App/SQL facilities, pooled semantic packet textures, stronger representative pressure, floor expansion pads with cost confirmation, compact HUD/local actions and game-style results. A decorative title previews the data center without advancing gameplay. The reference image guides composition, not prices or queue semantics; this is not a pixel-identical reproduction or proof of human game feel.

The browser MVP includes separate official Azure badges, snapshot-driven processing/pressure and served-business feedback, actual objectives/events, live provisioning, pause/recovery and results. The historical manual editor, redesign/comparison and local architecture saves remain QA tools, not the normal game loop. Existing54 QA editor cases are retained alongside new tycoon tests; production tests cover real-time entry, expansion and five viewport sizes. #25 now explicitly validates unassisted world-local expansion and perceived game feel after #120; no participant results exist. Hosting (including GitHub Pages) remains deferred. There is no backend or outbound product telemetry.

## MVP

- One 180-second Black Friday scenario, plus title/countdown and result review.
- Fixed Internet/App1/SQL baseline; live App scale-out and Cache/Protected Edge deployment.
- Automatic supported routing, actual provisioning delays and resource-local interventions.
- Deterministic, renderer-independent simulation with data-driven scenarios.
- Live intervention, revenue, infrastructure cost, failure detection, and scoring.
- Explainable results and fresh player retries; manual architecture editing, comparison and local saves in QA only.

The MVP simulates Azure architecture concepts. It does **not** deploy real Azure resources, use real Azure performance data, or require a backend.

## Core loop

The primary player experience is demand → flow → pressure → expansion/optimization → observed business outcome. Results and redesign/replay support that loop. Better decisions can improve outcomes; more capacity alone does not guarantee more profit.

Current technical checks contain 192 unit cases, 61 QA browser cases and seven ordinary-player cases. Actual human observation remains #25 after #129. Epic #123 stays open until its human criteria are met. Future runtime scale-in (#132) is design evaluation only, not an implemented or approved gameplay action.

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
  README.md              Current authority index
  PRD.md                 Product requirements v1.0
  GAMEPLAY_SPEC.md       Current gameplay v1.0 and QA appendix
  SIMULATION_SPEC.md     Simulation specification v0.2
  TECHNICAL_DESIGN.md    Implemented architecture v1.0
  VISUAL_DIRECTION.md    Visual direction v0.4
  PRODUCT_ROADMAP.md     Future work, not implementation evidence
  IMPLEMENTATION_PLAN.md Current ordered execution and human gates
  archive/               Historical proposals (not authority)
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

From the repository root with Node 22.22.0 and pnpm 10.32.1: `pnpm install --frozen-lockfile`, then `pnpm dev` for the QA/editor experience (append `?tycoon` for the new game). For ordinary play use `pnpm build` followed by `pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1`; open the printed URL and select Start Game. Expand directly in the world. Play again returns to the title and starts a fresh baseline, not a saved runtime. Manual redesign/comparison and architecture persistence remain in QA.

Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Install Chromium with `pnpm exec playwright install chromium`, then `pnpm test:player` tests ordinary `dist` on port 43874 using real-time gameplay. Next run `pnpm build:qa` and `pnpm test:browser`; separate `dist-qa` on port 43872 enables the inspector for full regressions. CI runs both variants in this order. Player screenshots live under ignored `test-results-player/`; QA screenshots/traces use `test-results/`. Only development and compile-time `qa` contain JSON/manual-step/renderer diagnostics; URL parameters cannot enable them in production. Do not deploy `dist-qa`. Run `pnpm build:qa` before `pnpm test:performance` too. Software-WebGL tests verify behavior, not hardware FPS.

Performance artifacts are isolated under ignored `test-results-performance/` so running hardware measurements cannot delete QA traces. Final visual-overhaul measurement on the same M1 Pro/Chromium153/1440×900/DPR1 ANGLE Metal backend: player 60.0335 FPS, p95 16.7ms, 1201 frames over 20.0055s; editor 60.0188 FPS. Each advanced 20 authoritative ticks and peaked at 62 representative packets. These results include pooled packet rendering and the final game HUD/pads; they are single-machine observations, not a universal performance guarantee.

For a separate local GPU measurement on macOS, run `pnpm build:qa` then `pnpm test:performance`. It uses full Chromium with ANGLE Metal on port 43873, prints the actual WebGL renderer, and samples 20 seconds of peak traffic. The configuration is not a portable CI FPS gate. Reframe measurements on an M1 Pro MacBook Pro with 32 GB RAM, Chromium 153.0.8010.12, 1440×900 at DPR 1 used `ANGLE Metal Renderer: Apple M1 Pro`: two runs at 60.0194 and 60.0212 FPS, p95 frame interval 16.8 ms, at most 62 representative packets and 20 simulation ticks per sample. Each rendered 1,201 frames over approximately 20.010 seconds. These include production sprites, processing effects and the new HUD/drawers. They are single-machine measurements, not guarantees for other hardware or mobile devices.

Visual acceptance screenshots are regenerated by `pnpm test:player` at 320, 390, 1024, 1440 and 1920-pixel widths and by the QA suite for actual SQL overload, Cache/WAF behavior, reduced motion and label collisions. The protected cached scene does not fabricate a SQL bottleneck: the separate four-instance, uncached reference run demonstrates real SQL overload. The desktop test requires at least 75% world area within the playfield with analysis closed, not within the entire document. Very short screens scroll to actions rather than clipping facility badges; this is not a native-mobile redesign.

## Run the engine experiment

From `apps/engine-spike/`, run `pnpm install --frozen-lockfile`, then `pnpm dev --port 43871 --strictPort`. Open `http://127.0.0.1:43871/` and use the renderer selector to compare the two views.

Use Node 22.22.0 and pnpm 10.32.1. Verification commands and limits are documented in [ADR-002](docs/adr/ADR-002-GAME-ENGINE.md#reproduction-and-evidence). This is a synthetic rendering experiment, not playable Black Friday.

## Documents

- [Product Requirements Document](docs/PRD.md) — Current scope versus planned diversity (v1.0).
- [Gameplay Specification](docs/GAMEPLAY_SPEC.md) — Current player flow and separate QA editor appendix (v1.0).
- [Simulation Specification](docs/SIMULATION_SPEC.md) — Corrected simulation rules, authoritative values, and arithmetic reference matrix (v0.2).
- [Technical Design](docs/TECHNICAL_DESIGN.md) — Actual controller/renderer/UI and browser-local deployment boundary (v1.0).
- [Visual Direction](docs/VISUAL_DIRECTION.md) — State-accurate art and Production Quality policy (v0.4).
- [Historical Tycoon Reframe](docs/archive/TYCOON_REFRAME_IMPLEMENTATION_PLAN.md) — Archived presentation plan, not current authority.
- [Asset provenance](apps/web/public/assets/ATTRIBUTION.md) — Original V24 Azure SVG sources, checksums, bundled terms and remaining usage-review limitations.
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Current quality/replayability sequence and real-human gates (v1.0).
- [Replayability Design](docs/REPLAYABILITY_DESIGN.md), [Challenge System](docs/CHALLENGE_SYSTEM.md), [Strategy Balance](docs/ARCHITECTURE_STRATEGY_BALANCE.md) — Future contracts, not shipped levels/profiles/history.
- [Asset Strategy](docs/ASSET_STRATEGY.md), [Engineering Rules](docs/ENGINEERING_RULES.md), [Design References](docs/GAME_DESIGN_REFERENCES.md) — Sourcing/change discipline and text-only independent design commentary.

The [ordered MVP backlog (#7)](https://github.com/yeongseon/stack-and-survive/issues/7) links all currently planned work. Prepare the backlog first, then execute one issue at a time in dependency order; individual issues are the source of status and completion evidence.
- [ADR-002: Game Engine Selection](docs/adr/ADR-002-GAME-ENGINE.md) — Executed comparison and accepted Phaser 3.90.0 decision.

`SIMULATION_SPEC.md` is the source of truth for numerical simulation behavior. `TECHNICAL_DESIGN.md` documents the architecture. The implemented local loop still requires human learning validation before demo-readiness claims; hosting requires separate authorization.

The owner requested the current documentation reset and explicit future design documents in #141. The headless engine retains the independent reference matrix and intervention/replay checks; browser tests exercise both normal play and QA editing/recovery. Automated checks do not establish human learning or voluntary replay. Phaser is accepted; human playtesting, hosting and external telemetry retain separate evidence/approval gates.

## Important boundaries

- All capacities, costs, and timings are gameplay assumptions, not Azure specifications or pricing.
- AWS/GCP, accounts, multiplayer, AI features, regions, and real infrastructure deployment are out of scope.
- No third-party game assets, internal Microsoft data, or confidential telemetry should be added.
- Public release and license selection require review of applicable employer, IP, OSS, trademark, and Hackathon policies. No open-source license has been selected yet.
- Azure SVGs are separate, unchanged service-identification images, not project-owned art or the product logo. Integration follows the owner's explicit request; no separate Microsoft permission or policy clearance has been established. Review applicable use and distribution conditions before public release; source terms are preserved with the assets.
