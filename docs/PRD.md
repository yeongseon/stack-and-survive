# Stack & Survive

## Product Requirements Document

**Version:** 0.5  
**Status:** Hackathon MVP — Scope Locked  
**Primary Platform:** Web  
**Initial Cloud Provider:** Microsoft Azure  
**Genre:** Cloud Architecture Strategy / Persistent Base Building / Defense Simulation  
**Target Gameplay Session:** 3–6 minutes  
**MVP Simulation Type:** Deterministic, browser-based cloud architecture simulation

**Numerical authority:** `SIMULATION_SPEC.md` v0.2. Unless explicitly stated otherwise, numerical examples below illustrate product concepts rather than define executable balance. Sections 98–100 summarize or link the authoritative baseline and reference policies.

---

# 1. Product Summary

## 1.1 One-Line Definition

**Stack & Survive is a cloud architecture strategy game where players build and grow a cloud environment, then defend it against realistic traffic, failures, and cost pressure.**

## 1.2 Core Message

> **Your architecture is your defense.**

Players do not build weapons or traditional defense towers.

They build cloud architecture.

Players survive by making better architectural decisions:

- Scale compute
- Add caching
- Filter unwanted traffic
- Reduce database pressure
- Improve observability
- Increase resilience
- Balance reliability against cost

The same workload can produce completely different outcomes depending on how the system is designed.

---

# 2. Product Vision

Cloud architecture is usually learned through:

- Static diagrams
- Documentation
- Reference architectures
- Certification materials
- Predetermined labs

But real systems are not static.

Traffic spikes.

Databases overload.

Bots consume infrastructure.

Dependencies fail.

Scaling takes time.

Every architectural decision costs money.

Stack & Survive turns these concepts into gameplay.

Players build a cloud base and repeatedly test it against short workload scenarios.

The long-term vision is to make cloud architecture something players can:

> **Build, operate, break, understand, improve, and master through play.**

---

# 3. Core Product Philosophy

Stack & Survive is built around one idea:

> **You don't build defenses. You build architecture.**

Traditional defense games ask:

> Which tower should I place?

Stack & Survive asks:

> How should I design this system?

The player's defensive tools are architectural decisions such as:

- Load balancing
- Scaling
- Caching
- Queuing
- Rate limiting
- WAF
- Database optimization
- Replication
- Failover
- Monitoring
- Observability

Architecture itself is the gameplay.

---

# 4. Product Principles

## 4.1 Architecture Is the Gameplay

Architecture quality must determine whether the player succeeds.

A large budget, high player level, or powerful Specialist must never fully compensate for fundamentally poor architecture.

## 4.2 No Single Correct Architecture

A scenario should support multiple viable strategies.

Examples:

- More compute
- Better caching
- Request filtering
- Asynchronous processing
- Database scaling
- Different business flow design

Each approach introduces trade-offs.

## 4.3 Same Traffic, Different Outcome

Two architectures receiving the same:

- RPS
- Business request mix
- Bot percentage
- Scenario duration

should be able to produce meaningfully different results.

This is a core gameplay requirement.

## 4.4 Cost Matters

Overprovisioning must not become the universal winning strategy.

A huge architecture may survive easily but perform poorly financially.

The player balances:

- Reliability
- Performance
- Security
- Cost
- Business value

## 4.5 Failure Is Learning

Failure is not primarily punishment.

The game should answer:

> Why did this architecture fail?

The desired loop is:

```text
Fail
 ↓
Understand
 ↓
Redesign
 ↓
Retry
```

## 4.6 Complexity Comes From Decisions, Not Controls

Core interaction should remain simple:

```text
Select
 ↓
Place
 ↓
Connect
 ↓
Upgrade
 ↓
Run
```

Complexity comes from decisions such as:

- Should I scale out?
- Should I add a cache?
- Is the database actually the bottleneck?
- Should I spend more before peak traffic?
- Should I reject some traffic to protect the service?

> **Complexity should emerge from architecture, not from controls.**

## 4.7 Simplified but Conceptually Accurate

Stack & Survive is not an exact Azure performance simulator.

Cloud concepts should be simplified enough to be playable while remaining conceptually accurate.

> **Simplified, not misleading.**

## 4.8 Explainable Simulation

The simulation must not behave like a black box.

Example:

```text
WHY DID YOU FAIL?

Database utilization reached 143%.

82% of Browse requests reached SQL directly.

Peak latency:
1,840 ms

Possible improvements:

+ Add Cache
+ Increase database capacity
+ Reduce synchronous database access
```

---

# 5. Product Strategy

## 5.1 Azure-First

The first playable version focuses entirely on Microsoft Azure.

The objective is to make one cloud experience good before expanding to other providers.

## 5.2 Multi-Cloud-Ready

The underlying game domain should avoid unnecessary Azure-specific coupling.

> **Azure-first, multi-cloud-ready — not multi-cloud-first.**

Conceptually:

```text
Game Domain

Gateway
Compute
Database
Cache
Queue
Storage
Security
Observability

        ↓

Provider Mapping

Azure
AWS
GCP
```

AWS and GCP are not implemented in the Hackathon MVP.

---

# 6. Future Cloud Factions

Cloud providers may eventually become playable factions.

Potential providers:

- Microsoft Azure
- Amazon Web Services
- Google Cloud

Example mapping:

| Domain Concept | Azure | AWS | GCP |
|---|---|---|---|
| Managed Compute | App Service | App Runner / ECS | Cloud Run |
| Function | Azure Functions | Lambda | Cloud Functions |
| Relational Database | Azure SQL | RDS | Cloud SQL |
| Cache | Azure Managed Redis | ElastiCache | Memorystore |
| Secret Store | Key Vault | Secrets Manager | Secret Manager |

Provider factions are **Post-MVP**.

---

# 7. Target Players

Primary audience:

- Developers
- Cloud Engineers
- Support Engineers
- SREs
- DevOps Engineers
- Solution Architects
- Cloud learners

Secondary audience:

- Students
- Certification learners
- Architecture interview candidates
- Internal technical training programs
- Enterprise cloud training

---

# 8. Game Structure

Stack & Survive combines:

1. Persistent base building
2. Short traffic-defense sessions
3. Long-term architecture progression

---

# 9. Persistent Cloud Base

The long-term product gives each player a persistent cloud environment.

Example:

```text
MY CLOUD

Application Gateway
App Service ×3
Cache
Azure SQL
Service Bus
Azure Monitor
```

Typical long-term loop:

```text
LOGIN
  ↓
VIEW CLOUD BASE
  ↓
BUILD / UPGRADE / REDESIGN
  ↓
SELECT SCENARIO
  ↓
START TRAFFIC
  ↓
DEFEND
  ↓
RESULT
  ↓
XP / RATING / REWARD
  ↓
BASE SAVED
```

For the Hackathon MVP, persistent experience may be implemented using browser-local storage only.

Account-based persistence is not required.

---

# 10. Base Building Inspiration

The building interaction may borrow familiar interaction patterns from persistent base-building games such as Clash of Clans.

Useful concepts include:

- Persistent base
- Build menu
- Placement
- Construction state
- Upgrade progression
- Resource unlocks
- Long-term growth

Stack & Survive must remain visually and mechanically distinct.

---

# 11. Base Building Flow

```text
OPEN BUILD MENU
      ↓
SELECT RESOURCE
      ↓
PLACE RESOURCE
      ↓
PROVISION
      ↓
RUNNING
      ↓
CONNECT
      ↓
UPGRADE / SCALE
```

---

# 12. Provisioning

Resources do not always become available instantly.

Example:

```text
Deploy App Service

Provisioning...
5 seconds

Running
```

Scaling may also require time:

```text
App Service

Instances:
2 → 3

Provisioning:
8 seconds
```

Provisioning makes preparation meaningful.

---

# 13. Visual Style

Recommended:

- 2D / 2.5D
- Fixed isometric perspective
- RTS-inspired layout
- Persistent base-building feel
- Clear cloud visual language

Interactions:

- Pan
- Zoom
- Select
- Drag
- Drop
- Snap
- Connect

Excluded from MVP:

- Full 3D
- Free camera rotation
- First-person navigation
- Physics simulation

---

# 14. Physical Placement vs Logical Topology

> **Visual placement is for building experience. Logical topology determines simulation.**

Placing Azure SQL physically closer to App Service does not reduce latency.

Connections determine request paths.

Example:

```text
App Service
     ↓
   Cache
     ↓
 Azure SQL
```

---

# 15. Deployment Zones

Future versions may introduce:

- Public Zone
- Application Zone
- Data Zone
- Network boundaries

Conceptual hierarchy:

```text
Foundation
    ↓
Zone
    ↓
Service
    ↓
Connection
```

Advanced networking restrictions are excluded from MVP.

---

# 16. Player Progression

Player progression and architecture progression are separate concepts.

---

# 17. Player Level

Player Level represents overall experience.

Potential future benefits:

- Specialist slots
- Cosmetics
- Challenge modes
- Profile progression

XP generally does not decrease after failure.

---

# 18. Architecture Tier

Architecture Tier determines available technologies.

Example long-term progression:

| Tier | Main Concept | Example Azure Capability |
|---|---|---|
| 1 | Basic Application | App Service, Azure SQL |
| 2 | Ingress | Application Gateway |
| 3 | Scaling | Scale-out |
| 4 | Caching | Azure Managed Redis |
| 5 | Async Processing | Service Bus, Functions |
| 6 | Security | WAF, Key Vault |
| 7 | Observability | Azure Monitor, Application Insights |
| 8 | Advanced Compute | Container Apps |
| 9 | Resilience | Replication, Failover |
| 10 | Global Architecture | Front Door, Multi-region |

Full progression is Post-MVP.

---

# 19. Unlock Philosophy

Preferred pattern:

```text
Experience Problem
       ↓
Understand Bottleneck
       ↓
Unlock New Capability
       ↓
Redesign Architecture
       ↓
Observe Improvement
```

Avoid arbitrary unlocks that have no relationship to player experience.

---

# 20. Resource Model

Conceptual resource properties:

```text
id
type
provider
category
capacity
latency
cost
health
connections
placementRules
scalingCapability
provisioningTime
```

Categories:

- Network
- Compute
- Data
- Cache
- Messaging
- Security
- Storage
- Observability

---

# 21. Traffic System

Traffic is the pressure applied to the architecture.

Traffic may contain:

```text
RPS
businessRequestType
payloadSize
readWriteRatio
botRatio
latencyRequirement
duration
burstPattern
```

---

# 22. Business Request Model

Different business requests follow different execution paths.

This means identical RPS can generate different infrastructure pressure.

---

# 23. Product Browse Flow

```text
Client
  ↓
Gateway
  ↓
Application
  ↓
Cache
 ├─ Hit → Response
 └─ Miss
      ↓
   Database Read
      ↓
   Response
```

---

# 24. Static Content Flow

```text
Client
  ↓
CDN / Storage
  ↓
Response
```

Database access is not required.

This flow is Post-MVP.

---

# 25. Order Flow

```text
Client
  ↓
Gateway
  ↓
Application
  ↓
Database Write
  ↓
Queue
  ↓
Worker
```

Full asynchronous flow is Post-MVP.

---

# 26. Traffic Mix

Example:

```text
BLACK FRIDAY

50% Browse
20% Search
15% Login
10% Order
 5% Payment
```

MVP may simplify the number of business request types while preserving the concept.

---

# 27. Traffic Direction

For MVP readability, external traffic enters from one predictable visual direction.

Example:

```text
INTERNET
   ↓
WAF
   ↓
APPLICATION
   ↓
CACHE
   ↓
DATABASE
```

Actual request flow follows the architecture graph.

Multiple ingress points are Post-MVP.

---

# 28. Scenario System

Scenarios should be data-driven.

Example:

```yaml
scenario: black-friday
duration: 240

traffic:
  - time: 0
    rps: 100

  - time: 60
    rps: 250

  - time: 120
    rps: 500
    botRatio: 0.20

businessMix:
  browse: 0.70
  order: 0.30
```

Scenario definitions should be separate from simulation logic.

---

# 29. Future Scenario Examples

- Product Launch
- Flash Sale
- Black Friday
- Viral Traffic Spike
- Bot Storm
- DDoS
- Database Meltdown
- Cache Miss Storm
- Retry Storm
- Dependency Failure
- It's Always DNS
- Regional Outage

Only Black Friday is required for MVP.

---

# 30. Simulation Principles

The MVP simulation prioritizes:

- Simplicity
- Determinism
- Explainability
- Testability

Basic utilization:

```text
Utilization =
Incoming Load / Effective Capacity
```

Example states:

```text
0–70%       Healthy
70–100%     Warning
100%+       Overloaded
```

---

# 31. Deterministic Simulation

For the same:

- Architecture
- Scenario
- Player actions

the result should be identical or nearly identical.

Randomness must not dominate architecture decisions.

---

# 32. Cache Simulation

Example:

```text
Incoming Browse Requests
300 req/s

Cache Hit Ratio
80%

Cache Hits
240 req/s

Database Requests
60 req/s
```

Cache placement must visibly reduce downstream database load.

---

# 33. Scaling

MVP supports Scale Out.

Example:

```text
App Service

1 instance
→
2 instances

Capacity increases
Cost increases
Provisioning delay applies
```

Advanced autoscaling is Post-MVP.

---

# 34. Economy System

Cloud economics are part of the gameplay.

Players should not solve every problem through unlimited infrastructure.

---

# 35. Core Economic Formula

```text
Net Business Value =
Revenue
- Infrastructure Cost
- Incident Loss
- Emergency Action Cost
```

---

# 36. Starting Budget

Each scenario begins with a limited operational budget.

Example:

```text
Starting Budget:
1,000 Cloud Credits
```

Cloud Credits are gameplay currency.

They are not actual Azure billing units.

---

# 37. Revenue

Successfully processed requests generate value.

Placeholder balancing values:

| Request | Revenue |
|---|---:|
| Browse | 1 |
| Order | 10 |

Additional request types can be added later.

---

# 38. Infrastructure Cost

Active resources consume budget.

MVP balancing values are defined later in the baseline balance table.

---

# 39. Economic Design Principle

A larger architecture should generally be:

- Safer
- More expensive

A smaller architecture should generally be:

- Cheaper
- More vulnerable

The best design depends on the workload.

---

# 40. Profitability

Survival alone does not guarantee a high score.

Example:

```text
Availability        99.99%
Revenue             2,800
Cloud Cost         -2,100
Incident Loss         -50
────────────────────────
Net Business Value    650
```

An efficient architecture can outperform a massively overprovisioned one.

---

# 41. Real Azure Pricing

MVP does not use live Azure pricing.

Future architecture:

```text
Azure Pricing
     ↓
Pricing Adapter
     ↓
Normalized Game Cost
     ↓
Simulation
```

Real pricing integration is Post-MVP.

---

# 42. Live Intervention

Traffic defense is not completely passive.

Players may intervene while traffic is running.

Actions must have cost, delay, or trade-offs.

---

# 43. Scale Out

Example:

```text
App Service

1 → 2 instances

Provisioning:
8 seconds

Additional Cost:
+5/min
```

---

# 44. Rate Limit

The player may intentionally reject traffic.

Trade-off:

```text
System Stability ↑
Accepted Requests ↓
Revenue ↓
```

In the MVP, stability here means lower offered load and potentially lower latency, not guaranteed throughput or availability recovery. Proportional admission may leave downstream throughput unchanged while App remains saturated. Rejected legitimate traffic still counts against business success.

---

# 45. WAF Emergency Rule

Available only if a WAF exists on the active request path.

Example:

```text
Emergency Bot Filter

Bot Filtering:
+60%

False Positive Risk:
5%
```

---

# 46. Live Intervention Principle

> **Emergency actions may help a good architecture survive unexpected pressure, but they must not rescue a fundamentally bad architecture for free.**

---

# 47. Failure Model

Failure has multiple levels.

---

# 48. Soft Failure

Examples:

- Latency target exceeded
- Some 5xx responses
- Database warning utilization
- Revenue degradation

The scenario continues.

---

# 49. Critical State

Example:

```text
Availability < 95%
for 5 consecutive seconds
```

The UI must clearly communicate urgency.

---

# 50. Hard Failure

Configurable conditions may include:

## Availability Failure

```text
Availability < 90%
for 20 consecutive simulation seconds
```

## Financial Failure

```text
Available Budget <= 0
```

## Critical Business Failure

A mandatory request flow remains unavailable beyond its recovery window.

---

# 51. Failure Penalty

Failure does not destroy the architecture.

Long-term example:

```text
SCENARIO FAILED

Player XP             +80
Architecture Rating   -15
Revenue               Reduced
Scenario Reward       Lost
Base                   Preserved
```

Full progression penalties are Post-MVP.

---

# 52. Architecture Rating

Long-term design separates:

```text
Player Level
18

Architecture Rating
1,742
```

Potential future leagues:

- Single Instance
- Load Balanced
- Highly Available
- Fault Tolerant
- Multi-Region
- Five Nines

Post-MVP.

---

# 53. Session Length

Target scenario duration:

> **3–6 minutes**

Hackathon demo target:

> **Approximately 3–4 minutes**

Difficulty should increase through architecture complexity, not long waiting periods.

---

# 54. Traffic Start Control

Players intentionally start traffic.

Example:

```text
ARCHITECTURE READY

Expected Traffic:
300 req/s

Traffic Profile:
Read Heavy

[ START TRAFFIC ]
```

---

# 55. Onboarding Philosophy

The campaign introduces problems before their solutions.

The player should understand why a technology exists before being expected to use it.

---

# 56. Level 1 — First Service

Available:

- App Service
- Azure SQL

Architecture:

```text
Internet
   ↓
App Service
   ↓
Azure SQL
```

Learning:

- Requests consume capacity
- Application and database are separate bottlenecks

---

# 57. Level 2 — Traffic Spike

Problem:

```text
Normal:
100 req/s

Peak:
250 req/s
```

New capability:

> **Scale Out**

Learning:

> Increasing compute capacity increases both throughput and cost.

---

# 58. Level 3 — Database Bottleneck

Example:

```text
Traffic:
300 req/s

App Utilization:
55%

Database Utilization:
135%
```

Adding more App Service instances does not solve the problem.

New resource:

> **Cache**

New architecture:

```text
Internet
   ↓
App Service
   ↓
Cache
 ├─ Hit → Response
 └─ Miss
       ↓
    Azure SQL
```

Learning:

> **Scaling the wrong layer does not solve the bottleneck.**

---

# 59. Early Progression Loop

```text
Experience Problem
       ↓
Understand Bottleneck
       ↓
Unlock Capability
       ↓
Redesign
       ↓
Observe Better Outcome
```

---

# 60. Architecture Score

MVP score should be deterministic.

Initial weighting direction:

```text
Architecture Score

40% Reliability
20% Latency
25% Net Business Value
15% Security
- Failure Penalties
- Overprovisioning Penalties
```

Exact weights remain balance parameters.

Security scoring must depend on scenario requirements.

A scenario with no meaningful security threat should not automatically penalize a design for lacking WAF.

---

# 61. Result Screen

Example:

```text
STAGE COMPLETE

Traffic Handled
98.7%

Availability
99.94%

Average Latency
182 ms

Revenue
4,820

Infrastructure Cost
-1,140

Incident Loss
-310

Net Business Value
3,370

Architecture Score
8,740
```

---

# 62. Explainable Result

Example:

```text
PRIMARY BOTTLENECK

Azure SQL reached 137% utilization.

Cache reduced database traffic by 73%.

Scale-out removed compute saturation.

WAF filtered 68% of bot traffic.
```

---

# 63. Specialist System

Future Specialists represent real cloud engineering roles:

- Cloud Architect
- Support Engineer
- SRE
- FinOps Specialist
- Security Engineer

Example:

```text
SUPPORT ENGINEER

Passive:
Improved issue visibility

Active:
Root Cause Analysis
```

Specialists enhance architecture.

They do not replace architecture.

Specialists are Post-MVP.

---

# 64. Specialist Slots

Future progression may unlock:

| Progression | Slots |
|---|---:|
| Early | 1 |
| Mid | 2 |
| Late | 3 |
| End Game | 4 |

Post-MVP.

---

# 65. Region System

Potential future concepts:

- Home Region
- Regional pricing
- Regional latency
- Secondary Region
- Regional outage
- Multi-region architecture

Region gameplay is explicitly excluded from MVP.

---

# 66. Future Game Modes

Potential modes:

## Campaign

Designed progression through architecture concepts.

## Challenge

Optimize architecture under constraints.

## Sandbox

Build freely and generate workloads.

MVP contains one Campaign-style scenario only.

---

# 67. Social and Competitive Features

Future competition can compare architectures using the same workload.

Example:

```text
Same Scenario

Player A Architecture
        vs
Player B Architecture
```

Compare:

- Availability
- Latency
- Cost
- Net Business Value
- Architecture Score

Leaderboards and multiplayer are Post-MVP.

---

# 68. AI Features

AI is not required for the core MVP.

Potential future features:

## Architecture Coach

Explains why the system failed.

## Scenario Generator

Creates new workloads.

## Architecture Review

Provides educational feedback.

The deterministic simulation remains the source of truth.

AI explains simulation results rather than inventing them.

---

# 69. Scenario Authoring

Scenario definitions should be content rather than simulation code.

Long-term benefits:

- Faster content creation
- Community scenarios
- Training scenarios
- AI-generated scenarios
- Easy balance testing

Structured JSON or YAML should be used.

---

# 70. Open Source Strategy

Stack & Survive should be designed to be open-source friendly.

Potential benefits:

- Community-created scenarios
- New resource packs
- AWS/GCP provider adapters
- Simulation research
- Educational use
- Transparent game rules
- Community balance discussions
- Contribution from cloud practitioners

Recommended repository principles:

- No internal Microsoft data
- No confidential telemetry
- No private support tooling
- No proprietary Azure performance data
- No copyrighted third-party game assets
- Data-driven extensibility
- Clear contribution guidelines
- Automated tests for simulation behavior

Public release must follow applicable employer, IP, OSS, trademark, and Hackathon policies.

---

# 71. Potential Open Source Extension Model

Long-term repository structure may support:

```text
providers/
  azure/
  aws/
  gcp/

scenarios/
  black-friday/
  bot-storm/
  retry-storm/

resources/
  compute/
  cache/
  database/

specialists/
  support-engineer/
  sre/
  finops/
```

Community contributions should primarily extend content and providers without requiring changes to the simulation core.

---

# 72. Technical Architecture Principles

Product requirements:

- Simulation must be deterministic
- Simulation must be renderer-independent
- Scenarios must be data-driven
- MVP should not require a backend
- Browser-local persistence is sufficient
- Same inputs must produce the same simulation outcome

Detailed framework decisions belong in `TECHNICAL_DESIGN.md`.

---

# 73. Conceptual Package Structure

```text
apps/
  game/

packages/
  schema/
  cloud-domain/
  simulation/
  scenarios/
```

---

# 74. Simulation / Rendering Separation

```text
Architecture Model
       ↓
Simulation Engine
       ↓
Simulation Snapshot
       ↓
Game Renderer
```

This enables:

- Unit testing
- Balance testing
- Headless simulation
- Replay
- Future AI analysis
- Alternative renderers

---

# 75. Traffic Visualization

Simulation uses aggregated request volumes.

Rendering shows representative particles.

Example:

```text
Blue    Normal Traffic
Red     Bot Traffic
Yellow  Business Write
```

The renderer does not create one entity for every request.

---

# 76. UX Feedback Requirements

The player should be able to identify within approximately three seconds:

- The current bottleneck
- Where requests are being dropped
- Whether cost is increasing rapidly
- Whether bots are consuming capacity
- Whether scaling is still provisioning
- Whether the scenario is approaching failure

Do not rely on color alone.

Use combinations of:

- Color
- Icons
- Text
- Numbers
- Animation

---

# 77. Main HUD

Primary:

- Traffic
- Availability
- Latency
- Error Rate
- Cloud Cost
- Revenue
- Net Business Value

Secondary:

- App Utilization
- Database Utilization
- Cache Hit Ratio
- Filtered Bot Traffic

---

# 78. Resource Information UI

Example:

```text
CACHE

GAME EFFECT

Hit Ratio:
80%

Capacity:
500 req/s

Running Cost:
8/min


CLOUD CONCEPT

Caches frequently accessed data
to reduce backend workload.

Azure:
Azure Managed Redis
```

---

# 79. MVP Scope Lock

> **The Hackathon MVP implements one Black Friday scenario, four core deployable resources, multiple meaningful architecture strategies, and one complete redesign/replay loop.**

The MVP is:

> **A deterministic simulation of Azure architecture concepts.**

It does **not** deploy or operate real Azure resources.

---

# 80. MVP In Scope

Core deployable resources:

- App Service
- Azure SQL
- Cache
- WAF

Supporting concept:

- Internet traffic source

Capabilities:

- Resource placement
- Resource connection
- Scale-out
- Bot filtering
- Cache behavior
- Provisioning delay
- Revenue
- Infrastructure cost
- Live intervention
- Failure detection
- Result analysis
- Architecture Score
- Replay
- Browser-local architecture persistence

One scenario:

> **Black Friday**

---

# 81. MVP Out of Scope

Explicitly excluded:

- Service Bus
- Azure Functions
- Complex networking
- Arbitrary network topology
- Real Azure resource deployment
- Real Azure performance data
- Live Azure pricing
- Account authentication
- Backend persistence
- Full progression system
- Player Level implementation
- Architecture Tier implementation
- Specialists
- Region gameplay
- Multi-region
- AWS
- GCP
- PvP
- Leaderboards
- AI Coach
- AI Scenario Generation
- Multiple scenarios
- Full Tech Tree
- Offline progression
- Full 3D renderer

---

# 82. Playable MVP User Journey

The Hackathon demo should follow this exact loop:

```text
1. Player opens the predefined Black Friday base

2. Player reviews expected workload

3. Player modifies the architecture

4. Player starts traffic

5. Simulation runs

6. Player observes bottlenecks

7. Player performs a live action

8. Scenario succeeds or fails

9. Result screen identifies the primary outcome cause and bottleneck, if applicable

10. Player redesigns the architecture

11. Player replays the same scenario

12. The result changes because the architecture changed
```

This is the core Hackathon experience.

---

# 83. Architecture Validation Rules

The architecture graph must enforce valid request paths.

Examples:

```text
VALID

Internet → App Service → Azure SQL

Internet → WAF → App Service → Azure SQL

App Service → Cache → Azure SQL
```

Invalid examples:

```text
INVALID

Internet → Azure SQL

Cache → App Service

Azure SQL → WAF
```

---

# 84. Start Validation

The **Start Traffic** button must remain disabled when:

- No valid path exists from Internet to application
- Required application flow is incomplete
- Resource connection direction is invalid
- Architecture graph cannot process the scenario

The UI must explain what is missing.

Example:

```text
Cannot start traffic.

No valid application path reaches Azure SQL.
```

---

# 85. Active Path Rule

> **A resource affects traffic only when it exists on the actual request path.**

Example:

```text
Internet → App → SQL

WAF placed elsewhere
```

Result:

> WAF has no filtering effect.

Correct:

```text
Internet → WAF → App → SQL
```

Cache follows the same rule.

---

# 86. Disconnected Resource Rule

A deployed but disconnected resource:

- Does not affect traffic
- Still incurs infrastructure cost while active

This discourages meaningless resource spam.

---

# 87. Duplicate Connection Rule

Duplicate identical connections should either:

- Be prevented by the UI, or
- Collapse into one logical connection

Duplicate links do not increase capacity.

---

# 88. Minimum Simulation Contract

## Inputs

Each simulation tick receives:

```text
Architecture Graph
Resource States
Resource Capacities
Resource Costs
Traffic Phase
Business Request Mix
Bot Ratio
Player Actions
Current Budget
```

---

# 89. Tick Outputs

Each tick produces:

```text
Incoming Requests
Accepted Requests
Dropped Requests

App Utilization
Database Utilization

Cache Hit Ratio
Filtered Bot Traffic

Latency
Error Rate

Infrastructure Cost
Revenue
Incident Loss

Resource States
Provisioning States
```

---

# 90. Final Simulation Outputs

At scenario completion:

```text
Availability
Average Latency
Peak Latency
Error Rate

Peak App Utilization
Peak Database Utilization

Revenue
Infrastructure Cost
Incident Loss
Net Business Value

Filtered Bot Traffic

Primary Bottleneck
Contributing Causes

Architecture Score
Scenario Result
```

---

# 91. Bottleneck Attribution Rules

MVP explanation should be rule-based.

AI is not required.

Example:

```text
IF App Utilization > 100%
AND App Utilization is the highest critical utilization

THEN
Primary Cause:
Insufficient Compute Capacity
```

---

# 92. Database Bottleneck Rule

```text
IF Database Utilization > 100%
AND App Utilization < 80%

THEN
Primary Cause:
Database Bottleneck
```

---

# 93. Bot Traffic Rule

```text
IF Bot Ratio > 20%
AND no active WAF exists on the request path

THEN
Contributing Cause:
Unfiltered Bot Traffic
```

---

# 94. Overprovisioning Rule

```text
IF Availability target is met
AND Net Business Value is poor
AND average utilization is very low

THEN
Primary Issue:
Overprovisioning
```

---

# 95. Multiple Causes

A scenario may have:

- One Primary Bottleneck
- Zero or more Contributing Causes

Example:

```text
Primary:
Database Bottleneck

Contributing:
Unfiltered Bot Traffic
```

---

# 96. Architecture Score Formula

Initial MVP direction:

```text
Architecture Score =
  Reliability Score      × 0.40
+ Latency Score          × 0.20
+ Business Value Score   × 0.25
+ Security Score         × 0.15
- Failure Penalty
- Overprovisioning Penalty
```

All component scores are normalized before weighting.

Exact coefficients are balance parameters.

---

# 97. Score Principles

1. Reliability is the most important dimension.
2. Cost efficiency matters.
3. Security matters only when relevant to the scenario.
4. Failure may still produce partial score.
5. Massive overprovisioning should reduce score.
6. Same inputs produce the same score.
7. A successful architecture with negative Net Business Value should score poorly.

---

# 98. Baseline Balance Table

> **All values below are gameplay assumptions for playtesting. They are not Azure performance specifications or pricing data.**

Summary of Simulation Specification v0.2. That document takes precedence and owns formulas, timing, and acceptance results.

## App Service Instance

```text
Request Capacity:
150 req/s

Running Cost:
5 credits/min

New Resource Provisioning:
5 sec

Scale-Out Provisioning:
8 sec
```

## Azure SQL

```text
Read Capacity:
180 req/s

Write Capacity:
70 req/s

Running Cost:
12 credits/min
```

## Cache

```text
Request Capacity:
500 req/s

Hit Ratio:
80%

Running Cost:
8 credits/min

Provisioning Time:
5 sec
```

## WAF

```text
Bot Filtering:
70%

False Positive Rate:
0.5%

Running Cost:
3 credits/min

Provisioning Time:
4 sec
```

Emergency WAF settings and economic/failure rules are defined only in `SIMULATION_SPEC.md`.

---

# 99. Black Friday MVP Scenario

Target duration:

```text
3–4 minutes
```

Traffic progression:

## Phase 1

```text
100 req/s

Bot Ratio:
0%
```

## Phase 2

```text
220 req/s

Bot Ratio:
0%
```

## Phase 3

```text
300 req/s

Bot Ratio:
20%
```

## Peak

```text
500 req/s

Bot Ratio:
40%

Read-heavy workload
```

The specified scenario duration is 180 seconds; the 3–4 minute range above is a presentation/session target, not multiple full replays. Phase boundaries and exact rules are in `SIMULATION_SPEC.md`. No game implementation is implied by this specification.

---

# 100. Demo Architecture Matrix

This matrix defines the expected behavior of the MVP.

| Architecture | Expected Outcome |
|---|---|
| App → SQL | Severe bottleneck or failure |
| App ×2 → SQL | Compute improves; phase-3 SQL pressure appears, but peak App/bot loss may dominate the final result |
| App ×2 → Cache → SQL | Database pressure and latency decrease |
| WAF → App ×2 → Cache → SQL | Bot pressure decreases and NBV improves in the specified no-action comparison; peak still needs intervention |
| App ×4 → SQL versus App ×4 + Cache → SQL | Isolates SQL saturation: the first fails, the cached design survives |
| WAF → App ×3 + Cache → SQL versus App ×4 + Cache → SQL | Both meet scenario targets; protected design avoids one instance and improves NBV, with false-positive and latency trade-offs |
| Massive overprovisioning | Survives but receives weaker cost-efficiency score |

This matrix acts as both:

- Product acceptance criteria
- Simulation regression test targets

Exact initial states, action schedules, durations, and reference metrics are defined in Simulation Specification section 110. WAF does not lower fixed-instance charges automatically. Cache-path drawings include a direct App → SQL write connection. Final outcome causes must reflect measured losses; phase summaries preserve earlier learning moments.

---

# 101. MVP Acceptance Tests

Examples:

```text
Cache architecture DB load
<
No-cache architecture DB load
```

```text
Two App instances capacity
>
One App instance capacity
```

```text
WAF architecture bot load
<
No-WAF architecture bot load
```

```text
Overprovisioned architecture cost
>
Efficient architecture cost
```

These relationships are more important than matching real Azure performance values.

---

# 102. UX Feedback Requirements

Within approximately three seconds, the player should know:

1. Which resource is currently the bottleneck
2. Where requests are failing
3. Whether cost is rising
4. How much bot traffic is reaching the application
5. Whether a scale operation is still provisioning
6. How close the scenario is to failure

Accessibility requirement:

> **State must never be communicated by color alone.**

Use:

- Icon
- Text
- Numeric value
- Animation
- Color

in combination.

---

# 103. Save and Reset

MVP should support:

- Save current architecture locally
- Reset to baseline architecture
- Replay the scenario
- Clear local state

No account system is required.

---

# 104. Error Handling

The game must handle:

- Invalid architecture
- Missing required connection
- Malformed scenario data
- Unsupported resource definition
- Invalid numeric balance value

Errors must not silently corrupt simulation state.

---

# 105. Performance Targets

Initial MVP targets:

- Modern Chromium-based desktop browsers
- Smooth interaction during normal gameplay
- Target rendering near 60 FPS where possible
- Simulation correctness prioritized over visual frame rate

Exact browser compatibility belongs in the Technical Design.

---

# 106. Demo Mode

A dedicated Hackathon demo flow may shorten the Black Friday scenario to approximately three minutes.

The current baseline already lasts 180 seconds. A 3–4 minute presentation cannot include multiple full live attempts: use clearly labeled reference results/excerpts or allow a longer walkthrough. A shortened demonstration must not masquerade as a full canonical scenario result.

It must still demonstrate:

```text
Initial Architecture
      ↓
Bottleneck
      ↓
Scale-out
      ↓
Database Bottleneck
      ↓
Cache
      ↓
Bot Traffic
      ↓
WAF
      ↓
Result Comparison
```

---

# 107. Glossary

The game should eventually explain terms such as:

- RPS
- Latency
- Availability
- Utilization
- Cache Hit Ratio
- Scale Out
- Bot Traffic
- WAF
- Net Business Value

MVP may use short tooltips.

---

# 108. Hackathon Success Metrics

After playing, a test player should be able to answer:

1. What was the primary bottleneck?
2. Why did adding compute not solve the database problem?
3. What changed after adding cache?
4. What trade-off did the improved architecture introduce?
5. Would you redesign the architecture and play again?

Success target:

> **At least 4 of 5 questions answered positively/correctly.**

---

# 109. Core MVP Validation Question

The Hackathon MVP ultimately answers:

> **Can a player make a meaningful cloud architecture decision, observe its effect under traffic, understand why the outcome changed, and immediately want to redesign and try again?**

If yes, the core concept is validated.

---

# 110. Future Considerations

Explicitly Post-MVP:

- Full persistent account system
- Player Level
- Architecture Tier
- Long construction timers
- Technology tree
- Specialist system
- Specialist progression
- Region selection
- Multi-region
- AWS faction
- GCP faction
- Neutral technology packs
- Service Bus
- Azure Functions
- Container Apps
- CDN
- Storage scenarios
- Complex networking
- Leaderboards
- PvP
- Architecture competition
- Offline progression
- AI Architecture Coach
- AI Scenario Generator
- Real Azure pricing
- Real Azure environment import
- Incident replay
- Community scenario marketplace
- Certification mode
- Enterprise training mode

---

# 111. Long-Term Specialist System

Potential Specialists:

- Cloud Architect
- Support Engineer
- SRE
- FinOps Specialist
- Security Engineer

Future progression may unlock multiple Specialist slots.

Example:

```text
Early Game:
1 Specialist

Mid Game:
2 Specialists

Late Game:
3 Specialists
```

Specialists should strengthen architectural strategies, never replace them.

---

# 112. Long-Term Region System

Players may eventually:

- Choose a Home Region
- Expand to secondary regions
- Build multi-region architecture
- Experience regional outages
- Balance latency and cost

Region gameplay remains outside MVP.

---

# 113. Long-Term Competitive Play

A future competitive mode may run the same scenario against multiple player architectures.

Compare:

- Availability
- Latency
- Infrastructure Cost
- Net Business Value
- Security
- Architecture Score

The architecture competes, not combat units.

---

# 114. Potential Long-Term Use Cases

- Cloud onboarding
- Architecture education
- Developer training
- Support Engineer training
- SRE training
- DevOps education
- FinOps education
- Incident preparedness
- Certification preparation
- Enterprise cloud training
- Architecture competitions

---

# 115. Product Differentiation

Stack & Survive is not primarily:

- A cloud diagram editor
- A pricing calculator
- A certification quiz
- A traditional tower defense game
- An exact Azure performance simulator

It is:

> **A cloud architecture strategy game where better system design creates better outcomes.**

---

# 116. Product Positioning

## Primary

> **Stack & Survive is a cloud architecture strategy game where your infrastructure is your defense.**

## Main Tagline

> **Your architecture is your defense.**

## Secondary Tagline

> **Build the cloud. Survive the traffic.**

---

# 117. Final Product Principle

Whenever a new feature is proposed, ask:

> **Does this make architecture decisions more meaningful?**

If yes, it may belong in Stack & Survive.

If no, it should probably not be prioritized.

The core loop is:

```text
Architecture Decision
        ↓
Traffic
        ↓
Observable Consequence
        ↓
Understanding
        ↓
Better Architecture
```

That is the game.

---

# 118. Hackathon Scope Statement

> **Build one scenario extremely well before building the cloud.**

For the Hackathon, success is not measured by:

- Number of Azure services
- Number of scenarios
- Number of animations
- Number of AI features

Success is measured by whether the player can experience:

> **I changed the architecture, and I can clearly see why the system behaves differently now.**
