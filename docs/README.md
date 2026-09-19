# Documentation authority

## Start here

- **Play:** [illustrated player guide](PLAYER_GUIDE.md), with actual screenshots from opening to result.
- **Build:** [development guide](DEVELOPMENT.md), covering setup, modes, test prerequisites and capture reproduction.
- **Contribute:** [contribution guide](../CONTRIBUTING.md), covering issue/PR workflow, verification and unresolved license boundaries.
- **Present:** [showcase](../showcase/README.md), with a seven-slide English deck, downloadable PDF and English speaker notes.

## Current contracts

Use the [dated hackathon handoff](submission/HACKATHON_HANDOFF.md) for the latest presentation checkpoint, current rules 0.4 and backend compatibility blocker. The [release checkpoint](submission/RELEASE_CHECKPOINT.md) and [Computer 1 readiness report](submission/FINAL_RELEASE_READINESS.md) are historical revision-specific evidence, not current deployment status. Human/audio/rights gates remain open. Public source visibility is not an OSS license grant or third-party rights approval.

| Order | Current authority | Responsibility |
|---|---|---|
| 1 | [SIMULATION_SPEC](SIMULATION_SPEC.md) | Numerical truth, tick/action/graph contracts and reference matrix |
| 2 | [GAMEPLAY_SPEC](GAMEPLAY_SPEC.md) | Ordinary-player behavior; separate QA appendix |
| 3 | [PRD](PRD.md) | Goals, current scope and approval boundaries |
| 4 | [TECHNICAL_DESIGN](TECHNICAL_DESIGN.md) | Implemented architecture and deployment status |
| 5 | [RESOURCE_VISUAL_STATES](RESOURCE_VISUAL_STATES.md) | Truthful lifecycle/capacity/activity projection |
| 6 | [VISUAL_DIRECTION](VISUAL_DIRECTION.md) | Art, presentation and accessibility rules |
| 7 | [PRODUCT_ROADMAP](PRODUCT_ROADMAP.md) | Future work and gates, not implementation evidence |
| 8 | [PLAYER_CAMERA_AND_WORLD_INTERACTION](PLAYER_CAMERA_AND_WORLD_INTERACTION.md) | Cross-layer state/projection/gesture/direct-world design contract; Gameplay owns currently supported controls |

Each document owns its subject. An art mockup cannot override numerical rules. If code and an active contract disagree, record and resolve the discrepancy with evidence; do not silently rewrite either.

**Current versus target:** GAMEPLAY_SPEC and TECHNICAL_DESIGN describe implemented behavior. Historical implementation sequences and design targets do not authorize reopening delivered camera/art work. `PLAYER_CAMERA.md` is a subordinate implementation note, not a competing source. #197 and the camera foundation are delivered; #186 remains open only for actual human acceptance in #195.

Update current gameplay/technical/state documentation and root README only after the corresponding implementation merges. Do not change SIMULATION_SPEC, history/challenge semantics or asset inventory for a presentation-only feature. Detailed staged responsibilities are in [Implementation plan](IMPLEMENTATION_PLAN.md).

## Supporting contracts

- [Demo video](DEMO_VIDEO.md): two-minute real-play recording, descriptive transcript and source identity.

- [Implementation plan](IMPLEMENTATION_PLAN.md): execution order and issue dependencies.
- [Submission pack](submission/README.md): demo/fallback/capture guidance and the unperformed human worksheet.
- [Release checkpoint](submission/RELEASE_CHECKPOINT.md): exact revision, observed deployment/API evidence and remaining owners.
- [Engineering rules](ENGINEERING_RULES.md): test-first truth/contracts, evidence-first visuals.
- [Asset strategy](ASSET_STRATEGY.md): free-only sourcing and provenance gates.
- [Audio feedback](AUDIO_FEEDBACK.md): original optional synthesis, lifecycle and remaining human listening checks.
- [World guide](WORLD_GUIDE.md): optional pressure-based guidance, explicit persistence and remaining human validation.
- [Game design references](GAME_DESIGN_REFERENCES.md): text-only pattern discussion.
- [Replayability design](REPLAYABILITY_DESIGN.md): implemented loops and remaining replay plans.
- [Challenge system](CHALLENGE_SYSTEM.md): current identity/ladder and planned deterministic composition.
- [Run history](RUN_HISTORY.md): bounded records, full provenance validation and eligible personal bests.
- [Architecture profiles](ARCHITECTURE_PROFILES.md): descriptive accepted-action patterns and measured evidence.
- [Operation report](OPERATION_REPORT.md): player UI, exact comparisons and fresh-run actions.
- [Player camera math](PLAYER_CAMERA.md): subordinate #187 Fit-preserving implementation note; the cross-layer contract above owns target navigation and interaction behavior.
- [Strategy balance](ARCHITECTURE_STRATEGY_BALANCE.md): observed results versus hypotheses.
- [Scale-in evaluation](SCALE_IN_EVALUATION.md): historical design proposal; #132 is closed not planned, not queued implementation.
- [Asset attribution](../apps/web/public/assets/ATTRIBUTION.md): actual provenance.
- [ADR-002](adr/ADR-002-GAME-ENGINE.md): accepted engine and historical experiment.

## Historical records

[archive/](archive/) is historical only and **must not be used as current implementation authority**. Superseded full documents and original issue/PR archives are not permission to restore obsolete controls or expand scope.

Human findings belong in #25, #159 and reframe acceptance #195 as applicable. #151 is closed not planned: disclose the missing independent pre-change baseline rather than reconstruct it. Automated checks cannot demonstrate that a person understands the game or voluntarily wants to replay it.
