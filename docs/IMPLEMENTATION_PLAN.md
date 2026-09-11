# Stack & Survive — Implementation Plan

**Version:** 0.3  
**Status:** Draft — M0 renderer experiment executed; production implementation not started  
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

The isolated `apps/engine-spike/` experiment has been executed; ADR-002 records observations and awaits owner acceptance. The next production milestone is a truthful App → SQL loop, not another specification. Production phases above remain planned work.

## 5. Project management rules

**Status: Accepted by the project owner.** These rules govern project work; adopting a rule alone does not authorize remote operations. Documentation publication and initial issues/milestones were subsequently requested and created. No Project board, branch protection, production CI, or deployment is implied. Keep the rules here rather than introducing another management document. The implementation plan remains draft; renderer selection awaits owner approval of the executed spike.

### Work tracking and scope

- Use GitHub Issues as the authoritative task list. A GitHub Project board is optional; avoid a second duplicate backlog.
- Use four states: Backlog → Ready → In Progress → Done. Mark blocked work explicitly with its dependency and reason; blocked is not done.
- Initially represent the first three states with mutually exclusive `status:backlog`, `status:ready`, and `status:in-progress` labels. Done is a completed closed issue after review/merge, not a separate board. Closing as not planned is not completion. Use P0/P1/P2 labels; due dates remain unset until provided. Initial issues #1–#5 cover the spike, production setup, first simulation slice, visualization, and boundary-test follow-up.
- One issue should deliver one observable result, normally within half a day to one day. Split larger features into independently verifiable slices; record a dependency rather than starting everything at once.
- Each issue records purpose, in-scope work, exclusions, relevant specification sections, acceptance criteria, verification method, owner, and dependencies. Dates are added when the Hackathon deadline and availability are known, not invented.
- Priorities: P0 = required for the core demo; P1 = useful after P0; P2 = post-MVP. New ideas go to Backlog and do not automatically enter the current milestone.
- Limit work in progress to one primary issue per contributor. Parallel AI investigations are allowed, but avoid overlapping edits to the same files.
- The project owner approves scope changes, renderer selection, and balance changes. Proposed changes must explain the effect on the demo and what existing work they displace.

### Milestones

Group the implementation phases by a demonstrable outcome:

| Milestone | Deliverable | Exit evidence |
|---|---|---|
| M0 — Engine decision | Comparable Phaser/PlayCanvas spike and accepted ADR | Recorded checks and selection rationale |
| M1 — Headless truth | Minimal setup, simulation core, and Black Friday regression suite | Repeatable tests matching reference behavior |
| M2 — First playable | Baseline world, placement/connections, and visualization | Browser walkthrough showing a real simulation bottleneck |
| M3 — Complete loop | Live actions, local save, results, redesign, comparison | A complete fail → understand → redesign → retry walkthrough |
| M4 — Demo ready | Focused polish and requested Azure deployment | Rehearsed demo and deployed smoke checks |

These milestones group existing phases; they do not add features or authorize implementation/deployment.

### Branches, commits, and pull requests

- Keep `main` as the reviewed baseline. After the initial documentation bootstrap, use short-lived branches; no separate `develop` or release-branch hierarchy is needed for the MVP.
- Name branches by purpose and issue, for example `docs/12-project-rules`, `spike/13-engine-comparison`, `feat/14-traffic-split`, or `fix/15-budget-boundary`.
- Default to one focused PR per issue. A PR explains why the change is needed, links the issue, lists verification actually performed, and notes limitations. Visual changes include a screenshot or short recording when useful.
- Use small, meaningful commits with English imperative descriptions, consistent with the initial history. A specific commit prefix convention is not required. Keep a directly related test with its implementation; do not split changes merely to reach a file-count target.
- Prefer squash merge for a focused feature PR, preserving the issue reference and verification summary. Do not rewrite already-shared history or force-push `main`.
- Require project-owner review before merge. In solo work, a documented self-review is acceptable; AI review is supporting evidence, not a claim that a second human approved the change. Repository protections must remain achievable for the actual team size.
- Existing permission boundaries still apply: AI does not commit, push, create remote issues/PRs, merge, change repository settings, or deploy merely because this workflow describes those actions. Obtain an explicit request for those operations. Permission for a commit does not imply permission to push or deploy.

### Definition of Ready

An issue is Ready when its outcome and acceptance checks are clear, prerequisite decisions are available, it fits the MVP, and its dependencies are finished or explicitly accounted for. An engine spike can be Ready without an engine decision: its output is that decision.

### Definition of Done

- The issue's acceptance criteria are met, not just its code written.
- Relevant tests and checks pass. Once tooling exists, this includes lint, type-check, unit/regression tests, and build as applicable. Before tooling exists, document-only work records structural/content checks instead; do not claim unrun tests passed.
- Simulation/balance changes update the authoritative specification, balance version, and corresponding regression expectations together. Passing arithmetic checks is not equivalent to engine tests or player playtesting.
- Player-facing work is exercised in the browser, with observed behavior and any limitations recorded. A renderer screenshot alone does not verify simulation correctness.
- Changed behavior is reflected in the existing documents; no secrets, confidential data, or unlicensed assets are added.
- The PR is reviewed and merged, and its issue is closed. Code awaiting review remains In Progress. Local completion, merge, and deployment are distinct statuses; deployment is required only for a deployment issue or the demo-ready milestone.

### Session handoff and risk reporting

At the end of a work session, summarize what changed, checks run and results, what remains blocked, and the single next step. Keep permanent task status in the issue rather than relying on chat history alone.

Report blockers when found; do not silently invent requirements or keep retrying an unsuitable approach indefinitely. Timebox the engine comparison as specified in ADR-002. If a required capability fails, record evidence and revisit the decision with the project owner.

Before calling the MVP demo-ready, confirm the end-to-end journey with a person unfamiliar with the implementation. Use the existing gameplay validation questions; passing unit tests alone is not proof that the game teaches its intended lesson.
