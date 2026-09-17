# Stack & Survive

> **Build. Scale. Keep the business flowing.**

> **Same workload. Different architectures. Different outcomes.**

**[Play the browser demo](https://yeongseon.github.io/stack-and-survive/)** · Project GitHub Pages game; playing never provisions real Azure resources.

## Watch the two-minute demo

[![Watch the Stack & Survive gameplay demo](docs/media/demo-preview.jpg)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)

**[Watch / download the demo (MP4, 2:00, 5.4 MiB)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)** · [Transcript, chapter guide and recording details](docs/DEMO_VIDEO.md)

Real gameplay from released build `24ca388`, edited into two minutes with an actual title screenshot. **Silent video** for presenter narration: construction, traffic spikes, bot filtering, results and Player Name. The global board shows existing verified scores; this run was not publicly submitted. The full operation lasts180seconds; this is not a continuous two-minute run.

The official game URL is the GitHub Pages link above. No custom domain is required.

Pages is owner-directed under an [exact-inventory demo exception, explicitly extended to original V3 art](docs/PAGES_DEMO_EXCEPTION.md). Asset rights remain pending; this is not a general license or release clearance. The project-path build is verified with `pnpm build:pages` and `pnpm test:pages`; deployment follows successful main-branch Quality CI.

Stack & Survive is a real-time cloud infrastructure management game where players scale and optimize Azure architecture as demand grows, keeping requests flowing, customers served, and costs under control.

## Project status

**Implemented:** fixed landscape hall, original V3 facilities, balance0.3 reinvestment/waves, direct expansion, Settings/Pause, result analysis and local leaderboard. The optional replay-verifying API exists in this repository; API source/configuration is not proof of a running public service. **Pending:** actual player validation, manual listening/device checks, rights decisions and final submission review. Art Epic #202 is completed implementation history.

Start with the [documentation authority index](docs/README.md). Current normal behavior is in [Gameplay](docs/GAMEPLAY_SPEC.md); future work is in [Product Roadmap](docs/PRODUCT_ROADMAP.md). `docs/archive/` preserves history and must not guide new implementation. The repository is public source; no project-wide open-source license has been selected. #164 tracks license, third-party rights and security decisions.

Asset integrity: `pnpm check:assets` verifies the pinned inventory and source/output hashes; `pnpm test:assets` exercises validation. Pending-rights warnings are intentional. The separate `pnpm check:assets:release` fails until the human rights/license gate is resolved; do not interpret a green integrity check as redistribution permission. No new external pack has been imported.

Ordinary play uses **balance 0.3**: anticipate the next wave, protect customers, reinvest **10% of successful sales** and expand before the next attack. Start with **75 Upgrade Funds** across eight spike/attack/recovery phases in180seconds. HUD shows upcoming RPS/bots/countdown and lost legitimate sales/sec (bots excluded). Click an empty App bay or Cache/Edge footprint **once** to request construction; real activation delays still apply. Routing is automatic, camera movement changes no gameplay, and **Learn** explains tradeoffs. QA/editor remains separate on explicit legacy0.2, with old reference tests intact.

Ordinary-player money is displayed as **simulated business value**, not actual Azure prices: one internal credit maps to **$1K** ($75K starting funds;0.25 credit/s appears as $250/s). App, Cache and Edge costs remain **running expenses** of $5K/min, $8K/min and $3K/min, not one-time purchase prices. Economy values, scoring, replays and saved records are unchanged; QA/editor may retain internal credit units.

The [visual-state contract](docs/RESOURCE_VISUAL_STATES.md) distinguishes real active App servers, empty sockets and construction bays. Single-action expansion keeps guarded cost/delay semantics without a second confirmation. Short local recovery feedback follows actual activation, recovered sales or improved processing, not invented rewards. Existing art/camera work is separate from this gameplay sprint and is not proof of human game feel.

The browser game works without an API. `apps/leaderboard-api` is an optional backend that validates submitted action provenance by replaying the shared simulation from its canonical start. When `VITE_LEADERBOARD_API` is configured at build time, eligible scores may be submitted there; otherwise results stay local. Network failure must not block play. Configuration, code existence, a healthy deployed API and a successfully verified submission are distinct evidence stages. Backend provisioning/operations belong to the backend owner; this client release does not deploy that service or add analytics.

## MVP

- One 180-second Black Friday scenario, plus title/countdown and result review.
- Three sequential objectives on that same workload: finish the operation, finish with ≥99% availability, then finish with ≥99.9%. Unlocked levels are saved locally; every attempt starts with fresh infrastructure.
- Fixed Internet/App1/SQL baseline; live App scale-out and Cache/Protected Edge deployment.
- Automatic supported routing, actual provisioning delays and resource-local interventions.
- Deterministic, renderer-independent simulation with data-driven scenarios.
- Live intervention, revenue, infrastructure cost, failure detection, and scoring.
- Explainable results and fresh player retries; manual architecture editing, comparison and local saves in QA only.
- Local rankings by exact challenge identity, plus optional server-replayed rankings when a configured API is available. Local scores and self-reported nicknames are not trusted identities or anti-cheat proof.

The MVP simulates Azure architecture concepts. It does **not** deploy real Azure resources, use real Azure performance data, or require a backend.

## Core loop

### Game-first controls

**Settings / Pause:** use title Settings for existing sound/volume/vibration, tips and supported fullscreen controls. Pause or Escape opens the game menu; **Inspect paused world** closes it without resuming. Settings/help returns to the paused menu, and Resume explicitly restarts time. Upcoming phases are labeled Traffic spike, Bot attack, Recovery window or FINAL WAVE; routine per-second sales banners are removed so meaningful recovery cues stay clear.

**One fixed landscape world:** facilities no longer rearrange on narrow screens. Phone play requires landscape; portrait Start shows a rotate-device gate while title/help remain available. After Start the camera establishes the whole hall, then focuses the operating sector before the existing countdown; Fit returns to that whole map. Reduced motion skips the sweep. Fullscreen/orientation lock is best-effort, never a requirement for manual landscape play. Rotating during operation holds it until explicit Continue; a manual pause stays paused. This canonical-map foundation (#208) precedes V3 runtime asset sizing/integration.

Click infrastructure directly: empty App bay and Cache/Edge footprints request expansion once; unavailable/repeated requests report their reason. Wheel/pinch/drag/Fit and keyboard equivalents remain unchanged. Follow the next-wave indicator and lost-sales counter; only10% of successful revenue adds funds. Physical construction still follows actual ticks. Results retain full evidence under **Details**. Balance0.3 records/progress use new namespaces, leaving old saved data untouched. No speed controls, FIFO, scale-in or SQL scaling were added.

The world is the dominant player surface. Area percentages are design guidance, not an aesthetic score. Final technical evidence is recorded in the implementation PRs and #195; actual participant game-feel/replay review remains outstanding. Earlier test counts and performance paragraphs below are historical revision measurements, not claims for every later build.

The primary player experience is demand → flow → pressure → expansion/optimization → observed business outcome. Results and redesign/replay support that loop. Better decisions can improve outcomes; more capacity alone does not guarantee more profit.

Use the exact revision's CI and capture manifest for test totals; historical counts are not current release guarantees. Real current-build comprehension/game-feel/voluntary replay remains #25/#195/#159. #151's missing comparison is retired, not reconstructed. #132 and #160–#163 are closed not planned for this Hackathon.

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
  SIMULATION_SPEC.md     Current balance0.3 and preserved historical0.2 references
  TECHNICAL_DESIGN.md    Implemented architecture v1.0
  VISUAL_DIRECTION.md    Visual direction v0.6 / Production Art V3
  PRODUCT_ROADMAP.md     Future work, not implementation evidence
  IMPLEMENTATION_PLAN.md Current ordered execution and human gates
  archive/               Historical proposals (not authority)
  adr/
    ADR-002-GAME-ENGINE.md Engine experiment evidence (Accepted: Phaser 3.90.0)
apps/
  engine-spike/          Disposable two-engine experiment and tests
  web/                   React/Phaser editor, gameplay, results and local saves
  leaderboard-api/       Optional canonical-replay verification API; deployment is separate
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

Visual evidence covers 320/390/1024/1440/1920 and actual construction, navigation, pressure and outcomes. The world is the dominant player surface; area targets are supplementary design guidance, not aesthetic scores. Protected cached scenes do not fabricate SQL pressure; the uncached higher-App fixture demonstrates that bottleneck. Very short screens may scroll. Touch emulation and screenshots do not establish real-device human acceptance.

## Run the engine experiment

From `apps/engine-spike/`, run `pnpm install --frozen-lockfile`, then `pnpm dev --port 43871 --strictPort`. Open `http://127.0.0.1:43871/` and use the renderer selector to compare the two views.

Use Node 22.22.0 and pnpm 10.32.1. Verification commands and limits are documented in [ADR-002](docs/adr/ADR-002-GAME-ENGINE.md#reproduction-and-evidence). This is a synthetic rendering experiment, not playable Black Friday.

## Technical Story

- [Technical submission notes](docs/SUBMISSION_TECHNICAL_NOTES.md) — shared simulation, canonical replay and local fallback; read deployment claims alongside the status below.
- [Leaderboard architecture](docs/LEADERBOARD_ARCHITECTURE.md) — trust boundary, challenge identity and score verification.
- [Leaderboard deployment](docs/LEADERBOARD_DEPLOYMENT.md) — backend-owner setup and persistent-storage requirements; instructions are not deployment evidence.
- [Rights and licensing status](docs/LICENSING_STATUS.md) — unresolved owner/third-party obligations; public source is not a license grant.
- [Submission pack](docs/submission/README.md) — demo script, capture plan, fallback, judge Q&A and one-session human worksheet.

`LEADERBOARD_API_URL` feeds the Pages build-time API setting. Verify the actual build and the backend's `/api/health` plus an approved replay submission before saying the public leaderboard is online. An unavailable/unconfigured API leaves the local leaderboard; do not label local entries as server verified. Deployment may be skipped when main advances before Quality finishes—check the actual **deploy job**, not only the workflow conclusion.

The external-art experiment [PR #245](https://github.com/yeongseon/stack-and-survive/pull/245) has progressed to **Iteration04, awaiting owner review**. Earlier rejected candidates remain historical evidence; no automatic merge or runtime adoption is authorized. It is not a new game art pack or expanded rights grant.

## Release verification and captures

Run `pnpm capture:submission` for a production build, a real unaccelerated180-second completion and a separate no-action overload run. It captures 16 milestones including title, construction, spikes/attacks/recovery, result/local-leaderboard, overload, Pause and Settings; records source/artifact identity and before/after readouts in ignored `test-results-submission/<timestamp>/capture-manifest.json`; saves the actual completed run; and blocks external API submissions. Failed capture status is retained, not reported as success. `DEMO` is automation, not a participant. Do not represent edited excerpts as a continuous two-minute full run.

Metadata is server-readable HTML (no JavaScript required), with an original inline stack favicon and the already-approved original SQL artwork as its social preview. No Microsoft icon is used as the project logo. Project-path/reload/404 recovery are checked by `pnpm test:pages`; third-party Discord/Slack/GitHub preview caches may refresh separately and require actual platform observation before claiming a rendered card is verified.

## Documents

- [Product Requirements Document](docs/PRD.md) — Current scope versus planned diversity (v1.0).
- [Gameplay Specification](docs/GAMEPLAY_SPEC.md) — Current player flow and separate QA editor appendix (v1.0).
- [Simulation Specification](docs/SIMULATION_SPEC.md) — Current0.3 reinvestment/waves and measured strategies, with explicit historical0.2 arithmetic regression.
- [Technical Design](docs/TECHNICAL_DESIGN.md) — Actual controller/renderer/UI and browser-local deployment boundary (v1.0).
- [Visual Direction](docs/VISUAL_DIRECTION.md) — Shipped game-first interactions and Production Art V3 direction (v0.6).
- [Historical Tycoon Reframe](docs/archive/TYCOON_REFRAME_IMPLEMENTATION_PLAN.md) — Archived presentation plan, not current authority.
- [Asset provenance](apps/web/public/assets/ATTRIBUTION.md) — Original V24 Azure SVG sources, checksums, bundled terms and remaining usage-review limitations.
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Current quality/replayability sequence and real-human gates (v1.0).
- [Replayability Design](docs/REPLAYABILITY_DESIGN.md), [Challenge System](docs/CHALLENGE_SYSTEM.md), [Strategy Balance](docs/ARCHITECTURE_STRATEGY_BALANCE.md) — Implemented challenge/ladder/history/profiles and measured strategies; future variety remains gated.
- [Asset Strategy](docs/ASSET_STRATEGY.md), [Engineering Rules](docs/ENGINEERING_RULES.md), [Design References](docs/GAME_DESIGN_REFERENCES.md) — Sourcing/change discipline and text-only independent design commentary.

The [current backlog (#7)](https://github.com/yeongseon/stack-and-survive/issues/7) tracks final client release/submission work, backend-owner deployment, rights/manual audio checks and one combined human session. #212/#213/#216 and V3 art are delivered; historical epics are not a request for additional systems. #151 is not planned. Issues remain acceptance units, not one-PR-per-issue requirements.
- [ADR-002: Game Engine Selection](docs/adr/ADR-002-GAME-ENGINE.md) — Executed comparison and accepted Phaser 3.90.0 decision.

`SIMULATION_SPEC.md` is the source of truth for numerical simulation behavior. `TECHNICAL_DESIGN.md` documents the architecture. The implemented local loop still requires human learning validation before demo-readiness claims; hosting requires separate authorization.

The owner requested the current documentation reset and explicit future design documents in #141. The headless engine retains the independent reference matrix and intervention/replay checks; browser tests exercise both normal play and QA editing/recovery. Automated checks do not establish human learning or voluntary replay. Phaser is accepted; human playtesting, hosting and external telemetry retain separate evidence/approval gates.

## Important boundaries

- All capacities, costs, and timings are gameplay assumptions, not Azure specifications or pricing.
- AWS/GCP, accounts, multiplayer, AI features, regions, and real infrastructure deployment are out of scope.
- No third-party game assets, internal Microsoft data, or confidential telemetry should be added.
- Public release and license selection require review of applicable employer, IP, OSS, trademark, and Hackathon policies. No open-source license has been selected yet.
- Azure SVGs are separate, unchanged service-identification images, not project-owned art or the product logo. Integration follows the owner's explicit request; no separate Microsoft permission or policy clearance has been established. Review applicable use and distribution conditions before public release; source terms are preserved with the assets.
