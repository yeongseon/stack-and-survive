# Documentation authority

Baseline: living-operation gameplay and visual technical acceptance merged through PR #140 (`816a7a5`). Public source visibility is not an OSS license grant or third-party rights approval.

| Order | Current authority | Responsibility |
|---|---|---|
| 1 | [SIMULATION_SPEC](SIMULATION_SPEC.md) | Numerical truth, tick/action/graph contracts and reference matrix |
| 2 | [GAMEPLAY_SPEC](GAMEPLAY_SPEC.md) | Ordinary-player behavior; separate QA appendix |
| 3 | [PRD](PRD.md) | Goals, current scope and approval boundaries |
| 4 | [TECHNICAL_DESIGN](TECHNICAL_DESIGN.md) | Implemented architecture and deployment status |
| 5 | [RESOURCE_VISUAL_STATES](RESOURCE_VISUAL_STATES.md) | Truthful lifecycle/capacity/activity projection |
| 6 | [VISUAL_DIRECTION](VISUAL_DIRECTION.md) | Art, presentation and accessibility rules |
| 7 | [PRODUCT_ROADMAP](PRODUCT_ROADMAP.md) | Future work and gates, not implementation evidence |

Each document owns its subject. An art mockup cannot override numerical rules. If code and an active contract disagree, record and resolve the discrepancy with evidence; do not silently rewrite either.

## Supporting contracts

- [Implementation plan](IMPLEMENTATION_PLAN.md): execution order and issue dependencies.
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
- [Strategy balance](ARCHITECTURE_STRATEGY_BALANCE.md): observed results versus hypotheses.
- [Scale-in evaluation](SCALE_IN_EVALUATION.md): proposal awaiting approval.
- [Asset attribution](../apps/web/public/assets/ATTRIBUTION.md): actual provenance.
- [ADR-002](adr/ADR-002-GAME-ENGINE.md): accepted engine and historical experiment.

## Historical records

[archive/](archive/) is historical only and **must not be used as current implementation authority**. Superseded full documents and original issue/PR archives are not permission to restore obsolete controls or expand scope.

Human findings belong in #25, #151 and #159 as applicable. Automated checks cannot demonstrate that a person understands the game or voluntarily wants to replay it.
