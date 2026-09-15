# Challenge system

Version: 0.4. #153 implements challenge identity; #154 measures live strategies; #155 adds the owner-approved three-objective ladder; #156 adds bounded local records. Profiles, modifiers and daily challenges remain separate work. This document is not approval of example numeric modifiers.

Current #212 update: ordinary challenge rulesVersion/workload balanceVersion are0.3 and must match. Three existing objectives remain unchanged; the new waves/funds are measured in SIMULATION_SPEC. Rules0.2 remain valid only for explicit legacy replay/editor use; `sameChallenge` rejects cross-balance comparison. Current progress key is `stack-and-survive.progress.balance-0.3.v1` (the old key below is historical and untouched). Profiles/results are implemented; modifiers/daily are retired current scope. No new challenge system was added.

## Responsibilities (current versus planned)

| Concept | Responsibility |
|---|---|
| Workload | Validated duration, traffic schedule, request mix and bot proportions |
| Objective | Evaluates business success independently of workload generation |
| Modifier | Typed deterministic allowed transformation with explicit precedence/validation |
| Challenge | Immutable workload/rules/objective/seed identity and level context |
| RunResult | Actual terminal metrics, initial/final architecture, complete action outcomes and challenge identity |
| Profile | Pure descriptive classification of actual behavior/outcomes |
| History / PersonalBest | Bounded versioned eligible local records, not simulation state |
| DailyChallenge | Deterministic UTC-date mapping to an allowed challenge version |

## Identity before comparison

`@stack-and-survive/scenarios/challenge` defines `parseChallenge`, `blackFridayChallenge`, `sameChallenge` and `evaluateObjective`. Schema version 1 requires a short id, positive content version, rulesVersion `0.2`, seedAlgorithm `fixed-v1`, uint32 seed, validated workload and versioned objective. The fixed algorithm does not generate random traffic: the complete schedule is supplied. A seed is an identity coordinate reserved for future deterministic generation, not evidence that randomness exists now.

The parser reconstructs properties in a fixed order and calculates a UTF-8 FNV-1a 64-bit fingerprint prefixed `fnv1a64:`. This is a compact non-cryptographic fingerprint, NOT an authenticity/security hash. Comparisons reparse inputs and compare complete canonical conditions, not just the fingerprint. Caller-supplied canonical/hash fields are ignored and regenerated. Unknown fields, unsupported rule/seed versions or modifiers are rejected rather than silently enabled. A future algorithm/rules version must add explicit version handling and tests.

Current objective kinds: survive (complete full duration) and availability (complete full duration plus validated target, with the existing numerical tolerance). Workload and its original scoring targets remain unchanged by objective evaluation. The public default remains Black Friday v0.2, budget140, duration180; test-only injected workloads are not new released levels.

Workload/objective/traffic records are frozen on parse. Application controller captures the actual initial architecture at Start/countdown entry, records ordered runtime action outcomes and attaches challenge/initialArchitecture/objectiveMet/actionLog to its terminal result. The pure engine result remains unchanged. Normal/QA resets retain the selected challenge; QA manual editor UI remains the default Black Friday shell, not a new challenge selector. Switching a TycoonGame challenge requires a new keyed component/controller rather than changing props mid-run.

Local result-history persistence is specified in [Run history](RUN_HISTORY.md); architecture-profile classification remains separate work. Existing phase/attribution metrics provide actual served/lost/peak evidence; do not synthesize extra metrics before their contracts exist. Same complete identity plus initial architecture and action schedule must reproduce results. A seed alone is insufficient when content changes.

Compare like conditions, label differences explicitly and retain termination/duration. A failed partial run is not an eligible cheapest full completion. Do not compare bests across changed prices, objectives or seed/rules without a clearly non-equivalent label. Never replay an old action schedule against the already-upgraded final architecture.

## Ladder and objectives

The owner approved exactly three levels after #154 measurements. Every level uses unchanged Black Friday v0.2 workload, prices, capacity, duration and provisioning:

| Level | Objective | Unlock |
|---|---|---|
| Survive | Complete 180 seconds | Initially available |
| Reliable Business | Complete 180 seconds with cumulative availability ≥ 99% | Complete Survive |
| Customer First | Complete 180 seconds with cumulative availability ≥ 99.9% | Complete Reliable Business |

`scenarios/ladder` stores immutable definitions. `ChallengeApplication` owns level selection; a changed level remounts a fresh `TycoonGame` controller. No upgraded infrastructure or permanent bonuses carry over. Only an objective-valid result with matching full canonical challenge identity unlocks the immediately next level. `objectiveMet` from a record is recomputed rather than trusted. Completing the last level exposes no nonexistent fourth level.

`stack-and-survive.progress.v1` stores at most three sequential completed canonical identities. Holes, mismatched identities, malformed JSON and unsupported versions reset safely to no completion. This local convenience is not anti-cheat or verified remote achievement evidence. Writes may fail without preventing in-session progress; title shows a save error. Continue selects the highest unlocked level; replaying an earlier level is allowed. Reset challenge progress resets only this key, not audio/guide preferences or QA architecture saves.

Three full successful browser runs verify sequential unlocking, fresh-world teardown, persistence/reset and final-level behavior. Difficulty appeal and voluntary replay still require #159; success feasibility is not proof of fun.

Candidate objective families: survival, availability, budget/cost efficiency, NBV, minimal customer loss and reduced bot waste. Numerical thresholds must be calibrated; examples from planning are not current contracts. Objective evaluation cannot silently mutate workload.

## Modifiers and boss windows (P1)

#160 needs a typed allowlist, validation ranges, deterministic application order, duplicate/conflict policy, clamp/reject semantics and versioned outputs. Candidate dimensions include demand, budget, mix, bots or disabled actions. Price/provisioning overrides change truth and require explicit approval/test-first contracts. Apply each transformation exactly once.

#161 evaluates workload families and bounded peak windows; not all named examples are promised releases. Read-heavy and write-heavy challenges must preserve their distinct paths. No Cache fix for Order writes; no hidden new queue semantics. Verify phase coverage, boundaries and outcome ranges.

## Daily challenges (P1)

#162 proposes UTC calendar date → stable versioned seed → validated challenge configuration. Freeze date/config at run start. Test timezone differences, midnight, leap day, clock changes, reload and version upgrades. No uncontrolled `Math.random`, mid-run reroll or silent mutation. Client-only dates are not trusted anti-cheat or global leaderboards; disclose offline/clock limits.

## Persistence and acceptance

#156 stores versioned local history with 20 recent attempts and independent objective-valid bests for each approved challenge. Full initial/final architecture, ordered accepted/rejected actions and metrics are replay-validated on load/write. Unsupported versions or corrupt input fall back safely; failed writes preserve session records with retry, and clear removes only the history key. [Run history](RUN_HISTORY.md) defines eligibility, ties, bounds and lifecycle. Future #163 collections need their own versioning, retention and reset contract.

Identity/injection, the approved objective ladder and local history are implemented; profile/modifier/daily designs above remain separate. Tests precede materialization/evaluation/storage changes and preserve legacy outputs. New result comparison requires both complete challenge records; mixed legacy/new metadata is explicitly not equivalent. Existing all-legacy session comparison remains compatible. #159 human replayability gates P1, independently of green tests.
