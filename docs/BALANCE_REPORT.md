# Balance Simulation Report

> Historical rules 0.3 strategy observations. Do not recalculate or relabel these numbers as current 0.4 benchmarks. Current tier/instance/replica measurements are in [Infrastructure Scaling](INFRASTRUCTURE_SCALING.md); [Current status](CURRENT_STATUS.md) owns deployment and evidence limits.

## Test Configuration

- Commit: `47188e2` (adversarial QA baseline, updated in strengthening pass)
- Scenario: Black Friday only (`blackFridayChallenge`, balance v0.3, budget 75, duration 180s)
- Starting architecture: `canonicalPlayerStart()` (internet + 1x compute + 1x database)
- Simulation: fully deterministic (no randomness in traffic or simulation)
- Compared: hand-authored mitigation/action strategies, all starting from the same architecture
- Not yet proven: cross-scenario architecture balance, different starting architectures

## Strategy Results — Black Friday

All strategies start from `canonicalPlayerStart()` and differ only by action schedule (when to scale, deploy cache/edge, activate rate limiting, or use emergency WAF).

| Strategy | Status | Elapsed | Availability | Score | Infra Cost | Budget Left |
|----------|--------|---------|-------------|-------|------------|-------------|
| doNothing | FAILED | ~50 | ~81% | ~1073 | ~14 | varies |
| scaleOnly | FAILED | ~140 | ~90-94% | ~4305 | ~51 | varies |
| cacheScale | COMPLETED | 180 | 100% | 8500 | ~120 | varies |
| edgeScale | FAILED | ~140 | ~94% | ~6339 | varies | varies |
| balanced | COMPLETED | 180 | ~99.6% | ~9478 | varies | varies |
| earlyAllIn | COMPLETED | 180 | varies | varies | varies | varies |
| lateScale | FAILED | <180 | varies | <8500 | varies | varies |
| rateLimitOnly | FAILED | <180 | varies | low | varies | varies |

*Values are deterministic but shown as approximate since exact values depend on the scenario version. Run the tests to get exact current values.*

## Dominance Analysis

Among the tested Black Friday strategies, no completing strategy was observed to Pareto-dominate all other completing strategies under the metrics: score, availability, infrastructure cost, and remaining budget.

The `balanced` strategy (cache + edge + scale) achieves the highest score but also incurs higher infrastructure costs than `cacheScale`. This trade-off is intentional: the score system rewards bot filtering (15% security weight) which requires edge deployment, but edge deployment costs money.

## Key Finding: Cache is Nearly Mandatory

For the Black Friday scenario, cache deployment is effectively required for completion:

- **cacheScale** (with cache): COMPLETED, 100% availability, score 8500
- **edgeScale** (without cache): FAILED at ~tick 140

This is because SQL read capacity (180/tick) becomes the binding constraint during peak traffic phases. Cache reduces SQL read demand by 80%, which is necessary to sustain availability above the 20-tick failure threshold.

This is architecturally realistic (caching is a standard cloud scaling pattern) but limits viable strategies to those that include cache deployment.

## Workload Pressure by Phase

| Phase | Time | RPS | Bot Ratio | Pressure Level |
|---|---|---|---|---|
| 1 | 0-15 | 100 | 0% | Low |
| 2 | 15-45 | 200 | 10% | Moderate |
| 3 | 45-75 | 300 | 20% | High |
| 4 | 75-105 | 400 | 30% | Very high |
| 5 | 105-135 | 500 | 35% | Critical |
| 6 | 135-150 | 600 | 40% | Peak |
| 7 | 150-165 | 500 | 45% | High + bots |
| 8 | 165-180 | 300 | 30% | Cooldown |

Difficulty increases gradually with no cliff. The do-nothing failure point (~tick 50, phase 3) is appropriate — players have ~50 seconds to take meaningful action.

## Score System

| Component | Weight | Rewards |
|---|---|---|
| Reliability | 40% | Availability (9.9-100%) |
| Latency | 20% | Meeting SLA target |
| Business Value | 25% | Net revenue vs cost |
| Security | 15% | Bot filtering effectiveness |

Penalties: failure -1500, overprovisioning -500 (cost > 120 AND utilization < 50%), negative-value cap 3000.

No score farming exploit found: score is calculated once at termination, never during gameplay.

## Strategy Differentiation Evidence

- 4+ distinct score levels across 8 strategies
- cache+scale vs edge+scale produce different availability and different outcomes
- Late scaling (after tick 100) performs strictly worse than timely scaling (tick 16+)
- Rate-limit-only is not viable — cannot compensate for insufficient compute capacity
- Random-valid player actions produce lower median scores than intentional strategies

## Important Limitations

- **Single scenario**: Only Black Friday tested. Cross-scenario balance is unverified.
- **Single starting architecture**: All strategies start from `canonicalPlayerStart()`. Different initial architectures are not compared.
- **Deterministic workload**: No randomness in traffic generation. Seed sensitivity analysis is not applicable.
- **Hand-authored strategies**: The strategy set is not exhaustive. Undiscovered optimal strategies may exist.

## Recommended Post-Hackathon Changes

- Additional scenarios with different bottleneck profiles (e.g., SQL-write-heavy, latency-sensitive)
- Visual feedback explaining which bottleneck caused failure
- Consider making edge deployment more independently valuable
