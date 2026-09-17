# Balance Simulation Report

## Test Configuration

- Commit: latest main + adversarial tests
- Simulations: 200+ headless, 140+ controller-driven
- Workloads: Black Friday (180s, balance v0.3, budget 75)
- Architectures: 8 strategies tested
- Deterministic: all results reproducible (no randomness in simulation)

## Architecture Results

| Strategy | Status | Elapsed | Availability | Score | Description |
|----------|--------|---------|-------------|-------|-------------|
| doNothing | FAILED | ~50 | ~81% | ~1073 | No player actions |
| scaleOnly | FAILED | ~140 | ~90-94% | ~4305-5296 | SCALE_OUT only, no cache/edge |
| cacheScale | COMPLETED | 180 | 100% | 8500 | Cache + 3x scale (qualifying) |
| edgeScale | FAILED | ~140 | ~94% | ~6339 | Edge + 3x scale, no cache |
| balanced | COMPLETED | 180 | ~99.6% | ~9478 | Cache + edge + scale (optimal) |
| earlyAllIn | COMPLETED | 180 | varies | varies | Deploy everything at tick 1 |
| lateScale | FAILED | <180 | varies | <8500 | Scale only after tick 100 |
| rateLimitOnly | FAILED | <180 | varies | low | Rate limit without scaling |

## Workload Specialization

### Black Friday (only current scenario)

- **Bot traffic increases over phases** (0% to 45%)
- **Legitimate traffic peaks at 330 RPS** (phase 5-6)
- **Duration**: 180 seconds, 8 traffic phases

Key bottlenecks by architecture:

| Bottleneck | Without mitigation | With mitigation |
|---|---|---|
| App Service saturation | 1 instance = 150 RPS capacity | 4 instances = 600 RPS |
| Unfiltered bots | Compete with legitimate traffic for app capacity | Edge WAF filters 70-90% of bots |
| SQL saturation | 180 reads/tick, 70 writes/tick (independent of app scale) | Cache reduces SQL read pressure by 80% |
| Budget exhaustion | Higher instance costs deplete budget | Revenue reinvestment (10% in v0.3) extends runway |

## Dominant Strategies

**Balanced (cache + edge + scale)** produces the highest score (~9478) but is NOT dominant across all metrics:

- It costs more than cache+scale alone
- Cache+scale (score 8500) is the minimum qualifying strategy with 100% availability
- Trade-off exists: higher score requires higher investment

**No free-ride strategy exists**: doNothing fails at ~tick 50.

## Underperforming Strategies

- **rateLimitOnly**: Rate limiting alone cannot compensate for insufficient capacity
- **lateScale**: Scaling after tick 100 is too late; damage accumulates in phases 3-5
- **edgeScale (no cache)**: Edge helps filter bots but SQL saturation still causes failures without cache
- **scaleOnly (no cache, no edge)**: 4 instances without filtering means bots consume capacity

## Architecture Differentiation

Architecture choice meaningfully affects outcomes:

- **Cache vs no cache**: Reduces SQL read pressure by 80%, enabling completion
- **Edge vs no edge**: Filters 70% of bot traffic at ingress, freeing app capacity
- **Timing matters**: SCALE_OUT at tick 16 vs tick 100 is the difference between COMPLETED and FAILED
- **Combined effects**: Cache + edge + scale produces higher scores than any single mitigation

4+ distinct score levels confirmed across strategies.

## Score System Analysis

Score components (weighted):

| Component | Weight | What it rewards |
|---|---|---|
| Reliability | 40% | Availability (9.9-100%) |
| Latency | 20% | Meeting SLA target |
| Business Value | 25% | Net revenue vs cost |
| Security | 15% | Bot filtering effectiveness |

Penalties:
- Failure: -1500 (didn't complete scenario)
- Overprovisioning: -500 (cost > 120 AND utilization < 50%)
- Negative value cap: max score 3000

The score system rewards:
- Survival (40% reliability + 1500 failure penalty)
- Cost efficiency (25% business value + overprovisioning penalty)
- Security awareness (15% bot filtering)

No score farming exploit found: score is calculated once at termination.

## Difficulty Curve

| Phase | Time | RPS | Bot Ratio | Pressure |
|---|---|---|---|---|
| 1 | 0-15 | 100 | 0% | Low |
| 2 | 15-45 | 200 | 10% | Moderate |
| 3 | 45-75 | 300 | 20% | High |
| 4 | 75-105 | 400 | 30% | Very high |
| 5 | 105-135 | 500 | 35% | Critical |
| 6 | 135-150 | 600 | 40% | Peak |
| 7 | 150-165 | 500 | 45% | High + bots |
| 8 | 165-180 | 300 | 30% | Cooldown |

No cliff detected: pressure increases gradually. Failure point for no-action (~tick 50) is within phase 3, which is appropriate.

## Potential Bugs

None found. All numeric values finite, all invariants hold, all boundaries respected.

## Balance Concerns

- **Single scenario**: Only Black Friday exists. Cannot verify architecture specialization across different workload types.
- **Cache is nearly mandatory**: Without cache, SQL saturation makes completion very difficult. This is architecturally realistic but limits viable strategies.
- **Edge without cache is weak**: Edge helps but doesn't address the SQL bottleneck. Players may not understand why edge alone isn't sufficient.

## Recommended Changes

None required for hackathon. The balance is intentionally designed to reward multi-layer architecture (cache + edge + scale), which aligns with the game's educational message about cloud architecture.

Post-hackathon considerations:
- Additional scenarios with different bottleneck profiles
- Visual feedback explaining WHY a strategy failed (which bottleneck)
- More granular cost/benefit information for player decision-making
