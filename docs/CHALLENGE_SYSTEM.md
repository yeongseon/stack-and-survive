# Challenge system

Version: 0.2. #153 implements the initial challenge/identity/objective contract. The ordinary game still exposes one Black Friday challenge; ladder, history, profiles, modifiers and daily progression remain future #154–#163 work. This document is not approval of example numeric modifiers.

## Responsibilities (current versus planned)

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

`@stack-and-survive/scenarios/challenge` defines `parseChallenge`, `blackFridayChallenge`, `sameChallenge` and `evaluateObjective`. Schema version 1 requires a short id, positive content version, rulesVersion `0.2`, seedAlgorithm `fixed-v1`, uint32 seed, validated workload and versioned objective. The fixed algorithm does not generate random traffic: the complete schedule is supplied. A seed is an identity coordinate reserved for future deterministic generation, not evidence that randomness exists now.

The parser reconstructs properties in a fixed order and calculates a UTF-8 FNV-1a 64-bit fingerprint prefixed `fnv1a64:`. This is a compact non-cryptographic fingerprint, NOT an authenticity/security hash. Comparisons reparse inputs and compare complete canonical conditions, not just the fingerprint. Caller-supplied canonical/hash fields are ignored and regenerated. Unknown fields, unsupported rule/seed versions or modifiers are rejected rather than silently enabled. A future algorithm/rules version must add explicit version handling and tests.

Current objective kinds: survive (complete full duration) and availability (complete full duration plus validated target, with the existing numerical tolerance). Workload and its original scoring targets remain unchanged by objective evaluation. The public default remains Black Friday v0.2, budget140, duration180; test-only injected workloads are not new released levels.

Workload/objective/traffic records are frozen on parse. Application controller captures the actual initial architecture at Start/countdown entry, records ordered runtime action outcomes and attaches challenge/initialArchitecture/objectiveMet/actionLog to its terminal result. The pure engine result remains unchanged. Normal/QA resets retain the selected challenge; QA manual editor UI remains the default Black Friday shell, not a new challenge selector. Switching a TycoonGame challenge requires a new keyed component/controller rather than changing props mid-run.

No result-history persistence or architecture-profile classification is introduced here. Existing phase/attribution metrics provide actual served/lost/peak evidence; do not synthesize extra metrics before their contracts exist. Same complete identity plus initial architecture and action schedule must reproduce results. A seed alone is insufficient when content changes.

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

The initial identity/injection contract is delivered by #153; subsequent designs above remain unimplemented. Tests precede materialization/evaluation/storage changes and preserve legacy outputs. New result comparison requires both complete challenge records; mixed legacy/new metadata is explicitly not equivalent. Existing all-legacy session comparison remains compatible. #159 human replayability gates P1, independently of green tests.
