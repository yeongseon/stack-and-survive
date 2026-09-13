# Stack & Survive

## Simulation Specification

## Additive live deployment contract (#115)

Live Cache/Edge deployment is a supported runtime action in the normal tycoon game. This action contract preserves v0.2 balance constants and fixed-architecture reference outputs; preparation editing remains a separate QA capability.

`DEPLOY_RESOURCE(kind: cache | edge, x, y, time, sequence)` follows the existing RUNNING-only action ordering, timestamp and monotonic-sequence validation. Reject duplicate installed/pending kinds or IDs, nonfinite/out-of-build-area positions and insufficient budget for one current-plus-new-resource infrastructure tick. This affordability check reserves/charges nothing.

At accepted tick `t`, insert a disconnected resource with existing provisioning duration (Cache5 seconds; Edge4). Its remaining value is derived from absolute `due=t+duration`. Through ticks before `due`, old ingress/read/write paths remain valid, the new resource processes no requests and incurs no running cost. At the start of tick `due`, before traffic and economy processing, set remaining to zero and connect Cache as App→Cache→SQL, or replace direct Internet→App with Internet→Edge→App. Direct App→SQL writes are retained. Running costs begin in that activation tick with no retroactive charge. Pause freezes runtime time and deployment; terminal states reject actions. Concurrent distinct expansions are allowed, duplicate ones are rejected. Existing rate, emergency, scale, revenue, latency, failure and scoring rules remain unchanged. No queued-request storage is introduced.

**Version:** 0.2  
**Status:** Hackathon MVP Simulation Definition  
**Related Documents:** `PRD.md`, `GAMEPLAY_SPEC.md`, `TECHNICAL_DESIGN.md`  
**Primary Provider:** Microsoft Azure  
**Simulation Type:** Deterministic, discrete-time simulation  
**MVP Scenario:** Black Friday  

---

# 1. Purpose

This document defines the authoritative simulation rules for the Stack & Survive Hackathon MVP.

The document answers:

> Given an architecture, workload, and player actions, what happens?

Document responsibilities:

- `PRD.md` — Product definition and goals
- `GAMEPLAY_SPEC.md` — Player-facing gameplay behavior
- `SIMULATION_SPEC.md` — Simulation rules and authoritative gameplay values
- `TECHNICAL_DESIGN.md` — Software implementation architecture

This document is the source of truth for:

- Request routing
- Resource capacity
- Resource utilization
- Scaling
- Cache behavior
- WAF behavior
- Rate limiting
- Latency
- Availability
- Revenue
- Infrastructure cost
- Incident loss
- Failure
- Bottleneck attribution
- Architecture Score

Numerical rules here supersede illustrative numbers in the PRD and other documents. Version 0.2 corrects balance and deterministic boundary rules; the reference calculations in section 110 are arithmetic checks, not results from an implemented game or player playtests.

---

# 2. Simulation Philosophy

The MVP simulation must be:

- Deterministic
- Explainable
- Testable
- Simple enough to balance
- Conceptually aligned with Azure
- Independent from rendering

The same:

```text
Architecture
+
Scenario
+
Player Actions
```

must produce the same:

```text
Simulation Result
```

No random number generation is required for the MVP.

---

# 3. Azure Fidelity Principle

> **Simplify Azure. Never teach it incorrectly.**

The simulation should preserve:

- Resource roles
- Dependency relationships
- Request direction
- Independent resource capacity
- Scale-out concepts
- Caching concepts
- Security-path concepts
- Operational trade-offs

The simulation does **not** attempt to reproduce exact Azure performance.

Values such as:

```text
App Service Capacity = 150 req/s
```

mean:

> This is the relative capacity of the resource in the Stack & Survive game model.

They do not mean:

> Azure App Service actually processes exactly 150 requests per second.

---

# 4. Numerical Abstraction

The following values are intentionally game abstractions:

- Requests per second
- Resource capacity
- Resource latency
- Provisioning duration
- Resource running cost
- Cache hit ratio
- WAF filtering rate
- False-positive rate

They exist to create predictable architecture trade-offs.

They must never be presented as Azure performance guarantees.

---

# 5. Simulation Boundary

The MVP simulation includes:

```text
Internet Traffic
Protected Edge / WAF
App Service
Azure Managed Redis
Azure SQL
```

It does not simulate:

- Physical Azure infrastructure
- App Service worker internals
- Azure front ends
- VNet routing
- DNS
- TCP
- TLS
- Storage latency
- App Service Plans in detail
- Actual SQL DTU/vCore behavior
- Autoscale internals
- Actual WAF rule evaluation
- Real Azure billing

These may be introduced in later versions when they create meaningful gameplay.

---

# 6. Simulation Time Model

The MVP uses a fixed simulation timestep.

```text
Simulation Tick:
1 second
```

Each tick represents one second of game time.

Traffic values use rates such as:

```text
300 requests / second
```

Because one tick represents one second:

```text
300 req/s
=
300 requests processed during the tick
```

The renderer may animate continuously between simulation ticks.

Rendering frame rate does not affect simulation results.

Tick `t` processes `[t, t + 1)`. Phase intervals are half-open `[start, end)`; a 180-second run processes ticks 0 through 179 exactly once. The resulting snapshot identifies `tickStart = t` and `elapsedTime = t + 1`. Events due at `t` take effect before traffic for that tick.

---

# 7. Why 1-Second Ticks

A one-second timestep is sufficient for MVP concepts such as:

- Traffic waves
- Resource saturation
- Provisioning delays
- Failure windows
- Scaling actions
- Revenue
- Cost

It also makes:

- Debugging easier
- Replay deterministic
- Automated tests simpler
- Simulation logs human-readable

Future versions may use a smaller timestep if required.

---

# 8. Simulation States

The simulation has the following states:

```text
PREPARATION → RUNNING ↔ PAUSED
                 ↓
           COMPLETED / FAILED
                 ↓
            PREPARATION
```

## PREPARATION

Architecture may be modified by headless/QA preparation tools. Normal play begins from a fixed validated baseline without preparation editing.

No runtime cost accumulates.

Preparation has a separate integer preparation clock. Explicit preparation steps advance deployment timers without advancing scenario time, traffic, revenue, or costs. Headless callers can advance those steps directly; wall-clock time never enters simulation calculations. Start requires a valid graph and readiness of every resource on an active path, and initializes scenario time to zero.

Preparation timers freeze outside PREPARATION. A completely disconnected optional resource placed by QA preparation tools may still be provisioning when traffic starts; without an accepted runtime deployment timer it remains pending, inert, and unbilled until preparation resumes. Runtime provisioning applies to accepted App scale-out and live Cache/Edge deployment actions. These clocks are distinct: no resource finishes merely because wall-clock time passed while a different clock was active.

## RUNNING

Traffic and simulation advance.

## PAUSED

Simulation time does not advance.

## COMPLETED

Final traffic phase finished without hard failure.

## FAILED

A hard-failure condition was reached.

Completed/failed attempts are immutable: timers, costs, and traffic stop. Headless `retryRuntime` and QA Redesign & Retry create fresh PREPARATION from the current architecture, preserving layout, connections, completed active instances and resource `remaining` values. Clear accepted scale-out/deployment timers without granting unfinished capacity; pending resources can finish on the preparation clock. Clear runtime counters, totals, pending runtime actions, rate limiting, and emergency usage. QA previous results remain separate. Ordinary Play again instead creates the fixed one-instance baseline through the title, not architecture-preserving retry.

On QA browser reload, restore saved resources and completed instance counts into PREPARATION. An unfinished new-resource deployment restarts its full preparation delay; an unfinished scale-out is not saved. Never restore an active scenario or grant unfinished capacity for free. Ordinary player mode has no architecture persistence and reloads into a fresh title/baseline.

---

# 9. MVP Architecture Constraints

The MVP supports one logical application stack.

Required:

```text
1 Internet Source
1 App Service
1 Azure SQL
```

Optional:

```text
0 or 1 Protected Edge
0 or 1 Cache
```

App Service scale-out is represented through instance count rather than additional logical App Service buildings.

Example:

```text
App Service

Instances:
3
```

Future versions may support multiple independent applications.

---

# 10. Valid Ingress Paths

MVP supports exactly one active ingress path.

Valid:

```text
Internet
   ↓
App Service
```

or:

```text
Internet
   ↓
Protected Edge
   ↓
App Service
```

The following is not supported in MVP:

```text
           ┌→ App Service
Internet ──┤
           └→ WAF → App Service
```

Multiple simultaneous ingress paths are Post-MVP.

---

# 11. Valid Data Connections

Required:

```text
App Service → Azure SQL
```

Optional cache path:

```text
App Service → Cache → Azure SQL
```

When Cache exists, the direct App Service → Azure SQL connection remains valid because write traffic bypasses Cache.

Conceptually:

```text
App Service
   ├──────→ Azure SQL
   │        Write Traffic
   │
   └→ Cache → Azure SQL
      Read Miss
```

The player does not configure routing percentages manually.

---

# 12. Request Routing Rule

Routing is determined by:

```text
Business Request Type
+
Architecture Graph
```

not by physical resource location.

The engine automatically chooses the relevant path.

### Validation and active-path contract

- IDs must be unique, every edge endpoint must exist, and resource kinds/counts must satisfy section 9. Reject unsupported definitions, self-loops, cycles, and reversed/unsupported edges with an explicit reason.
- Allowed edges are Internet → App, Internet → Edge, Edge → App, App → SQL, App → Cache, Cache → SQL. Collapse duplicate identical edges before evaluation.
- Require exactly one complete ingress path and the direct App → SQL edge. Do not allow both ingress routes to carry traffic simultaneously.
- An optional resource is either completely disconnected (zero incident edges, inert but billable once active), or fully connected on its defined path. A partly connected Edge or Cache blocks Start with an explanation; do not silently bypass a malformed path.
- When the complete cache path is present and active, Browse uses it; Order always uses the direct SQL edge. Cache diagrams elsewhere are shorthand and do not remove the required direct write connection.
- During RUNNING and PAUSED, no free-form placement, removal, manual connection, or instance reduction is allowed. RUNNING permits accepted scale-out and additive `DEPLOY_RESOURCE` actions for Cache/Edge; the latter wire supported routes atomically on activation as defined above. PAUSED permits no new live action. Runtime instance increases only occur through accepted scale-out.
- Preparation allows instance reduction to a minimum of one completed instance, free of charge. Increasing instances uses the same sequential eight-step provisioning delay as runtime, without running cost.
- Validate scenario numbers before use: all finite; capacities, latency bases, duration, and score targets positive; costs/revenues nonnegative; ratios in `[0,1]`; business ratios sum to 1 within `1e-9`. Normalize an accepted near-one business mix once at loading.
- Phases must have integer boundaries, positive lengths, and contiguous coverage of `[0,duration)` with no gaps/overlap. RPS is nonnegative and at most 1,000 for this MVP contract. Reject malformed data rather than corrupting state.

---

# 13. MVP Request Types

The MVP supports three traffic classes:

```text
Browse
Order
Bot
```

---

# 14. Browse Request

Browse represents read-oriented legitimate user traffic.

Without Cache:

```text
Internet
   ↓
Edge, if active
   ↓
App Service
   ↓
Azure SQL Read
```

With Cache:

```text
Internet
   ↓
Edge
   ↓
App Service
   ↓
Cache
 ├─ HIT → Success
 └─ MISS
      ↓
   Azure SQL Read
```

---

# 15. Order Request

Order represents write-oriented legitimate business traffic.

```text
Internet
   ↓
Edge, if active
   ↓
App Service
   ↓
Azure SQL Write
```

Order requests do not benefit from the MVP cache mechanic.

---

# 16. Bot Request

Bot traffic represents unwanted automated requests.

```text
Internet
   ↓
Protected Edge, if present
   ↓
App Service
```

Bot requests:

- Consume App Service capacity if not filtered
- Generate no business revenue
- Do not generate SQL traffic in MVP

This is an intentional simplification.

Future scenarios may include database-intensive malicious traffic.

---

# 17. Traffic Definition

For every traffic phase:

```text
Total RPS
Bot Ratio
Business Mix
```

are defined.

Example:

```text
Total Traffic:
300 req/s

Bot Ratio:
20%

Remaining Legitimate Traffic:
240 req/s
```

Legitimate traffic is then split by business mix.

Example:

```text
Browse:
80%

Order:
20%
```

Result:

```text
Browse:
192 req/s

Order:
48 req/s

Bot:
60 req/s
```

---

# 18. Traffic Split Formula

For each tick:

```text
BotTraffic =
IncomingTraffic × BotRatio
```

```text
LegitimateTraffic =
IncomingTraffic - BotTraffic
```

```text
BrowseTraffic =
LegitimateTraffic × BrowseRatio
```

```text
OrderTraffic =
LegitimateTraffic × OrderRatio
```

Business mix must sum to:

```text
1.0
```

---

# 19. MVP Resource Balance Table

> **All values in this section are gameplay balancing values. They are not Azure performance specifications or pricing data.**

| Resource | MVP Capacity / Effect | Base Latency | Running Cost |
|---|---:|---:|---:|
| App Service Instance | 150 req/s | 60 ms | 5 credits/min |
| Azure SQL Read | 180 req/s | 50 ms | included in SQL cost |
| Azure SQL Write | 70 req/s | 70 ms | included in SQL cost |
| Azure SQL | — | — | 12 credits/min |
| Azure Managed Redis | 500 req/s | 8 ms | 8 credits/min |
| Protected Edge | 1,000 req/s | 15 ms | 3 credits/min |

---

# 20. App Service Configuration

MVP App Service rules:

```text
Initial Instances:
1

Maximum Instances:
4

Capacity Per Instance:
150 req/s

Scale-Out Provisioning:
8 sec

Cost Per Active Instance:
5 credits/min
```

Effective App Service capacity:

```text
AppCapacity =
ActiveInstances × 150
```

Example:

```text
1 Instance = 150 req/s
2 Instances = 300 req/s
3 Instances = 450 req/s
4 Instances = 600 req/s
```

---

# 21. App Service Utilization

```text
AppUtilization =
AppIncomingTraffic / AppCapacity
```

Example:

```text
Incoming:
225 req/s

Capacity:
300 req/s

Utilization:
75%
```

---

# 22. App Request Acceptance

When demand exceeds capacity:

```text
AppAccepted =
min(AppIncomingTraffic, AppCapacity)
```

```text
AppDropped =
max(0, AppIncomingTraffic - AppCapacity)
```

---

# 23. Proportional App Admission

When App Service is overloaded, the MVP distributes capacity proportionally across request classes.

Example:

```text
Incoming

Browse  160
Order    40
Bot     100

Total   300

App Capacity
240
```

Acceptance ratio:

```text
240 / 300
=
80%
```

Therefore:

```text
Browse Accepted
128

Order Accepted
32

Bot Accepted
80
```

This avoids hidden request prioritization in MVP.

For zero incoming traffic, the admission ratio is 1 and every accepted count is 0. Required active capacities are positive by validation. Disconnected/provisioning resources expose utilization as `null` (N/A), not a division by zero, and contribute no traffic.

Priority-based routing is Post-MVP.

---

# 24. Cache Configuration

MVP Cache rules:

```text
Capacity:
500 eligible read req/s

Hit Ratio:
80%

Base Latency:
8 ms

Running Cost:
8 credits/min
```

Only Browse traffic is cache-eligible.

Cache utilization is eligible Browse demand divided by 500, before overflow handling. Effective tick/final hit ratio is hits divided by eligible traffic over the same interval; with zero eligible traffic it is `null`. The configured 80% hit rate and measured effective hit ratio are distinct.

---

# 25. Cache Processing

```text
EligibleReadTraffic =
Browse Requests Accepted By App Service
```

```text
CacheProcessed =
min(EligibleReadTraffic, CacheCapacity)
```

```text
CacheHits =
CacheProcessed × CacheHitRatio
```

```text
CacheMisses =
CacheProcessed - CacheHits
```

---

# 26. Cache Capacity Overflow

If eligible traffic exceeds Cache capacity:

```text
CacheOverflow =
max(0, EligibleReadTraffic - CacheCapacity)
```

For MVP:

> Cache overflow is treated as a cache miss and forwarded to Azure SQL.

Therefore:

```text
SQLReadDemand =
CacheMisses + CacheOverflow
```

This is a gameplay abstraction.

It must not be interpreted as guaranteed Azure Managed Redis application fallback behavior.

---

# 27. Cache Example

```text
Browse Traffic:
300 req/s

Cache Capacity:
500 req/s

Hit Ratio:
80%
```

Result:

```text
Cache Hits:
240 req/s

Cache Misses:
60 req/s

Azure SQL Read Demand:
60 req/s
```

---

# 28. Azure SQL Configuration

Azure SQL has separate read and write capacity.

```text
Read Capacity:
180 req/s

Write Capacity:
70 req/s

Running Cost:
12 credits/min
```

This allows workload composition to matter.

---

# 29. SQL Read Demand

Without Cache:

```text
SQLReadDemand =
Accepted Browse Requests
```

With Cache:

```text
SQLReadDemand =
Cache Misses
+
Cache Overflow
```

---

# 30. SQL Write Demand

```text
SQLWriteDemand =
Accepted Order Requests
```

Cache does not reduce write demand.

---

# 31. SQL Request Acceptance

```text
SQLReadAccepted =
min(SQLReadDemand, SQLReadCapacity)
```

```text
SQLWriteAccepted =
min(SQLWriteDemand, SQLWriteCapacity)
```

Dropped database operations:

```text
SQLReadDropped =
max(0, SQLReadDemand - SQLReadCapacity)
```

```text
SQLWriteDropped =
max(0, SQLWriteDemand - SQLWriteCapacity)
```

---

# 32. SQL Utilization

Read utilization:

```text
SQLReadUtilization =
SQLReadDemand / SQLReadCapacity
```

Write utilization:

```text
SQLWriteUtilization =
SQLWriteDemand / SQLWriteCapacity
```

Displayed SQL utilization:

```text
SQLUtilization =
max(
    SQLReadUtilization,
    SQLWriteUtilization
)
```

---

# 33. Successful Browse Requests

With Cache:

```text
SuccessfulBrowse =
CacheHits
+
SQLReadAccepted
```

Without Cache:

```text
SuccessfulBrowse =
SQLReadAccepted
```

---

# 34. Successful Order Requests

```text
SuccessfulOrders =
SQLWriteAccepted
```

---

# 35. Protected Edge / WAF

Protected Edge is the MVP abstraction of an Azure ingress service with WAF protection.

Conceptually it represents an architecture such as:

```text
Internet
   ↓
Application Gateway + WAF
   ↓
App Service
```

The simulation does not attempt to reproduce specific Application Gateway SKUs or WAF rule behavior.

---

# 36. Normal WAF Mode

Initial MVP balancing:

```text
Bot Filtering:
70%

Legitimate False Positive:
0.5%

Protected Edge Capacity:
1,000 req/s

Latency:
15 ms
```

These percentages are game balance values.

They are not Azure WAF effectiveness guarantees.

The 1,000 req/s edge capacity is an MVP supported-input ceiling, not a second admission stage: scenario validation rejects higher RPS. Within supported inputs, Edge adds a fixed 15 ms, filters as below, and never drops traffic for saturation. No undefined edge-overload behavior is implied.

---

# 37. WAF Bot Filtering

```text
BotsFiltered =
IncomingBots × BotFilterRatio
```

```text
BotsPassed =
IncomingBots - BotsFiltered
```

Only `BotsPassed` reaches App Service.

---

# 38. WAF False Positives

Legitimate requests may also be incorrectly blocked.

```text
LegitimateBlocked =
LegitimateTraffic × FalsePositiveRatio
```

Apply the same false-positive ratio separately to Browse and Order before rate limiting so business loss remains attributable by class.

These requests:

- Generate no revenue
- Count as failed legitimate requests
- Affect availability
- Contribute to Incident Loss

---

# 39. WAF Fidelity Note

The MVP WAF mechanic combines several real-world security concepts into one understandable mechanic.

The `Bot Filtering` value may conceptually represent:

- WAF rules
- Managed rules
- Bot-related protections
- Security policy

It does **not** imply that simply enabling Azure WAF automatically blocks the displayed percentage of bot traffic.

---

# 40. Processing Order Per Tick

Each simulation tick processes requests in this exact order:

```text
0. Apply boundary events due at t: complete provisioning, expire emergency
   mode, and apply pending rate-limit transitions. Then validate and accept
   actions stamped t in ascending sequence order. Reject invalid actions
   explicitly; do not charge, consume uses, or change state for them.

1. Resolve Traffic Phase

2. Split Traffic
   → Browse
   → Order
   → Bot

3. Apply WAF
   → Filter Bots
   → Apply False Positives

4. Apply Rate Limit

5. Apply App Service Capacity

6. Route Accepted Business Requests

7. Apply Cache

8. Apply Azure SQL Capacity

9. Determine Successful / Failed Requests

10. Calculate Latency

11. Calculate Revenue

12. Calculate Infrastructure Cost

13. Calculate Incident Loss

14. Update Budget

15. Update Failure Counters

16. Update Attribution Metrics, including this tick and its phase

17. Determine Outcome State and finalize results if terminal

18. Emit Simulation Snapshot
```

This order is authoritative for MVP.

Accepted actions schedule their delayed effects; none changes traffic immediately. Charge an emergency action once at acceptance. If that charge exhausts budget, fail immediately at elapsed time `t` without processing traffic or infrastructure cost for `[t,t+1)`. Otherwise finish the entire tick before evaluating terminal conditions. Budget failure takes priority over availability failure, then Order-flow failure, then successful completion. Finalization always uses all processed-tick totals.

---

# 41. Rate Limiting

Rate Limit applies after WAF processing and before App Service.

Rate Limit affects all remaining traffic equally.

Initial MVP value:

```text
Rate Limit:
5%
```

---

# 42. Rate Limit Formula

For each remaining traffic class:

```text
TrafficAfterRateLimit =
TrafficBeforeRateLimit
×
(1 - RateLimitRatio)
```

Example:

```text
Traffic:
300 req/s

Rate Limit:
5%
```

Result:

```text
Passed:
285 req/s

Rejected:
15 req/s
```

---

# 43. Rate Limit Trade-Off

Rate Limit reduces offered App load by 5%, including both bots and legitimate traffic. It can lower utilization and successful-request latency at the cost of rejected customers and business opportunity.

In this no-queue, proportional-admission model, it cannot increase successful throughput or repair a hard availability failure. If App remains saturated, admitted class volumes and downstream demand may remain unchanged; only pre-admission demand and its latency multiplier decrease. When App is unsaturated, downstream demand and successful business generally decrease. Do not promise universal SQL-load reduction or higher revenue.

With no other losses, availability becomes 95% without WAF or 94.525% with normal WAF, above the 90% hard-failure threshold but below the 99% target. This is latency/pressure control, not a free reliability upgrade. Infrastructure billing does not decrease while the same instances remain active.

Rate Limit does not distinguish malicious traffic from legitimate traffic.

That is the strategic difference between Rate Limit and WAF.

---

# 44. Rate Limit Action

MVP action rules:

```text
Activation Delay:
2 sec

Deactivation Delay:
2 sec

Minimum Toggle Interval:
5 sec
```

Measure the toggle interval between accepted requests. Reject a no-op toggle, any toggle while a transition is pending, or a request less than five ticks after the previous accepted request. Initial state is OFF with no previous request. If accepted at `t`, the new state begins at `t + 2`.

Rate Limit has no direct monetary action cost.

Its cost is lost business opportunity.

---

# 45. Scale-Out Action

When the player requests Scale Out:

```text
Requested Instance
      ↓
Provisioning
      ↓
8 seconds
      ↓
ACTIVE
```

The new instance contributes no capacity while provisioning.

---

# 46. Scale-Out Cost

The additional instance begins generating running cost only when it becomes `ACTIVE`.

There is no one-time deployment charge in MVP.

---

# 47. Concurrent Scale-Out

MVP allows:

```text
Maximum Active Instances:
4

Maximum Concurrent Provisioning:
1 instance
```

Another Scale Out cannot begin while an instance is already provisioning.

Reject scale-out unless App is active, active plus pending instances is below four, and no other scale-out is pending. In RUNNING require enough remaining budget for at least one full tick of the post-scale active infrastructure; this is an immediate affordability check, not a promise that the remaining run is affordable. In PREPARATION, no runtime budget is charged.

This is an MVP gameplay simplification.

---

# 48. Emergency WAF Mode

Protected Edge supports one emergency security action per scenario.

Initial balancing:

```text
Activation Delay:
1 sec

Duration:
30 sec

Uses Per Scenario:
1

Bot Filtering:
90%

False Positive Rate:
3%

Action Cost:
8 credits
```

When Emergency Mode ends, normal WAF behavior returns.

Require RUNNING, an active connected Edge, an unused emergency action, and remaining budget strictly greater than its action cost (using section 122 comparisons). Charge once and consume the use when accepted. A request at `t` is active over `[t+1,t+31)` and expires before traffic at `t+31`. It is not additive with normal filtering. A used action cannot be repeated after expiry; retry resets usage.

---

# 49. Emergency WAF Trade-Off

Emergency filtering:

```text
Bot Protection ↑
```

but:

```text
False Positives ↑
Cost ↑
```

It should therefore be a tactical decision rather than a free upgrade.

---

# 50. Resource Provisioning Values

Initial MVP balancing:

| Action | Provisioning |
|---|---:|
| New App Service Resource | 5 sec |
| App Service Scale-Out | 8 sec |
| Azure SQL | 6 sec |
| Cache | 5 sec |
| Protected Edge | 4 sec |

Build-mode provisioning values are intentionally short for gameplay.

They do not represent actual Azure deployment times.

---

# 51. Resource Running Cost

Running costs accumulate only while the scenario is `RUNNING`.

```text
TickInfrastructureCost =
TotalActiveCostPerMinute / 60
```

Example:

```text
App Service ×2:
10/min

Azure SQL:
12/min

Cache:
8/min

Protected Edge:
3/min
```

Total:

```text
33 credits/min
```

Per one-second tick:

```text
33 / 60
=
0.55 credits
```

---

# 52. Disconnected Resource Cost

Any active deployed resource generates cost during runtime even if disconnected.

Example:

```text
Disconnected Cache

Traffic Effect:
None

Running Cost:
8 credits/min
```

This is intentional.

---

# 53. Pending Resource Cost

A provisioning resource:

```text
Capacity:
0

Traffic Effect:
None

Running Cost:
0
```

Running cost begins when the resource becomes `ACTIVE`.

---

# 54. Starting Budget

Black Friday MVP:

```text
Starting Budget:
140 credits
```

Budget represents the player's maximum allowed infrastructure expenditure for the scenario.

Budget is a ceiling rather than a mandatory failure lesson. The maximum static stack costs 129 credits over three minutes; adding the eight-credit emergency action costs 137, leaving three credits. Budget failure is a supported rule but is not forced in the default scenario. A regression fixture with Starting Budget 137 and that same stack/action must fail exactly at exhaustion, independent of floating-point residue.

---

# 55. Budget Formula

```text
RemainingBudget =
StartingBudget
- InfrastructureCost
- EmergencyActionCost
```

Revenue does not replenish runtime infrastructure budget.

Revenue and budget serve different purposes:

```text
Budget
=
Can I afford to operate this architecture?

Revenue
=
How much business value did the architecture produce?
```

---

# 56. Financial Failure

Hard failure occurs when:

```text
RemainingBudget <= 0
```

This prevents unlimited overprovisioning.

---

# 57. Revenue Values

Initial business value:

| Request Type | Revenue per Successful Request |
|---|---:|
| Browse | 0.002 credits |
| Order | 0.050 credits |
| Bot | 0 |

These are game economy values.

They are not actual ecommerce economics.

---

# 58. Revenue Calculation

```text
TickRevenue =
SuccessfulBrowse × BrowseValue
+
SuccessfulOrders × OrderValue
```

Bot traffic never generates revenue.

---

# 59. Potential Business Value

Potential Revenue is the value that could have been generated if all legitimate requests had completed successfully.

```text
PotentialRevenue =
OfferedBrowse × BrowseValue
+
OfferedOrder × OrderValue
```

---

# 60. Lost Business Value

```text
LostBusinessValue =
PotentialRevenue - RealizedRevenue
```

This value identifies business opportunity lost due to:

- WAF false positives
- Rate limiting
- Compute saturation
- Database saturation

---

# 61. Incident Loss

Failed business traffic also causes an additional incident penalty.

Initial MVP:

```text
IncidentPenaltyRate:
25%
```

```text
IncidentLoss =
LostBusinessValue × 0.25
```

This represents secondary impact such as:

- Customer dissatisfaction
- SLA impact
- Abandoned transactions
- Operational impact

It is a game abstraction.

---

# 62. Net Business Value

```text
NetBusinessValue =
Revenue
- InfrastructureCost
- EmergencyActionCost
- IncidentLoss
```

This is one of the most important final metrics.

---

# 63. Why Revenue and Incident Loss Are Separate

A failed Order creates two effects.

First:

```text
The Order generates no Revenue.
```

Second:

```text
The business may incur additional incident impact.
```

Therefore Incident Loss is additional to lost revenue.

---

# 64. Utilization States

Initial visualization thresholds:

```text
0% – 70%
HEALTHY

>70% – 100%
WARNING

>100%
OVERLOADED
```

These thresholds apply to:

- App Service
- Cache
- SQL read
- SQL write

---

# 65. Latency Model

Latency increases non-linearly near saturation.

For resource utilization `u`:

```text
If u <= 0.70:

Multiplier = 1
```

```text
If 0.70 < u <= 1.00:

x = (u - 0.70) / 0.30

Multiplier =
1 + 2 × x²
```

```text
If u > 1.00:

Multiplier =
min(
    8,
    3 + 4 × (u - 1)
)
```

---

# 66. Latency Examples

At:

```text
Utilization 50%
Multiplier 1.0
```

At:

```text
Utilization 85%
Multiplier 1.5
```

At:

```text
Utilization 100%
Multiplier 3.0
```

At:

```text
Utilization 125%
Multiplier 4.0
```

The exact curve is a gameplay abstraction designed to make saturation visible before total failure.

---

# 67. Resource Latency

```text
ActualResourceLatency =
BaseLatency × LatencyMultiplier
```

Base values:

```text
Protected Edge:
15 ms

App Service:
60 ms

Cache:
8 ms

Azure SQL Read:
50 ms

Azure SQL Write:
70 ms
```

---

# 68. Browse Latency Without Cache

```text
BrowseLatency =
EdgeLatency, if present
+
AppLatency
+
SQLReadLatency
```

---

# 69. Browse Latency — Cache Hit

```text
BrowseHitLatency =
EdgeLatency
+
AppLatency
+
CacheLatency
```

---

# 70. Browse Latency — Cache Miss

```text
BrowseMissLatency =
EdgeLatency
+
AppLatency
+
CacheLatency
+
SQLReadLatency
```

---

# 71. Order Latency

```text
OrderLatency =
EdgeLatency
+
AppLatency
+
SQLWriteLatency
```

---

# 72. Average Latency

Average latency is weighted across successful legitimate requests.

```text
AverageLatency =
Σ(RequestCount × RequestLatency)
/
TotalSuccessfulLegitimateRequests
```

Failed requests are represented through Error Rate rather than Average Latency.

Final Average Latency uses the sum of all successful-request latency numerators divided by all successful requests, not a mean of per-tick averages. Peak Latency is the maximum successful route latency among processed ticks (not the maximum tick average). If no legitimate request succeeds, both values are `null` and Latency Score is 0.

Edge latency is zero when absent. Cache-overflow requests use the cache-miss latency path, including Cache latency. SQL read and write latencies use their respective utilizations, not the displayed maximum SQL utilization. All utilizations use pre-admission demand.

---

# 73. Successful Legitimate Requests

```text
SuccessfulLegitimateRequests =
SuccessfulBrowse
+
SuccessfulOrders
```

Bots are excluded.

---

# 74. Failed Legitimate Requests

```text
FailedLegitimateRequests =
OfferedLegitimateRequests
-
SuccessfulLegitimateRequests
```

Failure may occur at:

- WAF
- Rate Limiter
- App Service
- Azure SQL

---

# 75. Tick Availability

```text
TickAvailability =
SuccessfulLegitimateRequests
/
OfferedLegitimateRequests
```

Bot traffic is excluded from the denominator.

This prevents deliberately filtered malicious traffic from reducing service availability.

For a tick with zero offered legitimate requests, availability is 1 and error rate is 0 by convention; mark the metric `noDemand` in the UI. That tick resets the availability failure streak. Final availability/error rate use the same convention if the whole processed interval has zero legitimate requests; it must not be presented as measured service delivery.

---

# 76. Final Availability

```text
FinalAvailability =
TotalSuccessfulLegitimateRequests
/
TotalOfferedLegitimateRequests
```

---

# 77. Error Rate

```text
ErrorRate =
FailedLegitimateRequests
/
OfferedLegitimateRequests
```

Therefore:

```text
Availability + ErrorRate = 1
```

for the simplified MVP model.

---

# 78. Soft Failure State

Soft failure does not end the scenario.

Examples:

```text
Latency above target

Resource utilization >100%

Temporary Error Rate

Database saturation
```

The player may recover.

---

# 79. Critical State

Initial MVP critical indicators include:

```text
Tick Availability < 95%
```

or:

```text
RemainingBudget / StartingBudget < 20%
```

or any active App/Cache/SQL-read/SQL-write utilization above 100% for five consecutive ticks. Maintain separate resource streaks and reset each on recovery. Critical state is recomputed each tick and is not itself a failure counter.

Critical State creates UI urgency but does not itself end the scenario.

---

# 80. Hard Failure — Availability

Hard failure occurs when:

```text
Tick Availability < 90%
```

for:

```text
20 consecutive simulation ticks
```

Because one tick equals one second:

```text
20 seconds
```

Reset the streak on the first tick at or above 90%, or on a zero-legitimate-demand tick; do not reset it merely because the phase changes. Pause freezes it. For the baseline, ticks 30–49 are bad and failure occurs at elapsed time 50. A scale request at 34 activates at 42, before failure; timely scale-out restores phase-2 availability and resets the streak.

---

# 81. Hard Failure — Business Flow

Order is the MVP critical business flow.

Hard failure occurs when:

```text
Order Success Rate < 50%
```

for:

```text
15 consecutive seconds
```

Order Success Rate is successful Orders divided by offered Orders, including ingress rejections as failures. On every tick, increment the counter only if Orders are offered and the rate is below 50%; otherwise reset it to zero. A phase change does not reset a bad streak by itself. Pause freezes all counters.

---

# 82. Hard Failure — Budget

```text
RemainingBudget <= 0
```

causes immediate scenario failure.

---

# 83. Scenario Success

The player survives when:

```text
Final Traffic Phase Completes

AND

No Hard Failure Is Active

AND

Remaining Budget > 0
```

Survival does not guarantee a high Architecture Score.

Report target attainment separately: completed and availability at least the scenario target, non-null average latency at or below its target, and Net Business Value at least its target. A survived run may miss targets; a failed run never attains all targets merely because its shortened metrics look favorable.

---

# 84. Black Friday Scenario

MVP duration:

```text
180 seconds
```

Three minutes.

---

# 85. Black Friday Business Mix

Legitimate traffic:

```text
Browse:
80%

Order:
20%
```

This is deliberately read-heavy so Cache creates a meaningful architecture decision.

---

# 86. Traffic Phase 1 — Normal Load

```text
Time:
0–30 sec

Traffic:
100 req/s

Bot Ratio:
0%
```

Purpose:

> Establish healthy baseline behavior.

---

# 87. Traffic Phase 2 — Traffic Spike

```text
Time:
30–75 sec

Traffic:
220 req/s

Bot Ratio:
0%
```

Purpose:

> Expose single-instance App Service capacity.

Expected reaction:

```text
Scale Out
```

---

# 88. Traffic Phase 3 — Database Pressure

```text
Time:
75–120 sec

Traffic:
300 req/s

Bot Ratio:
20%
```

Purpose:

> With App Service scaled out, expose downstream SQL read pressure.

This is the scenario's primary cache-learning phase.

---

# 89. Traffic Phase 4 — Peak Black Friday

```text
Time:
120–180 sec

Traffic:
500 req/s

Bot Ratio:
40%
```

Purpose:

- Create compute pressure
- Create security pressure
- Reward Protected Edge
- Reward correct scaling
- Maintain SQL write pressure

Peak offers 300 legitimate requests/s (240 Browse, 60 Order) and 200 bots/s. Three App instances without WAF are at 111.111% demand and admit 90% of legitimate traffic; four instances admit all traffic. Normal WAF reduces App demand to 358.5/s, allowing three instances to deliver 99.5% availability with Cache. SQL write demand is 59.7/s, below its independent 70/s capacity.

---

# 90. Scenario Configuration Example

```yaml
schemaVersion: 1
balanceVersion: "0.2"
id: black-friday
duration: 180

budget: 140

businessMix:
  browse: 0.80
  order: 0.20

traffic:
  - start: 0
    end: 30
    rps: 100
    botRatio: 0.00

  - start: 30
    end: 75
    rps: 220
    botRatio: 0.00

  - start: 75
    end: 120
    rps: 300
    botRatio: 0.20

  - start: 120
    end: 180
    rps: 500
    botRatio: 0.40

targets:
  availability: 0.99
  latencyMs: 300
  netBusinessValue: 360
```

---

# 91. Tick Input Contract

Every simulation tick receives:

```text
simulationTime

scenarioState

architectureGraph

resourceStates

activeInstanceCounts

resourceProvisioningStates

rateLimitState

wafEmergencyState

cumulativeMetrics
```

It also receives timestamped actions (unique monotonic `sequence` per attempt), pending activation/expiry times, failure/overload streaks, last accepted rate-toggle time, emergency usage, per-class stage losses, phase totals, and the original versioned initial architecture/scenario/balance IDs. These belong to runtime state, not renderer state.

Scenario data provides:

```text
Current Traffic Phase
RPS
Bot Ratio
Business Mix
```

---

# 92. Tick Output Contract

Every tick produces a Simulation Snapshot.

The state transition returns both **next runtime state** and **snapshot**. Snapshots are presentation data, not a complete replacement for pending-action/counter state.

```text
time

traffic:
  incoming
  legitimate
  browse
  order
  bot

edge:
  botsFiltered
  falsePositives
  passedTraffic

rateLimit:
  active
  rejectedTraffic

app:
  incomingTraffic
  capacity
  utilization
  acceptedTraffic
  droppedTraffic
  activeInstances
  provisioningInstances

cache:
  active
  eligibleTraffic
  utilization
  hits
  misses
  overflow

sql:
  readDemand
  writeDemand
  readUtilization
  writeUtilization
  readsAccepted
  writesAccepted
  readsDropped
  writesDropped

business:
  successfulBrowse
  successfulOrders
  failedRequests
  revenue
  incidentLoss

metrics:
  availability
  latency
  errorRate
  infrastructureCost
  remainingBudget
  netBusinessValue

state:
  scenarioStatus
  warningState
  primaryCurrentPressure
```

`time` is the processed tick start; also emit `elapsedTime`, tick-end state and action outcomes. Traffic/edge/rateLimit/app/cache/sql/business blocks describe this tick. `metrics.availability`, `latency`, and `errorRate` are tick values; monetary fields in `metrics` are cumulative through tick end. Include cumulative revenue, incident loss, emergency cost, final-so-far availability, and average latency under a separate `totals` block. Include per-class losses and failure countdowns for explainability.

`primaryCurrentPressure` is the highest demand/capacity ratio above 0.70 among active App, Cache, SQL read, and SQL write; ties use that order. It is a live utilization indicator, not the final business-loss cause. Report `None` if no resource crosses 0.70.

---

# 93. Final Simulation Output

After completion or failure:

```text
Scenario Result

Elapsed Time

Availability

Average Latency

Peak Latency

Error Rate

Peak App Utilization

Peak SQL Read Utilization

Peak SQL Write Utilization

Cache Hit Ratio

Bots Offered

Bots Filtered

Revenue

Infrastructure Cost

Emergency Action Cost

Incident Loss

Net Business Value

Remaining Budget

Primary Outcome Cause

Primary Bottleneck

Contributing Causes

Architecture Score
```

Also return termination reason, target-attainment flags, scenario/balance versions, and per-phase summaries (elapsed ticks, offered/successful requests, losses by stage, utilization peaks, primary cause). An unfinished phase is marked partial; later phases are not fabricated. Compare duration and completion status alongside money so an early failure is not described as more efficient solely because it ran for less time.

---

# 94. Attribution Requirement

The simulation must track where legitimate requests were lost.

Loss stages include:

```text
WAF False Positive

Rate Limiter

App Service Saturation

SQL Read Saturation

SQL Write Saturation
```

This is required for explainable results.

Track Browse and Order separately at every stage. Each request-equivalent belongs to exactly one first-loss stage; subsequent stages only see survivors. For each class and tick, successful requests plus WAF/rate/App/SQL losses equal offered requests within section 122 tolerance. Bot displacement is an explanatory subdivision of App losses, never an additional loss to charge twice.

---

# 95. Lost Business Attribution

For each stage:

```text
AttributedLostBusinessValue =
LostRequests
×
BusinessRequestValue
```

The engine accumulates this value by cause.

Example:

```text
App Saturation:
18.2 credits

SQL Saturation:
32.4 credits

Rate Limiting:
5.1 credits
```

---

# 96. Primary Outcome Cause

If the scenario fails because of budget:

```text
Primary Outcome Cause:
Budget Exhaustion
```

Otherwise, the engine compares attributed business losses.

Combine SQL read/write losses into an Azure SQL bucket. A meaningful contributor is at least 1% of potential business value for the evaluated interval (whole attempt or phase). If the attempt failed for service reasons, choose the largest positive bucket even below that threshold. Ties use the fixed order App, SQL, Rate Limiter, WAF; compare with section 122 tolerance. If no meaningful business loss exists, choose Overprovisioning when section 100 applies, otherwise No Critical Issue.

For a completed run with Net Business Value below zero, use **Negative Business Value** as the primary economic cause; business-loss causes remain contributors. Budget exhaustion takes priority over all labels. Never substitute a desired tutorial lesson for the computed cause. Use phase summaries to explain SQL pressure even if a later compute/bot phase dominates the final result.

Possible values:

```text
App Service Saturation

Azure SQL Saturation

Unfiltered Bot Traffic

Excessive Rate Limiting

WAF False Positives

Budget Exhaustion

Overprovisioning

Negative Business Value

No Critical Issue
```

---

# 97. Primary Bottleneck

When the Primary Outcome Cause is resource saturation:

```text
Primary Bottleneck:
App Service
```

or:

```text
Primary Bottleneck:
Azure SQL
```

When failure is economic:

```text
Primary Bottleneck:
None
```

---

# 98. Bot Displacement Attribution

Bot traffic does not directly count as failed legitimate traffic.

However, it can consume App Service capacity and indirectly displace legitimate traffic.

For each tick, let L be legitimate traffic reaching App after ingress controls, B the bots reaching App, and C App capacity. Compute:

```text
LegitimateCapacityWithoutBots = min(L, C)
ActualLegitimateCapacity = L × min(1, C / (L + B))
BotDisplacedLegitimate = max(0,
  LegitimateCapacityWithoutBots - ActualLegitimateCapacity)
```

When `L+B` is zero, actual capacity is zero; when L is zero, displacement is zero. Split displacement between Browse/Order in their post-ingress proportions and multiply by their revenue values. Sum over the same evaluated interval as the App loss bucket.

If App is the selected primary loss bucket and bot displacement value is strictly more than half of App-stage lost business value:

```text
Primary Outcome Cause:
Unfiltered Bot Traffic
```

replaces:

```text
App Service Saturation
```

The physical bottleneck remains:

```text
App Service
```

---

# 99. Contributing Cause — Bot Pressure

Unfiltered Bot Traffic is added as a contributing cause when:

```text
BotsReachingApp
/
AppCapacity

> 20%
```

for five consecutive processed ticks; reset the streak when the condition ceases, and remember whether it was ever reached. Add the label as a contributor only if it is not already primary. Other contributors are non-primary business-loss buckets meeting the 1% threshold, sorted by descending loss then the same tie order. Include Overprovisioning if its condition applies and it is not primary.

---

# 100. Overprovisioning Detection

A successful architecture may still be inefficient.

Initial MVP condition:

```text
Scenario Survived

AND

Infrastructure Cost > 120 credits

AND

Average App Utilization < 50%
```

Result:

```text
Primary Outcome Cause:
Overprovisioning
```

if no more serious business-loss cause exists.

Average App Utilization is the time-weighted mean over processed RUNNING ticks, including zero-demand ticks and using the active capacity at each tick. The overprovisioning penalty applies whenever the condition holds, even if another cause is primary.

---

# 101. Architecture Score

Architecture Score is deterministic.

Maximum:

```text
10,000
```

Initial weighting:

```text
Reliability       40%
Latency           20%
Business Value    25%
Security          15%
```

Then penalties are applied.

---

# 102. Reliability Score

Final Availability is converted to a 0–100 score.

```text
ReliabilityScore =
clamp(
  100 - (100 - AvailabilityPercent) × 5,
  0,
  100
)
```

Examples:

```text
100% Availability
→ 100

99%
→ 95

95%
→ 75

90%
→ 50
```

---

# 103. Latency Score

Scenario latency target:

```text
300 ms
```

If:

```text
AverageLatency <= 300
```

then:

```text
LatencyScore = 100
```

Otherwise:

```text
LatencyScore =
clamp(
  300 / AverageLatency × 100,
  0,
  100
)
```

Example:

```text
600 ms
→ 50
```

---

# 104. Business Value Score

Black Friday target:

```text
Target Net Business Value:
360 credits
```

```text
BusinessValueScore =
clamp(
  NetBusinessValue / 360 × 100,
  0,
  100
)
```

---

# 105. Security Score

If the scenario contains Bot traffic:

```text
SecurityScore =
BotsFilteredByWAF
/
TotalBotsOffered
×
100
```

If no Bot traffic exists:

```text
SecurityScore = 100
```

Here "no Bot traffic" means none is configured anywhere in the scenario. If the scenario includes bots but the run fails before any are offered, Security Score is 0 (not `0/0` and not free full credit). Otherwise use processed-tick bots offered/filtered; no credit is granted for unplayed phases.

Security Score measures targeted security filtering rather than generic Rate Limiting.

---

# 106. Weighted Base Score

```text
WeightedScore =

ReliabilityScore × 0.40
+
LatencyScore × 0.20
+
BusinessValueScore × 0.25
+
SecurityScore × 0.15
```

Convert to 10,000 scale:

```text
BaseArchitectureScore =
WeightedScore × 100
```

---

# 107. Failure Penalty

If scenario state is:

```text
FAILED
```

apply:

```text
FailurePenalty:
1,500 points
```

---

# 108. Overprovisioning Penalty

If Overprovisioning condition is triggered:

```text
OverprovisioningPenalty:
500 points
```

---

# 109. Final Architecture Score

```text
ArchitectureScore =
round(
  clamp(
    BaseArchitectureScore
    - FailurePenalty
    - OverprovisioningPenalty,
    0,
    10000
  )
)
```

Same inputs must always create the same score.

If the scenario completes with negative Net Business Value, cap the final Architecture Score at 3,000 after penalties. This enforces the PRD's requirement that unprofitable survival should score poorly. Round half upward to an integer after all weights, penalties, and caps; do not round component metrics first.

---

# 110. Demo Architecture Matrix

The following are arithmetic reference results for balance v0.2. Every resource and configured instance starts active, Cache always includes a direct App → SQL write connection, no live actions occur, normal WAF applies throughout, and only processed ticks are charged. Values shown are rounded for documentation; future regression tests use unrounded calculations and section 122 tolerance. These are not playtest or implemented-engine results.

| Architecture | Result / elapsed | Availability | Average latency (ms) | Infrastructure cost | Net Business Value | Score |
|---|---|---:|---:|---:|---:|---:|
| App ×1 → SQL | Failed / 50 s | 81.081081% | 230.000000 | 14.166667 | 51.373333 | 1073 |
| App ×2 → SQL | Failed / 140 s | 90.101010% | 259.180830 | 51.333333 | 257.036667 | 4305 |
| App ×2 + Cache → SQL | Failed / 140 s | 91.919192% | 173.332845 | 70.000000 | 239.720000 | 4549 |
| WAF → App ×2 + Cache → SQL | Failed / 140 s | 96.219919% | 145.175753 | 77.000000 | 251.241081 | 6539 |
| App ×4 → SQL | Failed / 140 s | 94.141414% | 198.543826 | 74.666667 | 265.503333 | 5172 |
| App ×3 + Cache → SQL | Survived / 180 s | 95.683453% | 148.593340 | 105.000000 | 352.620000 | 7585 |
| App ×4 + Cache → SQL | Survived / 180 s | 100.000000% | 101.948019 | 120.000000 | 363.720000 | 8500 |
| WAF → App ×3 + Cache → SQL | Survived / 180 s | 99.500000% | 111.915884 | 114.000000 | 366.696750 | 9450 |
| WAF → App ×4 + Cache → SQL | Survived / 180 s | 99.500000% | 106.537787 | 129.000000 | 351.696750 | 8892 |

The protected three-instance design meets all three targets. The unprotected four-instance design also meets them, trading better availability/latency for higher cost and weaker targeted security. The protected four-instance design triggers overprovisioning (129 credits; mean App utilization 42.501389%) and receives the 500-point penalty. WAF does not reduce fixed-instance billing automatically: cost savings arise from avoiding the fourth instance. With otherwise fixed two-instance Cache designs it also raises NBV here, but that is a tested scenario relationship, not a universal WAF claim.

### Teaching checkpoints and actions

- First response: start with one App; request scale-out at `t=34`, active at 42. This recovers the traffic-spike phase; it is not a claim that the rest of the run will succeed.
- SQL lesson: two App instances at phase 3 receive 192 Browse/s, producing 106.666667% SQL read demand without Cache. Cache reduces that to 38.4/s (80% less). Preserve that phase summary even if peak later produces a larger App loss.
- Isolated redesign pair: start with four App instances, no WAF, and no actions. Without Cache, peak SQL reads reach 240/s and availability is 80%; the run fails at 140 s with Azure SQL Saturation primary. Add Cache between attempts: reads peak at 48/s and the full run succeeds. This controlled pair isolates the DB lesson rather than falsely labeling App loss as SQL loss.
- Security/economics pair: compare the completed unprotected four-instance Cache design against the protected three-instance Cache design above on the same full scenario.
- Live scale-out: with protected two-instance Cache design, request scale at 124, active at 132. The run survives; final availability is 98.098296%, cost 103, NBV 369.221348, score 9170. It misses the availability target because recovery does not erase earlier failures.
- Emergency bridge: from protected two-instance Cache, request emergency at 120 (active `[121,151)`) and scale at 142 (active 150). Normal peak availability with two instances is 83.263598%; emergency raises it to 93.569132%, resetting the bad streak and buying time. This policy survives with availability 98.127830%, infrastructure cost 101.5, emergency cost 8, NBV 362.899926, score 9298. Without emergency the late scale never occurs because the run fails at 140. Emergency alone, without scaling, expires and the run fails at 171.
- Rate-limit trade-off: protected three-instance Cache, enable at 118 and disable at 178 (effective `[120,180)`). The run survives with availability 97.352518%, average latency 106.788914 ms, NBV 353.712000, score 8977. Latency improves versus its no-action baseline, but customer success and business value decrease.

Different attempts may take different time. One scenario lasts up to three minutes; a live multi-attempt demo takes longer. A 3–4 minute presentation may use clearly labeled precomputed reference results or a shortened walkthrough, not claim to contain several full 180-second runs.

---

# 111. Core Simulation Acceptance Test — Scale Out

Given:

```text
App Instances:
1
```

and then:

```text
App Instances:
2
```

Expected:

```text
App Capacity with 2 instances
>
App Capacity with 1 instance
```

and:

```text
Running Cost with 2 instances
>
Running Cost with 1 instance
```

---

# 112. Core Simulation Acceptance Test — Cache

Given identical traffic:

```text
Architecture A

App
 ↓
SQL
```

and:

```text
Architecture B

App
 ↓
Cache
 ↓
SQL
```

Expected:

```text
Architecture B SQL Read Demand
<
Architecture A SQL Read Demand
```

for read-eligible workloads.

---

# 113. Cache Write Test

Given Order traffic:

```text
App
 ↓
Cache
 ↓
SQL
```

Expected:

```text
Order SQL Write Demand
```

must not decrease because Cache exists.

This test protects Azure/concept fidelity.

Both compared graphs include the required direct App → SQL write connection. Cache-only diagrams are read-path shorthand, not an exception to start validation.

---

# 114. WAF Acceptance Test

Given identical Bot traffic:

```text
Without Protected Edge
```

versus:

```text
With Protected Edge
```

Expected:

```text
Bots Reaching App With WAF
<
Bots Reaching App Without WAF
```

---

# 115. Active Path Test

Given a Protected Edge resource that is deployed but disconnected:

```text
Internet → App

WAF elsewhere
```

Expected:

```text
Bot Filtering:
0
```

The same rule applies to disconnected Cache.

---

# 116. Rate Limit Test

With Rate Limit enabled, App offered load is multiplied by 0.95 for every class. For an unsaturated App, eligible downstream load and accepted legitimate requests decrease. For a still-saturated App with proportional admission, downstream/admitted volumes can be equal to their previous values; assert non-increase rather than a universal strict decrease. Each resource's latency multiplier must not increase solely from lower demand at otherwise identical capacity. Aggregate latency also depends on the surviving request mix; use the explicit policy below rather than a universal strict improvement assertion.

Rate Limit must not increase Security Score through WAF filtering metrics. Include both unsaturated and saturated fixtures and the phase-4 policy in section 110. Do not assert that rate limiting restores throughput or availability.

---

# 117. App-to-SQL Bottleneck Test

A required learning behavior is:

```text
Scale Out App Service
```

must not automatically increase:

```text
Azure SQL Read Capacity

Azure SQL Write Capacity
```

This test protects one of the game's most important architecture lessons.

---

# 118. Overprovisioning Test

An oversized architecture should not automatically receive the best score.

Given two architectures that both survive:

```text
Efficient Architecture
```

and:

```text
Massively Overprovisioned Architecture
```

the overprovisioned architecture should:

```text
Cost More
```

and may:

```text
Receive Lower Architecture Score
```

---

# 119. Determinism Requirement

The following must be true:

```text
simulate(
  architecture A,
  scenario B,
  actions C
)
```

executed twice must produce:

```text
identical final metrics
```

within normal floating-point tolerance.

The replay input is the original initial architecture plus versioned scenario/balance definitions and the accepted/rejected timestamped action log. Do not replay the log against the final redesigned or scaled architecture. Redesign & Retry is a fresh attempt and is different from a diagnostic deterministic replay.

No simulation calculation may depend on:

- Rendering frame rate
- Device speed
- Wall-clock timing
- Unseeded randomness

---

# 120. Player Action Timing

Every action is recorded with simulation time.

Example:

```text
time: 34
action: SCALE_OUT
resource: app-service
```

If Scale Out takes:

```text
8 sec
```

the new instance becomes active at:

```text
simulation time 42
```

This makes replay deterministic.

Actions use integer simulation boundaries and a unique sequence number. Interactive input received between boundaries is queued for the next unprocessed tick; the recorded tick/sequence is authoritative thereafter. Two same-tick actions are validated sequentially against the state left by the earlier action. Rejected actions are logged with their reason and have no effect. Pause/resume belongs to orchestration: pause only between ticks, accept no live actions while paused, and resume at the same next tick.

---

# 121. Pause Determinism

While paused:

```text
SimulationTime does not change
```

Therefore:

```text
Provisioning does not progress
Traffic does not progress
Cost does not accumulate
Revenue does not accumulate
Failure counters do not advance
```

---

# 122. Numerical Precision

Simulation may internally use floating-point values.

Displayed UI values may be rounded.

Example:

```text
Internal:
0.94673

Display:
94.7%
```

Rounding must never feed back into simulation calculations.

Use a stable operation and iteration order and finite binary64 values. For runtime comparisons define `epsilon(a,b) = 1e-9 × max(1, abs(a), abs(b))`; treat values within epsilon as equal. Strict inequalities require a difference greater than epsilon. Budget at or within epsilon of zero is exhausted; do not turn a floating-point remainder into survival. Use this same comparison policy for thresholds and attribution ties. Ratios accepted near 1 at validation are normalized once as specified in section 12.

Regression metrics may differ from independently calculated values by at most `1e-6 × max(1, abs(expected))`; terminal state, elapsed ticks, accepted actions, primary cause, and rounded score must match exactly. Null metrics remain null, never NaN/Infinity. Small negative loss residuals within epsilon may be treated as zero; larger violations are errors.

---

# 123. Simulation Log

For debugging and explainability, each tick should be capable of producing a structured simulation log.

Example: tick 82 of the no-action, two-instance, no-Cache/no-WAF reference run; snapshot includes the completed interval `[82,83)`:

```json
{
  "time": 82,
  "elapsedTime": 83,
  "incomingRps": 300,
  "botRps": 60,
  "appUtilization": 1.0,
  "sqlReadUtilization": 1.066667,
  "sqlWriteUtilization": 0.685714,
  "cacheHitRps": 0,
  "availability": 0.95,
  "remainingBudget": 109.566667
}
```

Numbers in this illustrative log are display-rounded; runtime values remain unrounded.

Logging may be disabled in production rendering.

---

# 124. Headless Simulation Requirement

The entire Black Friday scenario must be able to run without rendering.

Example conceptual API:

```text
simulate(
  architecture,
  scenario,
  playerActions
)
→
result
```

This is required for:

- Unit tests
- Balance tests
- Regression tests
- Future AI analysis
- Scenario generation
- Replay validation

---

# 125. Renderer Independence

The renderer receives Simulation Snapshots.

The renderer must not determine:

- Accepted requests
- Capacity
- Cache hits
- Failures
- Cost
- Revenue
- Score

Architecture:

```text
Scenario
    +
Architecture
    +
Actions
     ↓
Simulation Engine
     ↓
Simulation Snapshot
     ↓
Renderer
```

---

# 126. Unsupported MVP Concepts

The MVP simulation intentionally does not model:

- App Service Plan SKUs
- Deployment slots
- Worker recycling
- Cold start
- VNet Integration
- Private Endpoints
- NAT
- NSG
- DNS
- Managed Identity
- Key Vault
- Service Bus
- Functions
- Container Apps
- SQL replicas
- Read scale-out
- SQL connection pools
- SQL query complexity
- CDN
- Front Door
- Availability Zones
- Regions
- Autoscale rules
- Real Azure SLAs

These may become future game systems.

---

# 127. Future Simulation Extensions

Potential extensions include:

```text
Queue Depth

Retry Amplification

Cold Start

Connection Pool Saturation

Downstream Dependency Failure

Circuit Breaker

Health Probes

Autoscale

Storage Transactions

Network Isolation

Multi-Region Failover

Regional Latency

Zone Failure

Real Pricing Adapter
```

Each should only be added when it creates a meaningful architecture decision.

---

# 128. Final Simulation Principle

The simulation exists to answer:

> **Why did this architecture behave differently?**

Every important gameplay result should be traceable to:

```text
Traffic
   ↓
Architecture
   ↓
Resource Capacity
   ↓
Operational Trade-Off
   ↓
Business Outcome
```

The engine should never produce an important result that cannot be explained.

> **If the player cannot understand why the outcome occurred, the simulation has failed even if the mathematics are correct.**
