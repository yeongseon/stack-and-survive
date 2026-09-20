# Architecture strategy balance

> Versioned evidence: the introduction summarizes 0.3 calibration and tables retain 0.2 observations. Current play is 0.4; SQL tiers/read replicas and scale-in are supported under [Infrastructure Scaling](INFRASTRUCTURE_SCALING.md). Old unsupported-SQL statements apply only to the legacy schedules, not today's action set. No historical result is retuned here.

Version: 0.3. Current economy/waves and five measured live strategies are in [Simulation Specification](SIMULATION_SPEC.md) and `sprint-balance.test.ts`: initial75 Upgrade Funds,10% successful-revenue reinvestment and eight attack/recovery phases. Cache-scale A16/C17/A57/A102 completes at100% with26.473067 funds; prepared layers A16/C17/E57/A57 at99.620116% with26.159026; early maximum C0/E0/A0/A8/A16 leaves2.565605. These are request ticks with unchanged activation delays, not globally optimal strategy claims. **The tables below are historical0.2**, still covered by `reference.test.ts`/`strategy-evidence.test.ts` against explicit legacy fixtures, not current balance estimates.

## Existing Black Friday evidence

These are preconfigured, no-action canonical reference fixtures, not ordinary live deployment timing guarantees:

| Fixture | Reference outcome |
|---|---|
| App1 + SQL, no Cache/Edge | Fails at 50s; score 1073 |
| App4 + SQL, no Cache/Edge | Fails at 140s; score 5172 |
| App4 + Cache, no Edge | Completes 180s; score 8500 |
| Edge + App3 + Cache | Completes 180s; score 9450 |
| Edge + App4 + Cache | Completes 180s; score 8892 |

Live ordinary play begins at App1 without Cache/Edge; action timings, initial state and missed business before activation change outcomes. Do not paste a preconfigured score into a live-run promise.

App1/220 RPS restricts work at App and does not make SQL critical. App scaling cannot enlarge SQL, Cache does not remove writes, and bots consume App only. Diagrams omitting the mandatory direct write edge are not valid full architectures.

## Strategy families are hypotheses, not guaranteed wins

| Family | Question to measure | Limitation |
|---|---|---|
| Scale-oriented | Does earlier compute preserve more business? | Cost rises; SQL remains constrained; App4 alone fails current full Black Friday |
| Cache-oriented | Do avoided reads improve SQL and NBV enough? | Writes unaffected; insufficient App may still fail |
| Edge-oriented | Is bot displacement worth filtering cost/false positives? | Little benefit on bot-free demand; does not solve SQL limits |
| Balanced | Does combined protection/read relief justify cost/timing? | More deployment decisions; no universal superiority claim |

SQL upgrades were unsupported in the historical 0.2 schedules below; current 0.4 supports SQL tiers/read replicas. Async/Queue/Functions remain absent. Do not reinterpret legacy measurements or silently change 0.2 to force a desired story.

## Calibration method (#154)

1. Record scenario/rules version, initial architecture, exact accepted action schedule, duration and termination.
2. Measure actual availability, cost, NBV, App/SQL peaks, bot waste and Cache use. Add authoritative metrics/contracts before claiming unrecorded dimensions.
3. Compare objective-valid full completions separately from failures. Evaluate Pareto tradeoffs for the tested set, not universal global optimality.
4. Identify at least three reachable viable schedules for the intended introductory challenge. If current Black Friday cannot support the intended diversity, propose a separately versioned calibrated workload/rule change for approval.
5. Predeclare ranges/objectives and test deterministic boundaries before merging changes. Preserve legacy fixtures, or explicitly approve a versioned change with a documented reason.

No claim that every family must win every workload. Publish actual measured tables rather than illustrative stars, arbitrary low costs or invented NBV values. Human #159 must still show that players perceive alternatives and want to experiment.

## Live-action measurement (#154)

All plans begin with `baseline()` (Internet/App1/SQL), no Cache/Edge, the unchanged `blackFridayChallenge` v1, rules0.2, fixed-v1 seed0 and survive objective. Times below are **request ticks**, not activation ticks. App takes8s, Cache5s, Edge4s; normal gameplay and direct SQL writes remain unchanged. Each plan is repeated and checked for exact deterministic result equality. Actions are sequenced in listed order and all must be accepted.

Notation: `A(t)` scale-out, `C(t)` Cache deployment, `E(t)` Edge deployment, `B(t)` emergency filtering boost.

| Plan | Ordered action requests |
|---|---|
| no-action | none |
| scale-only | A20, A60, A110 |
| cache-scale | A20, C65, A66, A110 |
| edge-scale | A20, E65, A110 |
| balanced | A20, C65, E66, A110 |
| just-in-time-balanced | A22, C70, E71, A112 |
| emergency-bridge | A22, C70, E71, B120, A142 |

| Plan | Status/time | Availability | Infrastructure + emergency cost | NBV | Score | Bots passed rate limit / processed at App |
|---|---|---:|---:|---:|---:|---:|
| no-action | failed50s | 81.0811% | 14.1667 + 0 | 51.3733 | 1073 | 0 / 0 |
| scale-only | failed140s | 94.1414% | 56.8333 + 0 | 283.3367 | 5296 | 6700 / 6700 |
| cache-scale | completed180s | 100% | 92.3333 + 0 | 391.3867 | 8500 | 14700 / 14700 |
| edge-scale | failed140s | 94.0626% | 54.3833 + 0 | 284.6410 | 6339 | 2010 / 2010 |
| balanced | completed180s | 99.6415% | 89 + 0 | 392.5523 | 9478 | 4410 / 4410 |
| just-in-time-balanced | completed180s | 99.6547% | 87.75 + 0 | 393.8820 | 9481 | 4410 / 4410 |
| emergency-bridge | completed180s | 98.2825% | 85.25 + 8 | 380.0852 | 9329 | 3210 / 3179.6947 |

Values are rounded for the table; executable expectations use six-decimal tolerance plus exact repeated results. Failed runs terminate on availability. Their smaller totals cover less demand and are **not** eligible low-cost full-run records. All live Cache plans have approximately80% cache hit ratio over eligible reads; no-Cache ratio is null. These numbers are observations from the existing engine, not independent mathematical reference derivations like the older canonical matrix.

| Successful plan | App peak | SQL read peak | SQL write peak | Bot-displacement business opportunity lost |
|---|---:|---:|---:|---:|
| cache-scale | 83.3333% | 97.7778% | 85.7143% | 0 |
| balanced | 85.6000% | 97.7778% | 85.2857% | 0 |
| just-in-time-balanced | 85.6000% | 97.7778% | 85.2857% | 0 |
| emergency-bridge | 119.5000% | 97.7778% | 85.2857% | 4.0275 credits |

The first bot column sums `requests.rateLimit.passed.bot` (after filtering/limiting, before App capacity rejection); the second sums `requests.app.accepted.bot`. Both come from per-tick snapshots, not estimates from final architecture. Bot displacement is the existing attribution counterfactual, not infrastructure cost. App, Cache and SQL peaks come directly from result attribution and are pinned by numerical assertions.

Within these seven schedules, four complete the unchanged challenge. Compare only those completions across higher availability/NBV, lower total running+emergency cost, lower processed bot waste and lower App/SQL peaks. The nondominated subset is **cache-scale, just-in-time-balanced, emergency-bridge**. Balanced is dominated by the measured just-in-time variant. Cache-scale trades higher availability for more cost/bot waste; emergency-bridge reduces processed bots but costs more in total and loses more customers. Score is reported, not used to manufacture Pareto diversity.

This establishes at least three viable schedules without changing the existing default introductory challenge. It does not establish all named strategy families as viable, optimal human timing, or global balance. In particular App-only/Edge-only still fail SQL, and the timed schedules are test fixtures, not instructions the UI should force. Further beginner levels require separately defined/verified content in #155; write-heavy scenarios and new resources remain future scope.
