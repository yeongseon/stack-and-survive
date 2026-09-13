# Historical gameplay proposal — not current authority

See [current gameplay](../GAMEPLAY_SPEC.md). The following is not the normal-player contract.

# Stack & Survive

## Gameplay Specification

## Current gameplay authority — living-operation conversion (#112–#120)

This section supersedes the earlier configuration-first ordinary-player flow and preparation-only Cache/Edge restrictions below. Those sections describe the preserved Advanced/QA editor, not the default game.

Normal play: Title (Start Game / How to Play / About) → five-second countdown → fixed Internet/App1/SQL business → rising demand → world-local expansion → actual provisioning → changed flow and business outcomes. No architecture configuration precedes Start Game. Title/help consume no budget or simulation time. Internal four-phase scheduling remains unchanged but is not primary player chrome.

Fixed empty Edge/Cache slots and App2–4 capacity indicators replace placement and manual connections. Cache takes five seconds and adds eight running credits/minute; Edge takes four seconds and adds three; App scale takes eight seconds and adds five. There is no purchase charge. Pending services are disconnected/inert; activation installs their supported paths atomically. Direct App→SQL writes always remain. Rate limit belongs to traffic intake; emergency filtering belongs to active Edge. No runtime delete/move/disconnect.

The normal shell exposes budget, demand, availability, pressure, pause and one Learn surface. Learn contains objectives/events/explanations/metrics/concepts; the existing architecture editor remains QA-only. Success feedback must use actual served traffic/revenue, never spendable income or invented recovery. Pressure remains representative, not a persistent queue. Human acceptance #25 follows #120 and asks whether players naturally use world-local controls and can explain demand→pressure→expansion→improved flow without opening metrics. Submission gallery artwork is outside implementation scope.

**Version:** 0.4  
**Status:** Hackathon MVP Gameplay Definition  
**Related Documents:** `PRD.md`, `SIMULATION_SPEC.md`, `TECHNICAL_DESIGN.md`  
**Primary Provider:** Microsoft Azure  
**Target Session Length:** 3–6 minutes  
**Hackathon Demo Target:** 3–4 minutes  

---

# 1. Purpose

This document defines how Stack & Survive is played.

Document responsibilities:

- `PRD.md` — What we are building and why
- `GAMEPLAY_SPEC.md` — What the player sees, does, and experiences
- `SIMULATION_SPEC.md` — How traffic, capacity, cost, failures, and scores are calculated
- `TECHNICAL_DESIGN.md` — How the system is implemented

This document intentionally focuses on player-facing behavior rather than implementation details or authoritative balancing values.

---

# 2. Gameplay Vision

Stack & Survive is a real-time cloud infrastructure management game where architecture is a processing system. Demand flows through Azure services; the player observes constraints and expands or optimizes capacity.

The player should experience the following loop:

```text
Observe Demand
   ↓
Build
   ↓
Connect
   ↓
Start Operation
   ↓
Detect Flow Pressure
   ↓
Respond
   ↓
Complete / Fail
   ↓
Understand Why
   ↓
Redesign
   ↓
Replay
```

The player should feel like they are operating a cloud system, not answering a certification quiz.

---

# 3. Core Gameplay Principle

> **Build. Scale. Keep the business flowing.**

The player manages growing workload, not enemies or combat waves.

The player manages a cloud architecture under pressure.

Primary MVP pressure conditions include:

- Increasing legitimate traffic
- Bot traffic
- Compute saturation
- Database saturation
- Poor architectural decisions
- Excessive infrastructure cost

Future operational conditions may include:

- Queue backlog
- Retry storms
- Dependency failures
- Network failures
- Regional outages

---

# 4. Azure Fidelity Principle

Visual queues are representative pressure markers derived from current utilization and drops, not a waiting-request metric or FIFO. The engine has no buffered queue in this MVP. A dropped request cannot later complete. Build/Manage changes and live-action availability stay as specified: new Cache/Edge deployment remains preparation-only. Player labels may say Start operation, demand phase and data center; internal runtime identifiers and numeric rules remain unchanged.

Stack & Survive should preserve real Azure concepts wherever they affect architectural reasoning.

The game may simplify numerical behavior.

The game should not intentionally teach Azure incorrectly.

> **Simplify Azure. Never teach it incorrectly.**

The intended fidelity model is:

```text
Azure Resource Role
        ↓
Real Architectural Relationship
        ↓
Important Operational Behavior
        ↓
Simplified Game Mechanic
```

The following may be abstracted:

- Exact request capacity
- Exact latency
- Exact provisioning duration
- Exact Azure pricing
- Exact SKU performance

The following should remain conceptually accurate:

- Resource purpose
- Request direction
- Dependency relationships
- Scale-out behavior
- Cache behavior
- WAF placement
- Database bottlenecks
- Cost trade-offs

Authoritative gameplay values are defined in `SIMULATION_SPEC.md`.

---

# 5. MVP Azure Resource Roles

The Hackathon MVP focuses on four deployable architecture components.

## 5.1 App Service

### Azure Reality

Azure App Service is a managed application hosting platform.

It processes application requests and can scale out across multiple instances.

Application performance may depend on:

- Application code
- Instance capacity
- Runtime behavior
- Dependencies
- Downstream services

### Game Role

App Service is the primary application-processing resource.

```text
Traffic
   ↓
App Service
   ↓
Downstream Services
```

Player-visible concepts include:

- Instance count
- Utilization
- Provisioning state
- Request processing capacity
- Running cost

Scale-out increases capacity and operating cost.

---

# 6. Azure SQL

### Azure Reality

Azure SQL Database is a managed relational database service.

Scaling application compute does not automatically increase database capacity.

### Game Role

Azure SQL is a downstream persistent data resource.

```text
App Service
     ↓
 Azure SQL
```

App Service and Azure SQL have independent capacity.

A key learning rule is:

> **Scaling compute does not automatically solve a database bottleneck.**

---

# 7. Azure Managed Redis

### Azure Reality

Azure Managed Redis provides distributed caching.

Applications may use caching to reduce repeated reads from backend systems such as databases.

### Game Role

Cache reduces downstream database reads for eligible requests.

Conceptually:

```text
App Service
     ↓
   Cache
   /   \
Hit     Miss
 |       |
Response SQL
```

Cache does not reduce all database traffic.

> **Cache affects eligible read traffic only.**

Write requests continue to reach Azure SQL directly.

---

# 8. Protected Ingress / WAF

### Azure Reality

Azure Web Application Firewall protects traffic when requests flow through a supported ingress service such as Application Gateway or Front Door.

A WAF does not automatically protect unrelated traffic simply because it exists.

### Game Role

For MVP usability, ingress and WAF behavior may be represented as one protected edge component.

Valid:

```text
Internet
   ↓
Protected Edge
   ↓
App Service
```

Invalid interpretation:

```text
Internet → App Service

Protected Edge exists elsewhere
```

A protected edge only affects traffic that actually passes through it.

---

# 9. MVP Resource Set

Deployable resources:

1. App Service
2. Azure SQL
3. Azure Managed Redis
4. Protected Edge / WAF

Supporting system object:

- Internet Traffic Source

The MVP intentionally avoids recreating the entire Azure service catalog.

---

# 10. Core Player Journey

The MVP player journey is:

```text
Open Base
   ↓
Review Workload
   ↓
Inspect Architecture
   ↓
Modify Architecture
   ↓
Wait for Required Provisioning
   ↓
Start Traffic
   ↓
Observe Resource Pressure
   ↓
Perform Live Action
   ↓
Survive / Fail
   ↓
Review Result
   ↓
Understand Primary Cause
   ↓
Redesign
   ↓
Replay
```

This loop is the core Hackathon experience.

---

# 11. Main Game Screen

The architecture should dominate the screen.

Suggested layout:

```text
┌──────────────────────────────────────────────────┐
│ Traffic | Availability | Latency | Cost | Value │
├────────────┬─────────────────────────┬───────────┤
│            │                         │           │
│ Build      │                         │ Resource  │
│ Palette    │       CLOUD BASE        │ Details   │
│            │                         │           │
│            │                         │           │
├────────────┴─────────────────────────┴───────────┤
│ Scenario / Live Action / Selected Resource      │
└──────────────────────────────────────────────────┘
```

The game should not feel like a dashboard with a small architecture diagram in the middle.

---

# 12. Camera

MVP camera behavior:

- Fixed 2D / 2.5D perspective
- Pan
- Zoom
- No free rotation

The player should always understand:

- Where traffic enters
- Which resource processes it next
- Where the current problem exists

Camera control should never become a gameplay challenge.

---

# 13. Default Traffic Direction

External traffic should enter from one predictable visual direction.

Recommended:

```text
Top / Upper-left
        ↓
Architecture
        ↓
Lower / Lower-right
```

Example:

```text
        INTERNET
           ↓
     PROTECTED EDGE
           ↓
      APP SERVICE
           ↓
        DATA PATH
```

The visual direction is predictable.

The logical request path is determined by architecture connections and business request type.

---

# 14. Build Mode

Before traffic begins, the player enters Build Mode.

The Build Palette shows available resources.

Example:

```text
BUILD

[ App Service ]
[ Azure SQL ]
[ Cache ]
[ Protected Edge ]
```

The player can:

- Select a resource
- Place a resource
- Move a resource
- Remove a resource
- Connect resources
- Inspect resource details

Build Mode should be forgiving.

Before traffic starts:

- Moving resources is free
- Removing resources is allowed
- Resetting to the baseline architecture is allowed

---

# 15. MVP Economy Timing

Build Mode should not punish the player for taking time to think.

MVP rules:

```text
Resource placement:
No one-time purchase cost

Running cost:
Does not accumulate during Build Mode

Scenario runtime cost:
Begins when traffic starts

Replay resets:
- Scenario budget
- Revenue
- Incident loss
- Runtime cost

Architecture:
Preserved
```

The exact cost values are defined in `SIMULATION_SPEC.md`.

---

# 16. Resource Placement

Placement should use familiar base-building interactions.

Flow:

```text
Select Resource
      ↓
Ghost Preview Appears
      ↓
Move Across Board
      ↓
Valid Position Highlighted
      ↓
Place
      ↓
Provision
      ↓
Active
```

Possible feedback:

- Grid or snap
- Placement footprint
- LEGO-like attachment feedback
- Valid/invalid highlight

Physical position does not directly affect performance unless a future gameplay rule explicitly introduces that behavior.

---

# 17. Invalid Placement

Invalid placement should provide immediate feedback.

Example:

```text
Cannot place resource here.
```

Feedback should combine:

- Placement outline
- Icon
- Short text explanation

Color alone must not communicate state.

---

# 18. Provisioning

New resources may require provisioning before becoming active.

Example player experience:

```text
CACHE

Provisioning...
```

During provisioning:

- Resource is visible
- Resource cannot process traffic
- Status is clearly shown
- Progress or remaining time is visible

Authoritative provisioning durations belong in `SIMULATION_SPEC.md`.

---

# 19. Provisioning Between Attempts

For MVP simplicity:

- Previously active resources remain active between retries
- Completed scale-out instances are preserved; unfinished runtime scale-outs are cancelled without granting capacity and may be requested again in Build Mode
- Newly added resources must finish provisioning before they can process traffic
- `START TRAFFIC` should remain disabled while required new resources are still provisioning

Example:

```text
CACHE

Provisioning...

START TRAFFIC
Unavailable until required resources are ready
```

This avoids ambiguity during the Hackathon demo.

Build provisioning advances on a preparation clock, not scenario runtime. Pending deployment must be distinct from completed capacity. Instance reduction is allowed only in Build Mode and never removes the last completed instance. Increasing instances still requires provisioning.

Future versions may allow starting traffic while provisioning is still in progress.

---

# 20. Connection Mode

The player connects resources to define architecture relationships.

Suggested interaction:

```text
Select Source Resource
        ↓
Select Output Connector
        ↓
Drag Connection
        ↓
Valid Targets Highlight
        ↓
Select Target
        ↓
Connection Created
```

Connections should be easy to read visually.

---

# 21. Valid MVP Connections

Examples:

```text
Internet → Protected Edge

Internet → App Service

Protected Edge → App Service

App Service → Cache

App Service → Azure SQL

Cache → Azure SQL
```

---

# 22. Invalid MVP Connections

Examples:

```text
Internet → Azure SQL

Azure SQL → App Service

Cache → App Service

Azure SQL → Protected Edge
```

The exact architecture validation contract is defined in `SIMULATION_SPEC.md`.

Every valid stack retains a direct App Service → SQL write connection, including when Cache is present. Cache diagrams are read-path shorthand. Optional resources must be either completely disconnected or fully connected on their defined path; partly connected paths block Start with an explanation.

---

# 23. Invalid Connection Feedback

Invalid connection attempts should teach the player.

Example:

```text
Connection not allowed.

Azure SQL cannot route application
requests back to App Service.
```

The game should explain why a connection is invalid rather than silently reject it.

---

# 24. Required Architecture Validation

Before traffic begins, the architecture is validated.

`START TRAFFIC` remains disabled when the scenario cannot be processed.

Examples:

```text
ARCHITECTURE INCOMPLETE

No valid path exists from
Internet to App Service.
```

or:

```text
ARCHITECTURE INCOMPLETE

No valid data path exists
from App Service to Azure SQL.
```

---

# 25. Active Path Principle

> **A resource only affects traffic when it exists on the active request path.**

Example:

```text
Internet
   ↓
App Service
   ↓
Azure SQL

Cache exists elsewhere.
```

Result:

```text
Cache Effect:
None
```

Correct:

```text
App Service
     ↓
   Cache
     ↓
 Azure SQL
```

The same principle applies to WAF.

---

# 26. Disconnected Resources

A deployed but disconnected resource:

- Does not affect request processing
- Still incurs runtime cost once the scenario starts

Example:

```text
CACHE

Status:
Running

Traffic Through Cache:
None

Running Cost:
Active
```

This reinforces the idea that deploying a service is not enough.

It must participate in the architecture.

---

# 27. Duplicate Connections

Duplicate identical connections should not increase capacity.

The UI should preferably prevent duplicate connections.

If duplicates exist internally, they should behave as one logical connection.

---

# 28. MVP Request Types

The MVP uses a small number of business request types.

## Browse

Read-oriented traffic.

Conceptual path:

```text
Internet
   ↓
Protected Edge, if connected
   ↓
App Service
   ↓
Cache
   ↓
Azure SQL on Cache Miss
```

If no Cache exists on the eligible path:

```text
App Service
   ↓
Azure SQL
```

---

# 29. Order

Write-oriented business traffic.

Conceptual path:

```text
Internet
   ↓
Protected Edge, if connected
   ↓
App Service
   ↓
Azure SQL
```

Cache does not remove order writes.

---

# 30. Bot Traffic

Bot traffic originates externally.

Without WAF:

```text
Internet
   ↓
App Service
```

Bot traffic consumes application capacity.

With active protected ingress:

```text
Internet
   ↓
Protected Edge
   ↓
App Service
```

Eligible bot traffic may be filtered before reaching App Service.

Bot traffic consumes infrastructure but does not generate normal business revenue.

---

# 31. Automatic Request Routing

The player does not manually configure routing percentages.

The game determines request path based on:

- Business request type
- Available architecture connections
- Active-path rules

Example:

```text
Browse:
App → Cache → SQL on miss

Order:
App → SQL
```

This keeps the gameplay focused on architecture rather than low-level routing configuration.

---

# 32. Cache Eligibility Principle

> **Cache affects eligible read traffic only.**

Cache must not:

- Reduce order writes
- Reduce all database traffic indiscriminately
- Automatically affect disconnected application paths

This is both a gameplay rule and an Azure fidelity rule.

---

# 33. Scenario Briefing

Before traffic begins, the player receives a concise workload briefing.

The game should not reveal every exact future event.

Example:

```text
BLACK FRIDAY

Expected Traffic:
Heavy

Workload:
Read Intensive

Security Signal:
Unusual automated traffic may occur

Availability Target:
99%

Budget:
Limited
```

The player receives enough information to plan, but not enough to solve the entire scenario before playing.

---

# 34. First Attempt Guidance

For the Hackathon demo, the first attempt may intentionally begin with the baseline architecture.

Example:

```text
Internet
   ↓
App Service
   ↓
Azure SQL
```

The game may encourage the player to run traffic before making major changes.

This ensures the first bottleneck is experienced rather than avoided through perfect pre-knowledge.

---

# 35. Architecture Ready State

When validation succeeds and required resources are ready:

```text
ARCHITECTURE READY
```

The UI may display:

```text
Current Running Cost:
Ready to calculate

Scenario Budget:
Available

[ START TRAFFIC ]
```

The player explicitly starts traffic.

---

# 36. Scenario Runtime Reset

Each replay resets scenario runtime state.

Reset:

- Scenario budget
- Revenue
- Incident loss
- Runtime cost totals
- Traffic phase
- Temporary emergency actions
- Runtime failure state

Preserved:

- Architecture layout
- Active deployed resources
- Connections
- Player's redesign decisions

---

# 37. Traffic Phase

After `START TRAFFIC`:

- Scenario runtime begins
- Running cost begins accumulating
- Traffic begins
- HUD becomes active
- Resource utilization changes
- Request visualization appears

The game transitions from preparation to operation.

---

# 38. Traffic Visualization

The renderer shows representative traffic rather than one visual object per actual request.

Visual examples:

```text
Normal Request
Standard packet icon

Bot Request
Threat-marked packet

Failed Request
Broken / rejected packet
```

State must not rely only on color.

---

# 39. Request Flow Visualization

Representative requests follow the active architecture path.

Example:

```text
Internet
   ↓
Protected Edge
   ↓
App Service
   ↓
Cache
   ↓
Azure SQL
```

When a Browse request is served by Cache, the visual flow should clearly end at Cache.

This makes the avoided database work understandable.

---

# 40. Resource Utilization Feedback

Each active processing resource should display a simple state.

Example states:

```text
Healthy

Warning

Overloaded
```

The detail panel may show utilization values.

Authoritative thresholds belong in `SIMULATION_SPEC.md`.

---

# 41. Resource Visual States

## Healthy

- Normal appearance
- Basic utilization indicator

## Warning

- Warning icon
- Status label
- Increased visual emphasis

## Overloaded

- Strong warning indicator
- Pulse or shake
- Request failure indicators
- Explicit status text

The player should identify a major bottleneck within approximately three seconds.

---

# 42. Latency Feedback

Latency is shown at the scenario level.

Example:

```text
Latency
Elevated
```

If numerical values are displayed, they are defined by simulation output.

The player should understand that performance may degrade before complete service failure.

---

# 43. Availability Feedback

Availability represents successful service delivery according to scenario rules.

Example:

```text
Availability
Healthy
```

Critical state:

```text
Availability
CRITICAL
```

Exact thresholds are defined in `SIMULATION_SPEC.md`.

---

# 44. Cost Feedback

Current infrastructure cost remains visible during gameplay.

When the player scales or adds active resources, the UI should make increased cost obvious.

Example:

```text
Running Cost Increased
```

The player should never wonder whether an architecture decision costs more.

---

# 45. Revenue Feedback

Successful business requests generate value.

Example:

```text
Revenue Increased
```

Bot traffic consumes infrastructure without producing normal business value.

This contrast is a core gameplay signal.

---

# 46. Bot Feedback

Bot traffic should be visually distinct.

Without WAF:

```text
Bot Traffic
→ App Service
→ Capacity Consumed
```

With WAF:

```text
Bot Traffic
→ Protected Edge
→ Filtered
```

Filtered traffic should visibly stop at the protected edge.

---

# 47. Live Intervention

Flow management is not a passive observation exercise.

The player may take a small number of live actions.

MVP live actions:

- Scale Out App Service
- Enable / Disable Rate Limit
- Activate Emergency WAF Filtering

The player should not redesign the entire architecture while traffic is running.

Major redesign happens between attempts.

---

# 48. Live Action — Scale Out

Player flow:

```text
Select App Service
      ↓
Choose Scale Out
      ↓
Review Additional Cost
      ↓
Confirm
      ↓
Provisioning Begins
      ↓
New Instance Becomes Active
```

Gameplay effect:

- More compute capacity
- More running cost
- Provisioning delay before benefit

Exact values belong in `SIMULATION_SPEC.md`.

---

# 49. Scale-Out Limits

Scale Out is available while:

- Scenario budget permits
- Instance limit has not been reached
- App Service is in a state that allows scaling

Exact limits belong in `SIMULATION_SPEC.md`.

---

# 50. Scale-Out Feedback

During provisioning:

```text
APP SERVICE

Active Instances:
Current

Provisioning:
Additional Instance

Status:
Not yet contributing capacity
```

The UI must make it clear when new capacity becomes available.

---

# 51. Live Action — Rate Limit

Rate limiting rejects incoming traffic before application processing.

It reduces offered application load and can improve latency, at the cost of rejected legitimate traffic and business opportunity. When the application remains saturated, admitted requests and downstream load may stay unchanged. This simplified model does not simulate queues or retry amplification, so Rate Limit cannot restore successful throughput or rescue an availability failure by itself.

It does not selectively identify bots.

This differentiates it from WAF.

---

# 52. Rate Limit Control

MVP behavior:

- Rate Limit can be enabled
- Rate Limit can be disabled
- Activation may have a short delay
- It affects ingress traffic broadly

Exact traffic reduction belongs in `SIMULATION_SPEC.md`.

---

# 53. Live Action — Emergency WAF Filtering

Emergency WAF filtering is available only when a Protected Edge is part of the active path.

MVP behavior:

- Can be used once per scenario
- Active for a limited duration
- Improves bot filtering
- May introduce legitimate-traffic false positives

Exact filtering and false-positive values belong in `SIMULATION_SPEC.md`.

Emergency filtering can buy time for scale-out during bot-heavy peak traffic. It does not permanently replace missing capacity; once it expires, uncorrected overload returns. Lost requests before recovery still affect final availability.

---

# 54. Pause Behavior

MVP supports Pause.

While paused:

- Traffic simulation pauses
- Player may inspect resources
- Player may inspect current metrics
- Live actions cannot be activated
- Architecture cannot be changed

Recommended principle:

> **Pause is for understanding, not free recovery.**

---

# 55. Soft Failure

Performance problems do not immediately end the scenario.

Examples:

- Elevated latency
- Some failed requests
- Resource overload
- Revenue degradation

The player has an opportunity to recover.

---

# 56. Critical State

The game enters Critical State when the simulation approaches hard-failure conditions.

The UI should clearly communicate urgency.

Possible feedback:

- Critical icon
- Bottleneck highlight
- Strong status text
- Subtle screen-edge warning
- Optional audio cue

Avoid excessive visual noise.

---

# 57. Hard Failure

The scenario ends when a configured hard-failure condition is reached.

Possible causes include:

- Availability failure
- Budget exhaustion
- Critical business-flow failure

The exact conditions are defined in `SIMULATION_SPEC.md`.

---

# 58. Scenario Success

The player survives when:

- The final traffic phase completes
- No hard-failure condition is active
- Scenario budget remains valid

> **Survival does not guarantee a high score.**

A surviving architecture may still receive:

- Poor cost-efficiency results
- High latency penalty
- Low Net Business Value
- Security penalty

Show **Survived** separately from **Targets met**. A timely recovery may avoid hard failure while still missing the final availability target. An unprofitable completed run is explicitly identified as Negative Business Value and receives a capped score.

---

# 59. Failure Transition

Do not immediately cut to a generic Game Over screen.

Recommended flow:

```text
Traffic Stops
     ↓
Primary Problem Highlighted
     ↓
Short Outcome Summary
     ↓
Result Screen
```

Example:

```text
SCENARIO FAILED

Primary Outcome Cause:
Azure SQL Saturation
```

---

# 60. Successful Completion Transition

When the final phase completes:

```text
TRAFFIC SURVIVED
```

Then the simulation moves to the result screen.

The result screen should focus on architecture performance rather than celebration alone.

---

# 61. Primary Outcome Cause

The result screen identifies one primary cause that had the strongest effect on failure or score loss.

Possible MVP causes:

- App Service Saturation
- Azure SQL Saturation
- Unfiltered Bot Traffic
- Excessive Rate Limiting
- Budget Exhaustion
- Overprovisioning
- WAF False Positives
- Negative Business Value
- No Critical Issue

This is broader than the term "Primary Bottleneck."

---

# 62. Primary Bottleneck

When the Primary Outcome Cause is resource saturation, the result may additionally identify:

```text
PRIMARY BOTTLENECK

Azure SQL
```

Not every poor result requires a resource bottleneck.

For example:

```text
PRIMARY OUTCOME CAUSE

Overprovisioning
```

may have no overloaded resource.

---

# 63. Contributing Causes

A result may include multiple secondary factors.

Example:

```text
PRIMARY OUTCOME CAUSE

Azure SQL Saturation


CONTRIBUTING FACTORS

Unfiltered Bot Traffic

WAF False Positives
```

Only one primary outcome cause is emphasized.

Cause labels and thresholds come from the simulation. Workload context such as high read traffic may accompany an explanation, but must not be invented as a scored cause. Keep phase-level explanations available when a later phase has a different dominant loss.

---

# 64. Result Screen

Example structure:

```text
BLACK FRIDAY COMPLETE

Availability
Result

Average Latency
Result

Revenue
Result

Infrastructure Cost
Result

Incident Loss
Result

Net Business Value
Result

Architecture Score
Result
```

Authoritative calculations belong in `SIMULATION_SPEC.md`.

---

# 65. Root Cause Explanation

The result screen should explain what happened.

Example:

```text
PRIMARY OUTCOME CAUSE

Azure SQL Saturation

WHY?

Browse traffic generated more database reads
than Azure SQL could process.

App Service still had available capacity.
```

---

# 66. Architecture Insight

The result screen may provide one deterministic architecture insight.

Example:

```text
ARCHITECTURE INSIGHT

Adding additional App Service instances
would not resolve this database bottleneck.

Consider reducing eligible read traffic
before it reaches Azure SQL.
```

MVP insights are rule-based.

AI is not required.

---

# 67. Replay CTA

Primary result action:

```text
[ REDESIGN & RETRY ]
```

Secondary:

```text
[ VIEW DETAILS ]
```

The result screen should leave the player thinking:

> I know what I want to change next.

---

# 68. Redesign Phase

After selecting `REDESIGN & RETRY`:

- Return to the same architecture
- Traffic runtime state is cleared
- Architecture is preserved
- Build Mode becomes available
- Previous primary outcome cause remains visible as context

Example:

```text
Previous Issue:
Azure SQL Saturation
```

---

# 69. Replay Comparison

After replay, compare the previous and current attempt.

Example structure:

```text
PREVIOUS → CURRENT

Database Peak
Improved

Latency
Improved

Availability
Improved

Infrastructure Cost
Increased

Net Business Value
Improved
```

Where useful, numerical values may also be shown.

This is one of the most important feedback moments in the MVP.

Always show elapsed time and completion status. Lower total cost from an early failure is not evidence of better efficiency. Compare matching phase intervals where appropriate; retain true full-attempt totals rather than rewriting them to fit the tutorial.

---

# 70. MVP Learning Sequence

The intended learning sequence is:

## Attempt 1

```text
App → SQL
```

Expected lesson:

> A simple architecture can fail under load.

## Attempt 2

```text
App ×2 → SQL
```

Expected lesson:

> Scale-out improves compute capacity but may expose another bottleneck.

## Attempt 3

```text
App ×2 → Cache → SQL
```

Expected lesson:

> Reducing downstream work can outperform brute-force scaling.

## Attempt 4

```text
Protected Edge → App ×2 → Cache → SQL
```

Expected lesson:

> Filtering unwanted traffic before compute can improve cost efficiency and business value.

These sketches show learning checkpoints, not guaranteed full-run success with two instances. Use the explicit reference policies in `SIMULATION_SPEC.md` section 110. In particular, compare a four-instance no-Cache stack against the same stack with Cache to isolate SQL failure, then compare unprotected four-instance Cache against protected three-instance Cache for security/economics. The player can also recover reactively with live scale-out or an emergency-filter bridge. All Cache stacks retain the direct SQL write edge.

---

# 71. First-Time Player Experience

The first-time player begins with a simple architecture:

```text
Internet
   ↓
App Service
   ↓
Azure SQL
```

Intro text should remain short.

Example:

```text
Your application is online.

Black Friday traffic is approaching.

Keep the service available while
protecting business value.
```

---

# 72. Tutorial Guidance

Tutorial prompts should be contextual and brief.

Good:

```text
Azure SQL is overloaded.

App Service still has available capacity.
```

Better than:

```text
Azure SQL is a managed relational database...
```

The game should teach through visible consequences first.

Resource descriptions can provide deeper Azure explanations separately.

---

# 73. Main Interaction Model

MVP is primarily mouse-driven.

Suggested controls:

- Left Click — Select
- Drag Resource — Move / Place
- Drag Empty Space — Pan
- Mouse Wheel — Zoom
- Click Connector — Begin Connection
- Click Target — Complete Connection

Keyboard shortcuts are optional.

---

# 74. Game Speed

Required:

- Pause
- 1×

Optional:

- 2×

Complex speed controls are not an MVP priority.

---

# 75. Audio

Audio is optional.

If included, sounds should communicate:

- Resource deployed
- Provisioning complete
- Warning
- Critical state
- Bot filtered
- Scenario complete

Audio must not be required to understand system state.

---

# 76. Animation Principles

Animation exists to explain system behavior.

Use animation for:

- Provisioning
- Traffic flow
- Cache hit
- Bot filtering
- Resource overload
- Scale-out completion

Avoid decorative animation that reduces architecture readability.

---

# 77. UX Clarity Requirement

Within approximately three seconds, the player should be able to identify:

1. Where traffic enters
2. Which resource is under pressure
3. Where requests are failing
4. Whether bots are reaching compute
5. Whether scaling is still provisioning
6. Whether running cost is rising
7. Whether the scenario is approaching failure

---

# 78. Accessibility

System state must never rely on color alone.

Example:

```text
Color
+
Warning Icon
+
OVERLOADED
+
Utilization Value
```

Use multiple signals:

- Color
- Icon
- Text
- Number
- Animation

---

# 79. Resource Detail — App Service

Example structure:

```text
APP SERVICE

Status
Running

Instances
Current Count

Utilization
Current State

Capacity
Current Capacity

Running Cost
Current Cost

[ SCALE OUT ]
```

Authoritative values come from `SIMULATION_SPEC.md`.

---

# 80. Resource Detail — Cache

Example structure:

```text
AZURE MANAGED REDIS

Status
Running

Eligible Traffic
Current

Cache Hit Ratio
Current

Database Requests Avoided
Current

Running Cost
Current
```

The panel should show architectural value, not only raw metrics.

---

# 81. Resource Detail — Azure SQL

Example:

```text
AZURE SQL

Status
Warning

Read Load
Current

Write Load
Current

Utilization
Current

Running Cost
Current
```

---

# 82. Resource Detail — Protected Edge

Example:

```text
PROTECTED EDGE

WAF
Enabled

Bot Traffic
Current

Filtered
Current

Passed
Current

Running Cost
Current
```

---

# 83. MVP Persistence

From the player's perspective, the current architecture should be preserved when:

- Returning from the result screen
- Starting a replay
- Returning to Build Mode

Browser-local architecture persistence is required for the MVP. Architecture also survives:

- Refresh
- Reopening the MVP

Scenario runtime state is not preserved.

Reload opens Build Mode. Save completed instance counts and deployment status, never unfinished scale-out capacity. Unfinished new resources restart their full preparation delay on reload; within an uninterrupted Build Mode session their progress is retained.

Implementation details belong in `TECHNICAL_DESIGN.md`.

---

# 84. Reset Behavior

The MVP should provide:

```text
[ RESET ARCHITECTURE ]
```

Reset returns the architecture to the predefined Black Friday baseline.

This prevents the player from becoming stuck after experimentation.

---

# 85. Demo Flow

Recommended Hackathon demo story:

```text
1. Show App → SQL baseline

2. Start operation

3. Show compute pressure

4. Scale out App Service

5. Show improved compute capacity

6. Show Azure SQL becoming the next bottleneck

7. End / inspect result

8. Add Cache

9. Replay

10. Show database pressure decrease

11. Introduce bot traffic

12. Add Protected Edge / WAF

13. Replay or show filtered traffic

14. Compare results

15. End with:
"Build. Scale. Keep the business flowing."
```

The demo should tell one coherent story rather than list features.

One full scenario lasts three minutes; several full attempts do not fit in a 3–4 minute presentation. Use clearly labeled reference/precomputed results or excerpts for a short presentation, or allocate longer for a full live multi-attempt walkthrough. Do not change numerical behavior or hide failed phases merely to fit the presentation.

---

# 86. Gameplay Acceptance Criteria

The gameplay layer is complete when a player can:

1. Understand where traffic enters
2. Place a resource
3. Connect valid resources
4. Receive useful feedback for invalid connections
5. Understand when provisioning is incomplete
6. Start operation
7. Watch traffic follow the architecture
8. Distinguish Browse, Order, and Bot behavior
9. Identify a resource under pressure
10. Scale App Service
11. Understand that scale-out takes time
12. Add Cache
13. See eligible database reads decrease
14. Understand that writes still reach Azure SQL
15. Add Protected Edge / WAF
16. See bot traffic filtered before compute
17. Enable Rate Limit
18. Understand its revenue trade-off
19. Survive or fail
20. Understand the Primary Outcome Cause
21. Redesign
22. Replay
23. Compare previous and current outcomes
24. Explain why the architecture behaved differently

---

# 87. Gameplay Validation Questions

After playing, a test player should be able to answer:

1. What was the primary outcome cause?
2. Why did scaling App Service help or not help?
3. What changed when Cache was added?
4. Which requests still reached Azure SQL after Cache was added?
5. What changed when WAF was added?
6. What is the trade-off of Rate Limiting?
7. Would you redesign and try again?

The goal is for the player to understand architecture through gameplay rather than through a lecture.

---

# 88. Future Gameplay Systems

Explicitly Post-MVP:

- Full campaign progression
- Persistent Player Level
- Architecture Tier progression
- Long construction timers
- Service Bus
- Azure Functions
- Container Apps
- Storage
- CDN
- Key Vault
- VNet
- Private Endpoint
- Multiple ingress sources
- Complex network topology
- Region selection
- Multi-region
- AWS
- GCP
- Specialist system
- Specialist slots
- Leaderboards
- PvP
- AI Architecture Coach
- AI-generated scenarios
- Offline progression

---

# 89. Gameplay / Simulation Boundary

This document defines player-facing behavior.

The following authoritative values belong in `SIMULATION_SPEC.md`:

- App Service request capacity
- Azure SQL read/write capacity
- Cache hit ratio
- WAF filtering percentage
- WAF false-positive rate
- Provisioning times
- Rate Limit percentage
- Runtime costs
- Revenue values
- Failure thresholds
- Utilization thresholds
- Latency formula
- Availability formula
- Score formula
- Instance limits
- Emergency action durations
- Cooldowns

Gameplay examples in this document are illustrative only.

`SIMULATION_SPEC.md` is the source of truth for numerical behavior.

---

# 90. Final Gameplay Principle

Whenever a gameplay mechanic is proposed, ask:

> **Does this help the player make or understand a meaningful architecture decision?**

If yes, it may belong in Stack & Survive.

If it only adds complexity without improving architecture reasoning, it should be deprioritized.

The gameplay loop remains:

```text
Architecture
     ↓
Traffic
     ↓
Pressure
     ↓
Decision
     ↓
Outcome
     ↓
Understanding
     ↓
Better Architecture
```

> **That is Stack & Survive.**
