# Challenge system

Version: 0.1 design proposal for #153–#163. Current code has one validated Black Friday scenario, not the entities or progression below. This document is not approval of example numeric modifiers.

## Proposed responsibilities

| Concept | Responsibility |
|---|---|
| Workload | Validated duration, traffic schedule, request mix and bot proportions |
| Objective | Evaluates business success independently of workload generation |
| Modifier | Typed deterministic allowed transformation with explicit precedence/validation |
| Challenge | Immutable workload/rules/objective/seed identity and level context |
| RunResult | Actual terminal metrics, initial/final architecture, accepted actions and complete challenge identity |
| Profile | Pure descriptive classification of actual behavior/outcomes |
| History / PersonalBest | Bounded versioned eligible local records, not simulation state |
| DailyChallenge | Deterministic UTC-date mapping to an allowed challenge version |

## Identity before comparison

#153 must define canonical serialization and ID/hash inputs: challenge/content version, balance/rules version, workload definition, seed and seed-algorithm version, objective identity, modifier list/order and duration. Same complete identity plus initial architecture and action schedule must reproduce results. A seed alone is insufficient when content changes.

Compare like conditions, label differences explicitly and retain termination/duration. A failed partial run is not an eligible cheapest full completion. Do not compare bests across changed prices, objectives or seed/rules without a clearly non-equivalent label. Never replay an old action schedule against the already-upgraded final architecture.

## Ladder and objectives

#154 calibrates strategies before #155 publishes a small level set. No assumed infinite +RPS progression, permanent power or pre-approved level count. Each level has an explicit objective/unlock condition, reachable strategies and a real next-level target or end state.

Candidate objective families: survival, availability, budget/cost efficiency, NBV, minimal customer loss and reduced bot waste. Numerical thresholds must be calibrated; examples from planning are not current contracts. Objective evaluation cannot silently mutate workload.

## Modifiers and boss windows (P1)

#160 needs a typed allowlist, validation ranges, deterministic application order, duplicate/conflict policy, clamp/reject semantics and versioned outputs. Candidate dimensions include demand, budget, mix, bots or disabled actions. Price/provisioning overrides change truth and require explicit approval/test-first contracts. Apply each transformation exactly once.

#161 evaluates workload families and bounded peak windows; not all named examples are promised releases. Read-heavy and write-heavy challenges must preserve their distinct paths. No Cache fix for Order writes; no hidden new queue semantics. Verify phase coverage, boundaries and outcome ranges.

## Daily challenges (P1)

#162 proposes UTC calendar date → stable versioned seed → validated challenge configuration. Freeze date/config at run start. Test timezone differences, midnight, leap day, clock changes, reload and version upgrades. No uncontrolled `Math.random`, mid-run reroll or silent mutation. Client-only dates are not trusted anti-cheat or global leaderboards; disclose offline/clock limits.

## Persistence and acceptance

#156/#163 must define schema versions, bounds/retention, migrations, duplicate save handling and reset/failure behavior. Store only necessary local game data. Challenge identity, initial architecture and ordered actions are required for reproducible comparison, not merely a final resource list.

No new code or simulation constants are delivered by this proposal. Tests must precede materialization/evaluation/storage implementation, preserve legacy reference outcomes and prove same inputs repeat exactly under the existing comparison convention. #159 human replayability gates P1, independently of green tests.
