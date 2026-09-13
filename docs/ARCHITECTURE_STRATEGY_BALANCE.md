# Architecture strategy balance

Version: 0.1. Existing reference evidence is distinguished from #154 future calibration. [Simulation Specification](SIMULATION_SPEC.md) and executable `packages/simulation/src/reference.test.ts` own exact values.

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

SQL-upgrade and async/Queue/Functions examples are not supported current strategies. Do not balance against absent mechanics or silently change v0.2 to force a desired story.

## Calibration method (#154)

1. Record scenario/rules version, initial architecture, exact accepted action schedule, duration and termination.
2. Measure actual availability, cost, NBV, App/SQL peaks, bot waste and Cache use. Add authoritative metrics/contracts before claiming unrecorded dimensions.
3. Compare objective-valid full completions separately from failures. Evaluate Pareto tradeoffs for the tested set, not universal global optimality.
4. Identify at least three reachable viable schedules for the intended introductory challenge. If current Black Friday cannot support the intended diversity, propose a separately versioned calibrated workload/rule change for approval.
5. Predeclare ranges/objectives and test deterministic boundaries before merging changes. Preserve legacy fixtures, or explicitly approve a versioned change with a documented reason.

No claim that every family must win every workload. Publish actual measured tables rather than illustrative stars, arbitrary low costs or invented NBV values. Human #159 must still show that players perceive alternatives and want to experiment.
