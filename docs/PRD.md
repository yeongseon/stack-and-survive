# Stack & Survive — Product Requirements

Version: 1.1. Reviewed implemented baseline: PR #185 / `abdd412`. [Simulation](SIMULATION_SPEC.md) owns numerical truth; [Gameplay](GAMEPLAY_SPEC.md) owns current controls; [Roadmap](PRODUCT_ROADMAP.md) owns future scope. The game-first reframe principles below are targets, not claims that camera navigation/direct-world actions have shipped.

> Build. Scale. Keep the business flowing.
>
> Same workload. Different architectures. Different outcomes.

## Purpose and audience

A browser-local real-time infrastructure-management game for developers, engineers and cloud learners. The player operates a living business through world-local decisions, not a configuration form or certification quiz. The world shows pressure before metrics explain it. All capacities, costs and durations are game assumptions, not actual Azure performance/prices. No real resources are deployed.

## Current playable scope

| Area | Implemented behavior |
|---|---|
| Entry | Decorative title, Start Game, How to Play, About; five-second countdown |
| Baseline | Fixed Internet, active App1 and SQL; absent Cache/Edge pads |
| Expansion | App scale-out to four; one-time live Cache/Edge installation; automatic supported routing |
| Interventions | Intake rate-limit toggle and once-per-run active-Edge filtering boost |
| Feedback | Physical active/empty/construction bays, real routed packets, bounded pressure, served-business feedback |
| Information | Budget/demand/availability/one pressure alert; Learn for explanations, objectives, events and metrics |
| Guidance and sound | Skippable contextual world guide; default-muted optional synthesized audio and supported opt-in haptics, with manual acceptance still pending |
| Outcome | Operation report with engine cause/score/NBV/availability, descriptive profile, compatible prior/best comparisons and next experiment; eligible Next level or Play again / Review business |
| Retry | Fresh baseline via title, not persistent upgraded infrastructure |
| Content | Approved three-objective ladder on the same deterministic 180-second Black Friday workload; no new workload families |
| Local records | Up to 20 recent attempts, separate objective-valid personal bests per exact challenge, browser-local progress; no permanent capacity bonuses |

Normal play has no free placement/wiring, initial-instance form, architecture save/restore, resource deletion, scale-in or SQL upgrade. The manual editor and saved architecture editing remain QA/development tools; ordinary play now has its own validated local history/comparison without restoring upgraded infrastructure. It still uses fixed responsive layout, DOM pads and resource cards; player zoom/pan and primary direct-world expansion remain planned in #186. [Gameplay](GAMEPLAY_SPEC.md) defines the current separation.

## Product principles

1. **Decisions, not complex controls.** Choose which layer needs more capacity or less work, not where to draw a wire.
2. **Evidence, not a promised universal solution.** Current configurations produce different measured outcomes. Multiple viable strategies for every intended future challenge require calibration; naming strategy families does not prove viability.
3. **Tradeoffs remain real.** App scaling costs more and does not scale SQL. Cache removes eligible reads, not writes. Edge affects its path and may reject customers.
4. **Delay is meaningful.** Queued/pending capacity is not active; empty bays cannot look like installed servers.
5. **Revenue is not budget.** No spendable-revenue reward, purchase refund or permanent stat bonus is implied.
6. **Failure teaches from actual causes.** A cheaper early failure is not efficiency; survival is not all targets met.
7. **Deterministic and explainable.** Same validated initial architecture/scenario/action schedule gives the same result under the numerical convention.
8. **Accessible, game-first presentation.** Non-color cues and reduced motion support understanding; technical panels are optional.
9. **The world is the primary interface.** Epic #186 targets a playable indoor diorama operated through facilities, physical empty bays and construction footprints. HUD supports that world rather than becoming its substitute.
10. **Navigation changes understanding, not outcomes.** Zoom rewards facility inspection; Fit rewards architecture understanding. Camera is presentation state, never runtime/replay/challenge/history state. Keyboard access does not depend on mastering camera gestures.
11. **Outcome first, analysis second.** The target first post-run view makes success/failure and the next action immediate; existing evidence-rich analysis remains available on demand rather than being deleted.

## Acceptance and evidence

Merged PR #185 passed 253 unit, 75 QA, seven ordinary-player and one Pages case, plus its actual remote CI. These are revision-specific regression evidence, not proof of aesthetic quality or human comprehension. #25/#151 still lack an independent pre-change participant baseline, which must not be fabricated. New #195 coordinates actual game-feel/navigation review with #159 voluntary replay before P1. The owner-directed reframe precedes that human gate; no AI quality score substitutes for raw answers.

Use [Strategy Balance](ARCHITECTURE_STRATEGY_BALANCE.md) rather than hypothetical numbers. Not all App-heavy/cache/edge sketches survive current Black Friday. Human readability targets and art-quality percentages must not be reported as measured by an AI screenshot review.

## Planned, not released

Epic #186, preceded by docs/contract #197, plans unified camera, zoom/pan/Fit, world-first layout, direct-world interaction, stronger physical construction, minimal HUD, diorama hierarchy and outcome-first results. [Player Camera and World Interaction](PLAYER_CAMERA_AND_WORLD_INTERACTION.md) is the prospective cross-layer guardrail. PR #196 camera foundation is unmerged at this revision; it must be reconciled after the docs prerequisite. No future gesture/control is advertised as supported until its implementation merges.

Production-quality #144–#150 software and replayability #153–#158 are delivered; #149 manual audio/haptics, #151 quality evidence and #159 replay evidence remain open. Existing epics are not fully accepted merely because their software is merged.

Objectives/modifiers, boss windows, daily challenges and collections are P1 after the replayability human gate. #132 scale-in is design/approval only. SQL upgrades, queues, functions, asynchronous processing, replication and failover are not current mechanics. They require separate approved contracts; examples are not implementation authorization.

## Exclusions and distribution

No paid asset dependencies, gacha, energy/stamina, premium currency, permanent capacity bonuses, accounts, multiplayer, backend services, real Azure provisioning, AWS/GCP expansion, camera rotation or full 3D in current scope. Additional hosting and telemetry remain deferred; the current GitHub Pages demo is separately owner-authorized under the [exact-inventory exception](PAGES_DEMO_EXCEPTION.md).

The repository is public by owner request, with no project-wide OSS license selected. #164 tracks code/art licensing and employer/Hackathon/third-party obligations. Official Azure icons remain unchanged separate identifiers with their own terms. No endorsement, affiliation or rights clearance is implied.
