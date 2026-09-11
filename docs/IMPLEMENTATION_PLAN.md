# Stack & Survive — Implementation Plan

**Version:** 0.2  
**Status:** Draft — documentation only; implementation not started  
**Scope:** Hackathon MVP, one Black Friday scenario

## 1. Purpose and document freeze

Turn the existing specifications into a short, verifiable delivery sequence. This plan is not authorization to install packages, implement the game, execute the engine spike, or deploy Azure resources.

Use the existing sources of truth:

- [PRD](PRD.md): product goals and scope.
- [Gameplay Specification](GAMEPLAY_SPEC.md): player-facing behavior.
- [Simulation Specification](SIMULATION_SPEC.md): numerical rules.
- [Technical Design](TECHNICAL_DESIGN.md): implementation boundaries and intended stack.
- [Engine ADR](adr/ADR-002-GAME-ENGINE.md): engine selection after evidence from the spike.

Freeze document expansion at these six documents. Correct contradictions in existing documents as needed; do not add separate UI, scenario, asset, audio, mobile, or backend specifications for the MVP. A TypeScript ADR is not required now.

## 2. Entry gates

### A. Select one renderer

Execute the timeboxed comparative spike in ADR-002 when implementation begins. Record the evidence, select one engine, and mark the ADR Accepted before building the production game world. The engine-independent core can be evaluated without this decision.

### B. Implement the corrected simulation contract as tests

The review's numerical and lifecycle corrections are now incorporated into Simulation Specification v0.2, Gameplay v0.3, PRD v0.5, and Technical Design v0.2. The canonical values and reference metrics live in `SIMULATION_SPEC.md`, not this plan.

| Reviewed issue | Documented resolution | Implementation verification still required |
|---|---|---|
| Unreachable 99% availability target | Revised SQL write capacity and bot-heavy peak make protected three-instance and unprotected four-instance Cache designs meet targets. | Reproduce section 110 full-run metrics. |
| Rate Limit forced failure | Modest load shedding now trades latency against customer success without automatically crossing the hard-failure threshold. It is explicitly not a throughput-recovery mechanic. | Cover both saturated and unsaturated admission and the recorded peak policy. |
| Insufficient scale-out response window | Longer failure grace permits a scale request at 34 to activate at 42 before baseline failure. | Check exact activation tick and bad-streak reset. |
| WAF economics and emergency action | Revised WAF cost and peak mix support avoided-instance savings; emergency filtering buys time for delayed scaling but expires. | Compare fixed-input designs and emergency-with/without-scale policies. |
| SQL lesson hidden by later losses | Preserve phase summaries and use a controlled four-instance Cache/no-Cache pair to isolate the DB effect. | Verify truthful final cause plus phase-level attribution. |
| Ambiguous execution/retry rules | Explicit tick intervals, event/action ordering, zero-demand outputs, loss attribution, comparison tolerance, and pending-capacity persistence. | Turn those boundaries into headless tests; no renderer-dependent calculations. |

Section 110 contains independent arithmetic reference calculations with explicit initial states and action schedules. These are not implemented-engine tests or evidence of player-tested difficulty. Future golden tests must reproduce them before the demo is declared working. The default maximum stack plus emergency stays within budget; a reduced-budget fixture verifies exact-zero failure.

## 3. Delivery phases

### Phase 0 — Minimal repository setup

- After the entry decisions, configure the TypeScript/pnpm/Vite project and chosen renderer.
- Reconcile the initial `apps/game/` placeholder with the planned `apps/web/` structure.
- Introduce packages only as their responsibilities are implemented; do not create unused abstraction layers.
- Add lint, type-check, test, and build commands.

**Exit:** a reproducible local setup, blank web shell, and passing minimal test/build pipeline. No backend or deployment yet.

### Phase 1 — Deterministic simulation core

- Begin with headless Internet → App Service → SQL.
- Implement validated scenario/resource data, traffic splitting, capacity admission, and business outcomes.
- Add Cache read eligibility, WAF, rate limiting, provisioning, and action timing.
- Implement costs, budget, revenue, incident loss, latency, failure counters, attribution, and scoring.
- Make simulation runtime state explicit and keep React, DOM, and engine imports out of the core.

**Exit:** the same initial architecture, scenario, and timestamped actions produce reproducible snapshots and final results without a browser.

### Phase 2 — Black Friday regression tests

- Cover one and two App instances, with and without Cache and WAF; include three- and four-instance survivors.
- Record live actions explicitly where a comparison depends on scaling or emergency behavior.
- Test read reduction without write reduction, disconnected resources and their cost, invalid paths, duplicate links, and SQL capacity independence.
- Test pause, timing boundaries, replay reset, zero denominators, budget exhaustion, and result attribution.
- Reproduce the corrected v0.2 reference matrix and action policies before recording golden tests. Any later balance change updates the balance version and expectations intentionally.

**Exit:** the demo matrix and intended learning sequence are verified by headless tests.

### Phase 3 — First playable world

- Integrate only the selected renderer and a minimal React shell.
- Render the baseline architecture; support camera, selection, placement, and directional connections.
- Validate allowed nodes/edges and explain why Start Traffic is unavailable.
- Advance preparation provisioning without charging runtime cost or advancing the traffic scenario.

**Exit:** the player can build a valid baseline and see its authoritative simulation reflected in the scene.

### Phase 4 — Simulation visualization

- Animate representative Browse, Order, and Bot traffic along the actual paths.
- Show cache hits ending at Cache and filtered bots stopping at the edge.
- Display utilization, failures, provisioning, cost, and critical-state indicators with text/icons as well as color.
- Interpolate visuals without changing simulation timing or results.

**Exit:** a player can identify pressure, dropped requests, bots, and pending capacity within approximately three seconds.

### Phase 5 — Gameplay and local persistence

- Implement briefing, Start Traffic, Pause/Resume, scale-out, rate-limit toggling, and emergency WAF.
- Enforce action availability, delays, limits, and no edits/live actions while paused.
- Save and load versioned architecture locally; implement reset-to-baseline and clear-local-state controls.
- Preserve intended architecture between attempts while resetting runtime economics, actions, and failure state.

**Exit:** preparation → run → intervention → success/failure works; architecture survives refresh, but an in-progress scenario is not resumed.

### Phase 6 — Results and redesign/replay

- Display business metrics, score, primary outcome cause, optional physical bottleneck, and contributing causes.
- Provide rule-based explanations grounded in recorded losses, not invented advice.
- Implement Redesign & Retry and previous/current comparisons, including elapsed time and completion status so unequal runs are not presented as equal-duration experiments.

**Exit:** a player can change the architecture, rerun the same scenario, and explain why the outcome changed.

### Phase 7 — Demo polish

- Add concise contextual onboarding and lightweight, original or properly licensed assets.
- Improve readable animation and accessibility; audio remains optional.
- Check normal laptop performance and a complete desktop demo walkthrough.
- Defer mobile implementation, decorative effects, and optional 2× speed if the core loop still needs work.

**Exit:** one coherent, rehearsed demo story works reliably without scope expansion.

### Phase 8 — Azure deployment

- Deploy the static browser application to Azure Static Web Apps only when deployment is requested.
- Add reproducible Bicep and CI/CD appropriate to that deployment.
- Validate production asset loading, browser errors, persistence, and the complete demo loop.
- Monitoring is optional; any telemetry requires transparent behavior and applicable privacy review. Do not emit the tick stream by default.

**Exit:** the hosted game passes the same smoke checks as the local build, with no mandatory application backend or client secrets.

## 4. Scope guardrails

Do not introduce authentication, cloud saves, Functions, Service Bus, multiplayer, AI coaching, multiple scenarios, mobile clients, or additional providers. Mentioning an Azure resource in the game does not require deploying that resource.

If time is limited, cut audio, decorative polish, optional telemetry, and optional speed controls before cutting simulation correctness, clear feedback, or redesign/replay.

The next implementation milestone is a truthful App → SQL loop, not another specification. All phases above remain planned work until execution begins.
