# Stack & Survive — Product Requirements

Version: 1.2. Reviewed merged baseline: PR #253 / `9421e74`. [Simulation](SIMULATION_SPEC.md) owns numerical truth; [Gameplay](GAMEPLAY_SPEC.md) owns current controls; [Roadmap](PRODUCT_ROADMAP.md) owns future scope. Camera/direct-world interaction, V3 art, balance0.3 and Settings/Pause are delivered. The [release checkpoint](submission/RELEASE_CHECKPOINT.md) distinguishes deployed evidence from the local mission-HUD follow-up and remaining human gates.

> Build. Scale. Keep the business flowing.
>
> Same workload. Different architectures. Different outcomes.

## Purpose and audience

A browser-local real-time infrastructure-management game for developers, engineers and cloud learners. The player operates a living business through world-local decisions, not a configuration form or certification quiz. The world shows pressure before metrics explain it. All capacities, costs and durations are game assumptions, not actual Azure performance/prices. No real resources are deployed.

## Current playable scope

| Area | Implemented behavior |
|---|---|
| Entry | Decorative title, Start Game, How to Play, About, Settings; landscape gate, whole-map reveal and five-second countdown |
| Baseline | Fixed Internet, active App1 and SQL; absent Cache/Edge pads |
| Expansion | App scale-out to four; one-time live Cache/Edge installation; automatic supported routing |
| Interventions | Intake rate-limit toggle and once-per-run active-Edge filtering boost |
| Feedback | Physical active/empty/construction bays, real routed packets, bounded pressure, served-business feedback |
| Information | Upgrade Funds/demand/availability/pressure/lost sales/next wave; Learn for explanations, objectives, events and metrics; local mission-progress follow-up is recorded separately in the checkpoint |
| Guidance and sound | Skippable contextual world guide; default-muted optional synthesized audio and supported opt-in haptics, with manual acceptance still pending |
| Outcome | Operation report with engine cause/score/NBV/availability, descriptive profile, compatible prior/best comparisons and next experiment; eligible Next level or Play again / Review business |
| Retry | Fresh baseline via title, not persistent upgraded infrastructure |
| Content | Approved three-objective ladder on the same deterministic 180-second Black Friday workload; no new workload families |
| Local records | Up to 20 recent attempts, separate objective-valid personal bests per exact challenge, browser-local progress; no permanent capacity bonuses |

Normal play has no free placement/wiring, initial-instance form, architecture save/restore, resource deletion, scale-in or SQL upgrade. The manual editor and saved architecture editing remain QA/development tools; ordinary play has validated local history/comparison without restoring upgraded infrastructure. The canonical landscape world supports zoom/pan/Fit and single-action direct expansion, with semantic keyboard equivalents and resource cards. [Gameplay](GAMEPLAY_SPEC.md) defines the separation.

## Product principles

1. **Decisions, not complex controls.** Choose which layer needs more capacity or less work, not where to draw a wire.
2. **Evidence, not a promised universal solution.** Current configurations produce different measured outcomes. Multiple viable strategies for every intended future challenge require calibration; naming strategy families does not prove viability.
3. **Tradeoffs remain real.** App scaling costs more and does not scale SQL. Cache removes eligible reads, not writes. Edge affects its path and may reject customers.
4. **Delay is meaningful.** Queued/pending capacity is not active; empty bays cannot look like installed servers.
5. **Reinvestment is explicit.** Balance0.3 reinvests10% of successful sales into Upgrade Funds; not all revenue is spendable. No invented purchase refund or permanent stat bonus is implied.
6. **Failure teaches from actual causes.** A cheaper early failure is not efficiency; survival is not all targets met.
7. **Deterministic and explainable.** Same validated initial architecture/scenario/action schedule gives the same result under the numerical convention.
8. **Accessible, game-first presentation.** Non-color cues and reduced motion support understanding; technical panels are optional.
9. **The world is the primary interface.** The implemented indoor diorama is operated through facilities, physical empty bays and construction footprints. HUD supports that world rather than becoming its substitute.
10. **Navigation changes understanding, not outcomes.** Zoom rewards facility inspection; Fit rewards architecture understanding. Camera is presentation state, never runtime/replay/challenge/history state. Keyboard access does not depend on mastering camera gestures.
11. **Outcome first, analysis second.** The first post-run view makes success/failure and the next action immediate; evidence-rich analysis remains available on demand rather than being deleted.

## Acceptance and evidence

Historical PR #185 regression counts describe only that revision. Current exact-revision test/deployment evidence belongs in the [checkpoint](submission/RELEASE_CHECKPOINT.md), not permanent product acceptance claims. #25/#195/#159 still require unfamiliar-participant observations; #151 is closed not planned because the independent pre-change baseline was never collected. No retrospective experiment or AI quality score substitutes for raw answers.

Use [Strategy Balance](ARCHITECTURE_STRATEGY_BALANCE.md) rather than hypothetical numbers. Not all App-heavy/cache/edge sketches survive current Black Friday. Human readability targets and art-quality percentages must not be reported as measured by an AI screenshot review.

## Delivered foundations and remaining gates

The #197/camera foundation and #199/#200/#201 interaction slices are delivered, followed by the canonical map, V3 integration and gameplay/settings work. [Player Camera and World Interaction](PLAYER_CAMERA_AND_WORLD_INTERACTION.md) preserves the cross-layer contract; its historical sequence must not be read as pending implementation. #186 remains open only for #195 human acceptance.

Production-quality #144–#150 software and replayability #153–#158 are delivered; #149 manual audio/haptics and #159 replay evidence remain open. #152 remains for #159. Existing human gates are not accepted merely because software is merged.

Objectives/modifiers, workload families, daily challenges, discoveries (#160–#163) and scale-in #132 are closed not planned for this Hackathon. Passing a human gate does not automatically reopen them. SQL upgrades, queues, functions, asynchronous processing, replication and failover are not current mechanics. New work requires separate approved contracts; examples are not implementation authorization.

## Exclusions and distribution

No paid asset dependencies, gacha, energy/stamina, premium currency, permanent capacity bonuses, accounts, multiplayer, real Azure provisioning by gameplay, AWS/GCP expansion, camera rotation or full 3D in current scope. The optional replay-verifying leaderboard API is a separate backend-owner service; #260/PR #261 track the browser CORS follow-up, not client gameplay work. New hosting/telemetry require separate authorization; the GitHub Pages demo is owner-authorized under the [exact-inventory exception](PAGES_DEMO_EXCEPTION.md).

The repository is public by owner request, with no project-wide OSS license selected. #164 tracks code/art licensing and employer/Hackathon/third-party obligations. Official Azure icons remain unchanged separate identifiers with their own terms. No endorsement, affiliation or rights clearance is implied.
