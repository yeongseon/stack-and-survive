# Historical implementation plan — not current authority

See [current implementation plan](../IMPLEMENTATION_PLAN.md). The following records superseded execution instructions.

# Stack & Survive — Implementation Plan

**Version:** 0.8  
**Status:** Existing gameplay and visual foundation implemented; data-center tycoon reframe in progress; human validation pending, hosting deferred  
**Scope:** Hackathon MVP, one Black Friday scenario

## 1. Purpose and document freeze

The owner requested [the Data-Center Tycoon Reframe](TYCOON_REFRAME_IMPLEMENTATION_PLAN.md), an explicit additional planning document. Current sequential P0 work is #80 → #81 (environment) → #91 (review actual art quality; implement targeted sprites only if justified) → #83 (lanes) → #82 (representative pressure queues) → #84 (compact HUD) → #88 (Insights/Events/Why) → #86 (Build/Manage) → #87 (processing effects) → #85 (technical/visual acceptance) → #25 (real people). The earlier completed visual sequence below is historical foundation, not completion of this new direction or a delivered PNG/WebP asset pipeline. Core packages and `SIMULATION_SPEC.md` remain unchanged; Phase 2 live Cache/Edge deployment is deferred.

Turn the existing specifications into a short, verifiable delivery sequence. This plan is not authorization to install packages, implement the game, execute the engine spike, or deploy Azure resources.

Use the existing sources of truth:

- [Historical PRD](PRD_MVP.md): product goals and scope.
- [Historical Gameplay Specification](GAMEPLAY_SPEC_MVP.md): player-facing behavior.
- [Simulation Specification](../SIMULATION_SPEC.md): numerical rules.
- [Historical Technical Design](TECHNICAL_DESIGN_MVP.md): implementation boundaries and intended stack.
- [Engine ADR](../adr/ADR-002-GAME-ENGINE.md): engine selection after evidence from the spike.

The owner explicitly added [Visual Direction](VISUAL_DIRECTION_MVP.md) and subsequently supplied a replacement v0.2 with 45 sections for the Microsoft Internal Hackathon. Its primary rule is: official Azure icons identify services; custom game assets create the game world. This replaces the earlier short v0.2 criteria draft. The updated P0 sequence is #52 document/responsive baseline → #57 official icons and provenance → #53 custom structures → #54 traffic/state VFX → #58 tactical HUD/composition → #59 objectives/event feed → #60 development-only diagnostics → #55 visual verification → #25 actual human validation. #29 contains only optional P1 polish beyond this required slice. This document/issue update does not download assets, certify icon/asset usage permissions, alter simulation rules, or authorize hosting/telemetry. Confirm current source and usage terms for each asset before importing it; internal Hackathon context is not a blanket license. Treat UI mockup numbers as illustrations and preserve `SIMULATION_SPEC.md` as numerical truth. Further standalone specifications remain deferred unless requested; the asset provenance record requested by Visual Direction is created when assets are actually introduced.

## 2. Entry gates

### A. Select one renderer

Completed: the comparative spike was executed and the owner accepted Phaser 3.90.0 in ADR-002. The implementation phases below describe the delivery sequence; their current state is recorded in the linked issues, not inferred from future-tense checklist wording.

### B. Implement the corrected simulation contract as tests

The review's numerical and lifecycle corrections are now incorporated into Simulation Specification v0.2, Gameplay v0.3, PRD v0.5, and Technical Design v0.2. The canonical values and reference metrics live in `SIMULATION_SPEC.md`, not this plan.

| Reviewed issue | Documented resolution | Regression obligation (implemented) |
|---|---|---|
| Unreachable 99% availability target | Revised SQL write capacity and bot-heavy peak make protected three-instance and unprotected four-instance Cache designs meet targets. | Reproduce section 110 full-run metrics. |
| Rate Limit forced failure | Modest load shedding now trades latency against customer success without automatically crossing the hard-failure threshold. It is explicitly not a throughput-recovery mechanic. | Cover both saturated and unsaturated admission and the recorded peak policy. |
| Insufficient scale-out response window | Longer failure grace permits a scale request at 34 to activate at 42 before baseline failure. | Check exact activation tick and bad-streak reset. |
| WAF economics and emergency action | Revised WAF cost and peak mix support avoided-instance savings; emergency filtering buys time for delayed scaling but expires. | Compare fixed-input designs and emergency-with/without-scale policies. |
| SQL lesson hidden by later losses | Preserve phase summaries and use a controlled four-instance Cache/no-Cache pair to isolate the DB effect. | Verify truthful final cause plus phase-level attribution. |
| Ambiguous execution/retry rules | Explicit tick intervals, event/action ordering, zero-demand outputs, loss attribution, comparison tolerance, and pending-capacity persistence. | Turn those boundaries into headless tests; no renderer-dependent calculations. |

Section 110 contains independent arithmetic reference calculations with explicit initial states and action schedules. The implemented regression suite now reproduces those reference outcomes and intervention policies. This establishes automated correctness, not player-tested difficulty or understanding. The default maximum stack plus emergency stays within budget; a reduced-budget fixture verifies exact-zero failure.

### Current delivery checkpoint

- Core simulation, editor, live controls, results/replay, local persistence, onboarding and automated integrated QA are implemented through issue #24.
- Required visual features are implemented through #53, #54, #58, #59 and #60: original structures/environment, separate identity badges, actual-state effects, tactical UI, objectives/events and production/QA separation. #55 records final technical acceptance and #78 the corrected mobile label collision. The owner-requested ultrawork scope is the implemented game presentation, not fabricated human approval or hosting.
- Issue #25 remains open for actual first-time-player learning validation. Recruit 2–3 participants if feasible; record uncoached observations and answers, not just whether the app runs. Responsive fixes address reported usability problems but do not themselves complete this validation.
- Prioritize UI/game-feel changes supported by those observations. Do not add simulation mechanics or split packages without a concrete need.
- The owner subsequently requested GitHub Pages, then deferred hosting. No site, subscription change or public-repository conversion was performed. Superseded Azure hosting issues #26–#27 and optional telemetry/polish #28–#29 were closed as Not planned during backlog cleanup, not delivered. Confirm a focused target and approval before opening new hosting or optional work.
- Rehearse the final Hackathon presentation after hosted smoke checks. A preliminary local walkthrough can happen during player testing; multiple complete 180-second runs do not fit a 3–4 minute pitch.
- Track these gates rather than unsupported percentage-complete estimates. Optional polish (#29) is not a reason to claim human validation or hosted delivery has passed.

### Final visual verification evidence

- 154 unit/regression tests and 41 QA browser cases pass locally; six ordinary-player cases verify real-time play plus five viewport captures with diagnostics absent.
- Official icon hashes and missing-image fallback remain tested; source terms and unresolved applicable-use review remain in the asset attribution record, not certified by test results.
- Full Cache/WAF redesign, actual SQL overload, reduced motion, graphics recovery, same-tick event identity and narrow label/icon separation are covered. Original numerical reference scores remain unchanged.
- Two Apple M1 Pro/Metal peak measurements with the final visual feature set show about 60.02 FPS and 20 ticks over 20 seconds. Exact environment and limits are in README; software-WebGL CI is not a hardware benchmark.
- Final Oracle read-only source/test review reported PASS; it did not independently certify aesthetic preference, asset permission or human comprehension. New acceptance changes still require their own PR CI before #55 closes.

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

The isolated engine experiment and the local architecture → traffic → result → redesign loop are implemented. The next validation goal is evidence that first-time players understand that loop. The phases above remain delivery guidance, not GitHub milestones or a claim that the remaining human/hosting gates have passed.

## 5. Project management rules

**Status: Accepted by the project owner.** Track work with GitHub Issues and labels only; do not use GitHub milestones or a Project board. The initial five milestones were removed at the owner's request without deleting issues. Keep the rules here rather than introducing another management document. The owner has now approved Phaser and sequential verified development/commit/push/PR merges. This does not authorize Azure deployment, external telemetry, new scope or balance changes.

### Work tracking and scope

- Use GitHub Issues as the authoritative task list, with saved label filters instead of a separate board or milestone hierarchy.
- Use four states: Backlog → Ready → In Progress → Done. Mark blocked work explicitly with its dependency and reason; blocked is not done.
- Initially represent the first three states with mutually exclusive `status:backlog`, `status:ready`, and `status:in-progress` labels. Done is a completed closed issue after review/merge, not a separate board. Closing as not planned is not completion. Use P0/P1/P2 labels; due dates remain unset until provided. Initial issues #1–#5 cover the spike, production setup, first simulation slice, visualization, and boundary-test follow-up.
- One issue should deliver one observable result, normally within half a day to one day. Split larger features into independently verifiable slices; record a dependency rather than starting everything at once.
- Each issue records purpose, in-scope work, exclusions, relevant specification sections, acceptance criteria, verification method, owner, and dependencies. Dates are added when the Hackathon deadline and availability are known, not invented.
- Priorities: P0 = required for the core demo; P1 = useful after P0; P2 = post-MVP. New ideas go to Backlog and do not automatically enter current work.
- Limit work in progress to one primary issue per contributor. Parallel AI investigations are allowed, but avoid overlapping edits to the same files.
- The project owner approves scope changes, renderer selection, and balance changes. Proposed changes must explain the effect on the demo and what existing work they displace.

### Backlog first, sequential execution

Create the known scope-locked backlog before production work. [Issue #7](https://github.com/yeongseon/stack-and-survive/issues/7) is the current ordered link index; consult it rather than historical issue counts or superseded sequences in this plan. It is not a milestone or an additional concurrent implementation task. Each linked issue owns current scope, acceptance criteria and verification evidence; all new issues and PRs use the repository templates.

Execute one issue at a time in the index's dependency order, not numeric issue order. The initial sequence is #1 → #2 → #8 → #3 → #5. Complete implementation, verification, and authorized review/merge before promoting the next item. The owner explicitly accepted Phaser and authorized sequential development, commits, pushes and reviewed PR merges. Actual human playtesting, Azure deployment, external telemetry and new scope/balance changes are not covered by that authorization.

The index groups work from validated inputs through simulation, full-run regressions, editor/gameplay, results/retry/save, accessibility and human testing, then hosting preparation and explicitly approved deployment. Basic tests ship with each implementation; dedicated regression issues add coverage rather than defer testing. Optional visual/audio polish and telemetry do not block core completion.

Upfront coverage is not a claim that every future bug is knowable. Before starting an issue, refine acceptance criteria using what is now known; split a task if it cannot deliver one reviewable outcome within a reasonable session. Newly discovered defects become linked issues and are inserted at the appropriate dependency point. Do not expand into post-MVP features or continue through a blocking issue just to follow the original list.

The tracking index is a coordination exception to the code-PR completion rule: it closes when its required child work has actual completion evidence, without a separate implementation PR. Human comprehension testing requires real participant evidence; engine choice, merges, external telemetry, and cloud deployment retain their explicit approval boundaries. Creating issues does not authorize executing all of them automatically.

### Issue labels

Keep classification small and reuse existing GitHub labels rather than creating duplicate synonyms.

| Dimension | Labels | Rule |
|---|---|---|
| Priority | `P0`, `P1`, `P2` | Exactly one per planned task |
| Progress | `status:backlog`, `status:ready`, `status:in-progress` | Exactly one per open planned task; replace the old label when moving |
| Main work type | `enhancement`, `bug`, `documentation`, `spike`, `test`, `chore` | Choose one main type: feature, defect, docs, experiment, dedicated tests, or tooling/maintenance |
| Optional flag | `blocked` | Add only when progress is prevented; name the dependency/decision in the issue and remove when resolved |

An ordinary future task with known dependencies can stay in Backlog without `blocked`; use the flag when the obstruction needs attention. Awaiting routine PR review remains In Progress. On successful completion after review/merge, close the issue and remove its progress and blocked labels; retain priority/type for history. Closing as not planned is not Done.

Initial classification: #1 `spike`, #2 `chore`, #3 and #4 `enhancement`, #5 `test`. They retain their existing P0 and progress labels. Existing special-purpose labels such as `accessibility` or `duplicate` may be used when relevant, but are not another required classification axis. Do not create area labels for every package before there is a demonstrated filtering need. Git release tags are separate from issue labels and are not needed for this setup.

Useful issue filters:

```text
is:issue is:open label:P0 label:status:ready
is:issue is:open label:status:in-progress
is:issue is:open label:blocked
```

### Branches, commits, and pull requests

Use the issue/bug and PR templates in `.github/` for every new work item, including CLI-created items. Fill each required section and run `node scripts/check-work-item.mjs issue|pr <body-file>` before publication. See [the work-item guide](../../.github/WORK_ITEM_GUIDE.md) for exact fields, format checks and historical migration limits. A successful format check is not evidence of implementation, test execution or approval. Existing records were retrospectively aligned while preserving their original descriptions; do not treat historical placeholder fields as newly accepted requirements.

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
- The PR is reviewed and merged, and its issue is closed. Code awaiting review remains In Progress. Local completion, merge, and deployment are distinct statuses; deployment is required only for an issue whose acceptance criteria explicitly require it.

### Session handoff and risk reporting

At the end of a work session, summarize what changed, checks run and results, what remains blocked, and the single next step. Keep permanent task status in the issue rather than relying on chat history alone.

Report blockers when found; do not silently invent requirements or keep retrying an unsuitable approach indefinitely. Timebox the engine comparison as specified in ADR-002. If a required capability fails, record evidence and revisit the decision with the project owner.

Before calling the MVP demo-ready, confirm the end-to-end journey with a person unfamiliar with the implementation. Use the existing gameplay validation questions; passing unit tests alone is not proof that the game teaches its intended lesson.
