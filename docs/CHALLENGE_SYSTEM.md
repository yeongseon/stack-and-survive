# Challenge system

Version: 0.5. #153 identity, #154 strategies, #155 ladder, #156 records and #157/#158 profiles/results are delivered. Rules 0.4 scaling arrived through #305. Modifier/daily proposals remain retired scope, not approved numeric changes.

Current #305 update: ordinary challenge content version is 2 and rulesVersion/workload balanceVersion are 0.4 and must match. Three objectives remain; 0.4 adds infrastructure scaling without replacing the 0.3 workload/economy. Legacy 0.2/0.3 identities remain distinct. Current progress key is `stack-and-survive.progress.balance-0.4.v1`; old keys remain untouched. Profiles/results are implemented; modifiers/daily are retired scope.

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

`@stack-and-survive/scenarios/challenge` defines `parseChallenge`, `blackFridayChallenge`, `sameChallenge` and `evaluateObjective`. Schema version 1 requires a short id, positive content version, supported rulesVersion (`0.2`, `0.3`, `0.4`) matching workload balance, seedAlgorithm `fixed-v1`, uint32 seed, validated workload and objective. The fixed algorithm does not generate random traffic: the complete schedule is supplied. Seed is an identity coordinate, not evidence of current randomness.

The parser reconstructs properties in a fixed order and calculates a UTF-8 FNV-1a 64-bit fingerprint prefixed `fnv1a64:`. This is a compact non-cryptographic fingerprint, NOT an authenticity/security hash. Comparisons reparse inputs and compare complete canonical conditions, not just the fingerprint. Caller-supplied canonical/hash fields are ignored and regenerated. Unknown fields, unsupported rule/seed versions or modifiers are rejected rather than silently enabled. A future algorithm/rules version must add explicit version handling and tests.

Current objectives are survive and availability (full duration plus target, with existing tolerance). Objective evaluation does not mutate workload/scoring targets. The public default is Black Friday rules 0.4, initial funds 75, duration 180; explicit legacy 0.2 budget 140 and injected test workloads are not current player defaults.

Workload/objective/traffic records are frozen on parse. Application controller captures the actual initial architecture at Start/countdown entry, records ordered runtime action outcomes and attaches challenge/initialArchitecture/objectiveMet/actionLog to its terminal result. The pure engine result remains unchanged. Normal/QA resets retain the selected challenge; QA manual editor UI remains the default Black Friday shell, not a new challenge selector. Switching a TycoonGame challenge requires a new keyed component/controller rather than changing props mid-run.

Local persistence is specified in [Run history](RUN_HISTORY.md); implemented classification in [Architecture Profiles](ARCHITECTURE_PROFILES.md). Existing phase/attribution metrics provide actual served/lost/peak evidence. Same complete identity, initial architecture and action schedule must reproduce results; seed alone is insufficient when content changes.

Compare like conditions, label differences explicitly and retain termination/duration. A failed partial run is not an eligible cheapest full completion. Do not compare bests across changed prices, objectives or seed/rules without a clearly non-equivalent label. Never replay an old action schedule against the already-upgraded final architecture.

## Ladder and objectives

The owner approved exactly three levels after #154 measurements. Current ladder definitions use the same Black Friday rules 0.4 workload and resource contract across objectives:

| Level | Objective | Unlock |
|---|---|---|
| Survive | Complete 180 seconds | Initially available |
| Reliable Business | Complete 180 seconds with cumulative availability ≥ 99% | Complete Survive |
| Customer First | Complete 180 seconds with cumulative availability ≥ 99.9% | Complete Reliable Business |

`scenarios/ladder` stores immutable definitions. `ChallengeApplication` owns level selection; a changed level remounts a fresh `TycoonGame` controller. No upgraded infrastructure or permanent bonuses carry over. Only an objective-valid result with matching full canonical challenge identity unlocks the immediately next level. `objectiveMet` from a record is recomputed rather than trusted. Completing the last level exposes no nonexistent fourth level.

`stack-and-survive.progress.balance-0.4.v1` stores at most three sequential completed canonical identities. Holes, mismatched identities, malformed JSON and unsupported versions reset safely to no completion. This local convenience is not anti-cheat or verified remote achievement evidence. Writes may fail without preventing session progress; title shows a save error. Continue selects the highest unlocked level. Reset affects only the current progress key, not legacy keys, audio/guide or QA saves.

Three full successful browser runs verify sequential unlocking, fresh-world teardown, persistence/reset and final-level behavior. Difficulty appeal and voluntary replay still require #159; success feasibility is not proof of fun.

Candidate objective families: survival, availability, budget/cost efficiency, NBV, minimal customer loss and reduced bot waste. Numerical thresholds must be calibrated; examples from planning are not current contracts. Objective evaluation cannot silently mutate workload.

## Modifiers and boss windows (P1)

#160 needs a typed allowlist, validation ranges, deterministic application order, duplicate/conflict policy, clamp/reject semantics and versioned outputs. Candidate dimensions include demand, budget, mix, bots or disabled actions. Price/provisioning overrides change truth and require explicit approval/test-first contracts. Apply each transformation exactly once.

#161 evaluates workload families and bounded peak windows; not all named examples are promised releases. Read-heavy and write-heavy challenges must preserve their distinct paths. No Cache fix for Order writes; no hidden new queue semantics. Verify phase coverage, boundaries and outcome ranges.

## Daily challenges (P1)

#162 proposes UTC calendar date → stable versioned seed → validated challenge configuration. Freeze date/config at run start. Test timezone differences, midnight, leap day, clock changes, reload and version upgrades. No uncontrolled `Math.random`, mid-run reroll or silent mutation. Client-only dates are not trusted anti-cheat or global leaderboards; disclose offline/clock limits.

## Persistence and acceptance

#156 stores versioned local history with 20 recent attempts and independent objective-valid bests for each approved challenge. Full initial/final architecture, ordered accepted/rejected actions and metrics are replay-validated on load/write. Unsupported versions or corrupt input fall back safely; failed writes preserve session records with retry, and clear removes only the history key. [Run history](RUN_HISTORY.md) defines eligibility, ties, bounds and lifecycle. Future #163 collections need their own versioning, retention and reset contract.

Identity/injection, objective ladder, local history, profiles and result comparisons are implemented. Modifier/daily designs above are historical proposals (#160–#163 closed not planned), not queued work. Tests preserve legacy outputs; comparisons require complete matching challenge records. #159 human replayability remains independent of green tests.
