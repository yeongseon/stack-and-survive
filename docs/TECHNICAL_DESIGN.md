# Stack & Survive

## Technical Design

**Version:** 0.2  
**Status:** Hackathon Technical Architecture  
**Related Documents:** `PRD.md`, `GAMEPLAY_SPEC.md`, `SIMULATION_SPEC.md`  
**Primary Language:** TypeScript  
**Primary Platform:** Web  
**Cloud Platform:** Microsoft Azure  
**Architecture Strategy:** Web-first, Multi-platform-ready  

---

# 1. Purpose

This document defines how Stack & Survive is implemented.

Document responsibilities:

- `PRD.md`
  - What we are building and why

- `GAMEPLAY_SPEC.md`
  - What the player sees and does

- `SIMULATION_SPEC.md`
  - How gameplay results are calculated

- `TECHNICAL_DESIGN.md`
  - How the software is structured and deployed

The primary technical goal is:

> Build the Hackathon MVP quickly without coupling the simulation,
> gameplay rules, renderer, or cloud infrastructure unnecessarily.

---

# 2. Technical Principles

Stack & Survive follows these principles:

1. **Simulation is independent from rendering**
2. **Game rules are independent from the game engine**
3. **Scenario content is data-driven**
4. **TypeScript is the primary language**
5. **The Hackathon MVP does not require a backend**
6. **Azure hosts the production web experience**
7. **The architecture is multi-platform-ready**
8. **The simulation must run headlessly**
9. **The same simulation must produce the same result on every client**
10. **Infrastructure complexity must not distract from validating the game**

---

# 3. Primary Language

Stack & Survive uses:

> **TypeScript**

for the entire Hackathon application.

TypeScript is used for:

- Cloud domain model
- Architecture graph
- Simulation engine
- Scenario engine
- Game logic
- Game-engine integration
- React UI
- State management
- Persistence
- Automated tests

The MVP should not introduce Python, C#, Java, or another application language unless a clear technical requirement appears.

---

# 4. High-Level Architecture

```text
                   ┌───────────────────────┐
                   │      Scenario Data    │
                   │         JSON          │
                   └───────────┬───────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │     Cloud Domain      │
                   │      TypeScript       │
                   └───────────┬───────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │   Simulation Engine   │
                   │    Pure TypeScript    │
                   └───────────┬───────────┘
                               │
                    SimulationSnapshot
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │   Game Renderer  │      │     React UI     │
        │ Phaser/PlayCanvas│      │ HUD / Menus      │
        └──────────────────┘      └──────────────────┘
                  │                         │
                  └────────────┬────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Browser Game App │
                    └──────────────────┘
```

---

# 5. Critical Separation

The renderer must not calculate gameplay results.

Incorrect:

```text
Game Engine

if SQL is overloaded:
    calculate dropped requests
```

Correct:

```text
Simulation Engine

SQL Utilization = 137%
Dropped Requests = 42

        ↓

Simulation Snapshot

        ↓

Game Renderer

Show:
- SQL overload animation
- Warning icon
- Failed traffic particles
```

The renderer visualizes simulation state.

It does not determine simulation state.

---

# 6. Core Packages

Recommended repository structure:

```text
stack-and-survive/

apps/
  web/

packages/
  schema/
  cloud-domain/
  simulation/
  scenarios/
  game-core/
  game-renderer/
  ui/

infra/

docs/

tests/
```

---

# 7. `packages/schema`

Contains shared TypeScript schemas.

Examples:

```text
Architecture
Resource
Connection
Scenario
TrafficPhase
PlayerAction
SimulationSnapshot
SimulationResult
```

This package contains no rendering logic.

---

# 8. `packages/cloud-domain`

Contains provider and architecture knowledge.

Examples:

```text
Resource Types

App Service
Azure SQL
Azure Managed Redis
Protected Edge

Connection Rules

Internet → Edge
Edge → App
App → Cache
App → SQL
Cache → SQL
```

It also defines:

- Resource capabilities
- Valid connections
- Request eligibility
- Provider metadata
- Architecture validation

---

# 9. Provider-Neutral Domain

Where reasonable, core concepts should remain provider-neutral.

Example:

```text
ManagedCompute
RelationalDatabase
Cache
ProtectedIngress
```

Azure mapping:

```text
ManagedCompute
→ Azure App Service

RelationalDatabase
→ Azure SQL

Cache
→ Azure Managed Redis

ProtectedIngress
→ Application Gateway / WAF abstraction
```

This allows future providers without changing the simulation architecture.

Azure remains the only implemented provider in MVP.

---

# 10. `packages/simulation`

This is the most important package.

It contains the deterministic simulation engine.

Responsibilities:

- Traffic generation
- Request classification
- Request routing
- WAF filtering
- Rate limiting
- App Service capacity
- Cache processing
- SQL capacity
- Latency
- Availability
- Revenue
- Cost
- Failure
- Attribution
- Architecture Score

It must not import:

- React
- Game engine APIs
- Browser DOM APIs
- Canvas APIs

---

# 11. Simulation API

Conceptually:

```ts
simulateTick(
  state,
  scenario,
  architecture,
  actions
): { nextState: SimulationState; snapshot: SimulationSnapshot }
```

Full scenario:

```ts
simulateScenario(
  architecture,
  scenario,
  actions
): SimulationResult
```

The simulation must also work from automated tests without launching the game.

These signatures are conceptual, not runnable TypeScript. `SimulationState` owns pending events, counters, action outcomes, and accumulators required for the next tick; snapshots are read-only projections. Implement timing, validation, and numerical comparisons exactly as specified in `SIMULATION_SPEC.md` sections 6, 12, 40, and 119–122.

---

# 12. Headless Requirement

This must be possible:

```text
Node / Test Runner

Architecture
+
Black Friday Scenario
+
Player Actions

       ↓

Simulation Engine

       ↓

Final Result
```

No browser or renderer should be required.

This enables:

- Regression testing
- Game balancing
- Scenario testing
- Future AI analysis
- Replay verification

---

# 13. `packages/scenarios`

Contains scenario definitions.

Example:

```text
scenarios/
  black-friday.json
```

Scenario files define:

```text
Traffic phases
Business mix
Bot ratio
Budget
Targets
Failure rules
Optional briefing metadata
```

Scenario content must not require modifying simulation code.

---

# 14. Scenario Schema

Example:

```json
{
  "id": "black-friday",
  "duration": 180,
  "businessMix": {
    "browse": 0.8,
    "order": 0.2
  },
  "traffic": [
    {
      "start": 0,
      "end": 30,
      "rps": 100,
      "botRatio": 0
    }
  ]
}
```

JSON is recommended for MVP.

YAML support is not required.

---

# 15. `packages/game-core`

Contains player-facing game orchestration that is not renderer-specific.

Examples:

```text
Game Phase

PREPARATION
RUNNING
PAUSED
COMPLETED
FAILED

Player Actions

BUILD
CONNECT
REMOVE
START_TRAFFIC
PAUSE
SCALE_OUT
RATE_LIMIT
EMERGENCY_WAF
```

It coordinates:

```text
UI
↓
Player Action
↓
Simulation
↓
Simulation Snapshot
```

---

# 16. Game Engine Boundary

The game engine is responsible for:

- Scene rendering
- Camera
- Building sprites/models
- Selection
- Placement feedback
- Traffic particles
- Connection visualization
- Provisioning animation
- Overload animation
- Visual effects

The game engine is NOT responsible for:

- Traffic calculations
- Capacity calculations
- Cache hit calculation
- Cost
- Revenue
- Failure
- Score
- Root cause attribution

---

# 17. Game Engine Decision

The Hackathon renderer is Phaser 3.90.0, accepted by the project owner after the comparative spike. ADR-002 records the evidence and limitations. The evaluation criteria below remain the historical selection rationale.

Final candidates:

```text
PlayCanvas
Phaser
```

Unity and Godot are not currently preferred for MVP because they would introduce a second primary language/runtime and higher integration overhead for the Web-first TypeScript architecture.

---

# 18. Engine Evaluation Criteria

The technical spike should evaluate:

| Requirement | Priority |
|---|---|
| TypeScript integration | Critical |
| Fixed 2D / 2.5D architecture map | Critical |
| Building placement | Critical |
| Pan / Zoom | Critical |
| Traffic particles | Critical |
| Connection visualization | Critical |
| Touch support | High |
| React integration | High |
| Performance | High |
| Mobile Web | High |
| Learning curve | Critical |
| OSS ecosystem | High |
| Hackathon implementation speed | Critical |

---

# 19. Engine Spike

Before locking the renderer:

Build the same minimal scene in both candidates.

Required spike scene:

```text
Internet
   ↓
App Service
   ↓
Azure SQL
```

Required functionality:

- Fixed isometric or equivalent view
- Select App Service
- Drag building
- Pan
- Zoom
- Draw connection
- Render traffic particles
- Change SQL visual state to overloaded
- Display 100+ moving representative packets

Timebox:

> Approximately half a day to one day.

The goal is not to build the game twice.

The goal is to discover which engine feels easier for this game.

---

# 20. Engine Decision Rule

Prefer **Phaser** if:

- Final visual direction is primarily 2D
- Sprite-based isometric rendering is sufficient
- Simplicity and implementation speed dominate

Prefer **PlayCanvas** if:

- True 3D transforms improve the 2.5D base
- Camera depth becomes important
- 3D buildings / effects materially improve the experience
- Future graphical expansion justifies the additional complexity

The simulation architecture remains identical either way.

---

# 21. Renderer Interface

The game should expose renderer-independent operations.

Conceptually:

```ts
interface GameRenderer {
  loadArchitecture(model): void;

  updateSimulation(snapshot): void;

  showPlacementPreview(resource): void;

  highlightResource(id, state): void;

  animateTraffic(flow): void;

  destroy(): void;
}
```

The production Phaser adapter implements this interface. PlayCanvas remains isolated to the comparison experiment.

---

# 22. React Responsibility

React is responsible for application UI rather than the world renderer.

React components include:

- HUD
- Build Palette
- Resource Detail
- Scenario Briefing
- Action Buttons
- Warning overlays
- Pause Menu
- Result Screen
- Replay Comparison
- Settings
- Help / Glossary

---

# 23. React / Game Renderer Layout

Conceptually:

```text
React Application

┌──────────────────────────────────────┐
│               HUD                    │
├──────────┬────────────────┬──────────┤
│ Build UI │                │ Resource │
│          │ GAME RENDERER  │ Detail   │
│          │                │          │
├──────────┴────────────────┴──────────┤
│ Live Actions                         │
└──────────────────────────────────────┘
```

The renderer owns the game world.

Here "owns" means the visual representation only. Game-core owns phase/action orchestration, cloud-domain owns graph validation, and simulation owns runtime truth. Zustand stores/provides these states to consumers; it must not become a second independent source of simulation calculations.

React owns surrounding interface elements.

---

# 24. State Management

Recommended application state management:

> **Zustand**

State categories should remain separated.

```text
Architecture State
Simulation State
Game UI State
Persistence State
```

---

# 25. Architecture State

Contains persistent design information.

Examples:

```text
Resources
Connections
Positions
Instance configuration
```

This state survives scenario replay.

Save completed instance counts, not requested-but-unfinished capacity. Runtime scale-out completion is explicitly committed to the architecture configuration by game-core. Keep the original initial architecture and versioned action log separately for diagnostic replay; never replay old actions against an already scaled final architecture.

---

# 26. Simulation State

Contains temporary runtime information.

Examples:

```text
Current time
Traffic
Utilization
Latency
Budget
Revenue
Failures
Provisioning
```

This state resets on replay.

On Redesign & Retry, cancel unfinished runtime scale-outs while retaining completed instances. Game-core maintains preparation deployment timers on a separate stepped preparation clock, with no scenario time or costs. New-resource pending status can be saved, but reload restarts its full preparation delay. The local save does not resume runtime timers or scenarios. This follows Simulation Specification section 8.

---

# 27. UI State

Contains:

```text
Selected Resource
Open Panel
Camera-related UI state
Build Mode
Tooltip
Modal
```

UI state must not affect simulation correctness.

---

# 28. Rendering Update Model

Simulation:

```text
1 Hz authoritative tick
```

Rendering:

```text
up to 60 FPS
```

The renderer interpolates visual movement between snapshots where appropriate.

Example:

```text
Simulation
t=10 ---------------- t=11

Renderer
60 visual frames between states
```

---

# 29. Traffic Particle Model

Do not create one game object per simulated request.

For:

```text
500 requests/sec
```

the renderer may show:

```text
10–30 representative particles
```

Visual density represents traffic volume.

Simulation traffic remains aggregate.

---

# 30. Asset Strategy

MVP should use lightweight custom assets.

Recommended:

- Simple buildings
- Icon-driven service identity
- Low-poly or stylized isometric assets
- Azure-inspired visual vocabulary

Avoid:

- Heavy realistic models
- Large texture packs
- Complex character animation

The architecture should remain readable.

---

# 31. Azure Branding

Azure service representation should follow applicable Microsoft brand and service-icon guidance.

Public OSS release should review:

- Azure trademark use
- Microsoft logos
- Azure service icons
- Hackathon asset policies

Game-owned visual assets should remain distinguishable from official Microsoft UI.

---

# 32. Platform Strategy

Stack & Survive follows:

> **Web-first, multi-platform-ready.**

The Hackathon implements one client:

```text
Desktop Web
```

The architecture must not prevent:

```text
Tablet
Mobile Web
PWA
iOS
Android
```

---

# 33. MVP Platform

P0:

```text
Desktop Web

Modern Chromium-based browser
Mouse interaction
Responsive shell
```

Target demo resolutions may include:

```text
1920×1080
1440×900
```

---

# 34. Mobile Strategy

Mobile is not part of Hackathon acceptance criteria.

However:

- Touch must not be structurally impossible
- UI must avoid mouse-hover-only critical interactions
- Game world should support different viewport sizes
- Panels should support future adaptive layouts

---

# 35. Adaptive UI

Desktop:

```text
Build Palette | Game World | Resource Detail
```

Mobile:

```text
Game World

     ↓

Bottom Sheet

Build / Resource / Actions
```

Mobile should not simply shrink the desktop layout.

---

# 36. PWA Strategy

Post-MVP, the Web application may become a Progressive Web App.

Potential features:

- Home screen installation
- Offline application shell
- Cached static assets
- Local architecture persistence

The Simulation Engine does not change.

---

# 37. Native Application Strategy

Future native distribution may use:

```text
Web Application
      ↓
Capacitor
      ↓
iOS / Android
```

before considering a dedicated native renderer.

A future React Native or other client must reuse the same conceptual:

```text
Domain
Scenario
Simulation
```

contracts.

---

# 38. Platform Principle

> **Build one game, not three clients.**

Design the core so that a second client is possible later.

---

# 39. MVP Backend Strategy

The Hackathon MVP should have:

> **No mandatory application backend.**

The following run entirely in the browser:

- Architecture editing
- Simulation
- Scenario execution
- Scoring
- Replay
- Local save

Benefits:

- Lower complexity
- Faster iteration
- Lower Azure cost
- Easier debugging
- Offline-capable simulation
- Deterministic execution

---

# 40. Azure Hosting Architecture — MVP

Recommended:

```text
GitHub Repository
       ↓
GitHub Actions
       ↓
Azure Static Web Apps
       ↓
Browser
       ↓
Stack & Survive
```

No traditional web server is required.

---

# 41. Why Azure Static Web Apps

The application is fundamentally:

```text
HTML
CSS
JavaScript
Game Assets
Scenario JSON
```

plus browser-executed simulation.

Therefore a continuously running application server adds little MVP value.

Azure Static Web Apps is the preferred hosting target for the Web-first MVP.

---

# 42. MVP Azure Architecture

```text
                    GitHub
                      │
                Push / Pull Request
                      │
                      ▼
             GitHub Actions CI/CD
                      │
                      ▼
          ┌────────────────────────┐
          │ Azure Static Web Apps  │
          └────────────┬───────────┘
                       │
                       ▼
                  Web Browser
                       │
          ┌────────────┴─────────────┐
          │                          │
     React / UI                Game Renderer
          │                          │
          └────────────┬─────────────┘
                       │
                 Game Core
                       │
                 Simulation
```

---

# 43. No MVP Web Server

Do not add the following merely to host the game:

```text
Virtual Machine
IIS
Nginx server
Azure App Service backend
AKS
Container App
```

unless a concrete server-side requirement appears.

> **Using more Azure services does not make the architecture more Azure-native.**

Use the simplest Azure service that matches the workload.

---

# 44. Local Persistence

MVP architecture state is saved locally.

Storage abstraction:

```ts
interface GameSaveRepository {
  saveArchitecture(model): Promise<void>;
  loadArchitecture(): Promise<Architecture | null>;
  clear(): Promise<void>;
}
```

Initial adapter:

```text
Browser Local Storage
```

The game must not allow application logic to depend directly on `localStorage`.

This makes cloud persistence replaceable later.

---

# 45. Persistence Evolution

MVP:

```text
Local Storage
```

Future:

```text
Account
   ↓
API
   ↓
Cloud Persistence
```

Possible Azure implementation:

```text
Microsoft Entra identity
        ↓
Azure API
        ↓
Cosmos DB
```

This is Post-MVP.

---

# 46. Future Backend

Server-side functionality becomes useful for:

- User accounts
- Cross-device save
- Leaderboards
- Multiplayer
- Shared scenarios
- Cloud architecture library
- Anti-cheat
- AI Architecture Coach
- Community content

---

# 47. Future API Hosting

Two likely Azure options:

## Azure Functions

Prefer when:

- API is small
- Event-driven actions dominate
- Serverless simplicity is useful

## Azure Container Apps

Prefer when:

- API becomes substantial
- Containerized services are useful
- Background processing is required
- More control over application runtime is needed

Do not choose either until server requirements exist.

---

# 48. Future Cloud Architecture

Conceptually:

```text
                 Client
                   │
          Azure Static Web Apps
                   │
                   ▼
                API
          ┌────────┴────────┐
          │                 │
 Azure Functions      Container Apps
          │                 │
          └────────┬────────┘
                   │
                Data
                   │
               Cosmos DB
```

Not all components should necessarily be deployed together.

---

# 49. Observability

Application observability should eventually include:

- Client errors
- Page load failures
- Scenario starts
- Scenario completions
- Scenario failures
- Replay rate
- Architecture strategies
- Simulation exceptions

Azure Monitor / Application Insights may be used for product telemetry.

---

# 50. Gameplay Telemetry

Useful events:

```text
game_started

scenario_started

resource_added

scale_out

cache_added

waf_added

scenario_failed

scenario_completed

result_viewed

replay_started
```

Do not send the one-second simulation tick stream as product telemetry by default.

Aggregate meaningful player events.

---

# 51. Privacy Principle

Telemetry should collect product usage rather than unnecessary personal information.

Open-source development should make telemetry behavior transparent.

If external release occurs, telemetry should have appropriate disclosure and consent behavior.

---

# 52. Infrastructure as Code

Azure infrastructure should be reproducible.

Recommended:

> **Bicep**

MVP infrastructure may include only:

```text
Azure Static Web Apps
Optional monitoring resources
```

Do not create unnecessary Azure resources purely for architectural appearance.

---

# 53. CI Pipeline

Pull Request pipeline:

```text
Install
↓
Lint
↓
Type Check
↓
Unit Tests
↓
Simulation Regression Tests
↓
Build
```

Optional:

```text
Preview Deployment
```

---

# 54. Main Branch Pipeline

```text
Merge to main
       ↓
Quality Checks
       ↓
Production Build
       ↓
Deploy
       ↓
Azure Static Web Apps
```

---

# 55. Testing Strategy

Tests are critical because the game is based on architectural consequences.

Testing layers:

```text
Unit Tests
      ↓
Simulation Tests
      ↓
Architecture Validation Tests
      ↓
Scenario Regression Tests
      ↓
UI Component Tests
      ↓
Minimal End-to-End Tests
```

---

# 56. Simulation Unit Tests

Examples:

```text
Scale-out increases App capacity

Cache reduces eligible SQL reads

Cache does not reduce writes

Disconnected WAF does not filter bots

Rate Limit reduces legitimate traffic

SQL capacity does not increase when App scales
```

---

# 57. Scenario Regression Tests

Black Friday should have known architecture outcomes.

Example:

```text
Baseline
→ poor outcome

Scale-out only
→ DB bottleneck

Scale-out + Cache
→ improved DB load

WAF + Scale-out + Cache
→ improved bot handling

Massive architecture
→ survives at higher cost
```

These tests protect the actual game design.

---

# 58. Golden Simulation Tests

For important architecture/scenario combinations, store expected final metrics within accepted tolerance.

Example:

```text
Architecture:
App ×2 + Cache

Scenario:
Black Friday

Expected:
SQL Read Peak within defined range
Availability within defined range
Result = known state
```

Any significant change requires intentional balance approval.

---

# 59. Engine Tests

Do not test simulation behavior through the renderer.

Renderer tests should check:

- Object exists
- Correct state displayed
- Overload effect triggered
- Connection rendered
- Selection works

Simulation tests own gameplay correctness.

---

# 60. Performance Budget

Initial targets:

```text
Game Rendering:
Target ~60 FPS

Simulation:
Negligible compared to rendering workload

Representative Traffic Particles:
Prefer hundreds or fewer,
not thousands of request entities
```

Performance should be tested on typical laptop hardware.

---

# 61. Mobile Performance

Future mobile support requires:

- Adaptive particle count
- Lightweight assets
- Texture size limits
- Reduced optional effects
- Touch-friendly controls

Simulation behavior must remain identical when visual quality is reduced.

---

# 62. Save Versioning

Persisted architecture should include a schema version.

Example:

```json
{
  "version": 1,
  "architecture": {}
}
```

This permits future save migrations.

The payload contains architecture, completed instance counts, placement, connections, and new-resource deployment status. It excludes runtime metrics, pending runtime actions, emergency usage, and the current tick. Validate on load; malformed/unsupported saves must produce a recoverable error and a reset option, never silently grant capacity. Previous-attempt comparison can remain session-local.

---

# 63. Scenario Versioning

Scenario data should also contain a version.

Example:

```json
{
  "schemaVersion": 1,
  "id": "black-friday"
}
```

Scenario changes should be detectable by regression tests.

Record a `balanceVersion` as well as `schemaVersion`; unchanged JSON shape does not mean unchanged game rules. Diagnostic replay requires the original initial architecture, immutable scenario/balance version, and tick/sequence action log. It is distinct from player-facing Redesign & Retry.

---

# 64. Error Boundaries

Failure in one presentation layer must not corrupt simulation state.

Examples:

- React UI exception
- Missing game asset
- Invalid animation
- Renderer particle failure

Simulation and persisted architecture should remain recoverable where possible.

On renderer failure, pause orchestration at a tick boundary. Recreate visual state from the authoritative architecture plus latest snapshot; do not advance counters during recovery or require renderer-local gameplay state. If recovery fails, return to preparation with saved architecture rather than mutating the simulation to match damaged visuals.

---

# 65. Invalid Scenario Handling

Scenario loading must validate:

- Required fields
- Business mix totals
- Positive durations
- Valid traffic phases
- Supported request types
- Valid failure rules

Invalid content fails early.

Example:

```text
Scenario could not be loaded.

Invalid businessMix:
Total must equal 1.0.
```

---

# 66. Development Mode

A development/debug mode should help balance the game.

Possible tools:

```text
Current tick
Current RPS
App utilization
SQL utilization
Cache calculations
WAF calculations
Revenue
Cost
Current outcome attribution
```

This should not be exposed as the normal player UI.

---

# 67. Simulation Inspector

A simple developer inspector is highly valuable.

Illustrative display, normal WAF + two App instances + Cache, no actions, tick 87 (balance v0.2):

```text
TICK 87

Incoming        300
Bots Offered     60
Bots Passed      18
WAF False Pos.    1.2
App Load        256.8
App Capacity    300

Browse          191.04
Cache Hits      152.832
SQL Reads       38.208
SQL Writes      47.76

Current Pressure:
App Service (85.6%, warning)
```

This will make balance bugs much easier to diagnose.

---

# 68. Open Source Architecture

The repository should be understandable to external contributors.

Important boundaries:

```text
Simulation Core
Provider Definitions
Scenario Content
Renderer
UI
Infrastructure
```

should be clearly documented.

---

# 69. Contribution Model

Future contributors should be able to create:

```text
New Scenario
```

without modifying:

```text
Core Simulation Engine
```

where possible.

Long-term:

```text
New Provider
New Resource
New Scenario
New Visual Skin
```

may also become extensibility points.

---

# 70. Security

MVP has no server-side secrets.

Client code must never include:

- Private keys
- Azure credentials
- Internal endpoints
- Microsoft confidential information
- Support telemetry
- Internal Azure platform data

Scenario balance data is public game content.

---

# 71. OSS / Microsoft Boundary

The open-source project must not depend on:

- Internal Microsoft systems
- Internal Kusto clusters
- Customer case information
- Proprietary performance measurements
- Confidential Azure implementation details

Azure behavior included in the game must be based on public concepts or original abstracted game models.

---

# 72. Development Environment

Recommended:

```text
Node.js
TypeScript
pnpm
Vite
React
Zustand
Vitest
```

Game engine:

```text
Phaser 3.90.0 (accepted in ADR-002)
```

---

# 73. Suggested Monorepo

Recommended:

```text
stack-and-survive/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── schema/
│   ├── cloud-domain/
│   ├── simulation/
│   ├── scenarios/
│   ├── game-core/
│   ├── game-renderer/
│   └── ui/
│
├── tests/
│   ├── simulation/
│   ├── scenarios/
│   └── e2e/
│
├── infra/
│   └── bicep/
│
├── docs/
│   ├── PRD.md
│   ├── GAMEPLAY_SPEC.md
│   ├── SIMULATION_SPEC.md
│   ├── TECHNICAL_DESIGN.md
│   └── adr/
│
└── README.md
```

---

# 74. Architecture Decision Records

Important technical choices should be recorded as ADRs.

Initial ADR candidates:

```text
ADR-001
Why TypeScript

ADR-002
Game Engine: Phaser vs PlayCanvas

ADR-003
Simulation / Renderer Separation

ADR-004
Azure Static Web Apps Hosting

ADR-005
Browser-first Simulation

ADR-006
Local-first Persistence

ADR-007
Scenario JSON Format
```

---

# 75. Hackathon Architecture Lock

For the Hackathon, lock the following:

```text
Language
TypeScript

UI
React

Simulation
Pure TypeScript

State
Zustand

Scenario
JSON

Backend
None

Hosting
Azure Static Web Apps

Persistence
Local-first

Cloud
Azure

Game Engine
Phaser 3.90.0
```

Do not change these unless a blocking technical issue appears.

---

# 76. Hackathon Technical Priorities

Order of implementation:

```text
1. Simulation Engine

2. Black Friday Regression Tests

3. Basic Game Renderer

4. Architecture Placement

5. Connections

6. Traffic Visualization

7. HUD

8. Live Actions

9. Result / Replay Comparison

10. Visual Polish

11. Azure Deployment
```

The cloud deployment should not be allowed to delay proving the game loop.

---

# 77. Platform Evolution

Phase 1:

```text
Desktop Web
```

Phase 2:

```text
Adaptive Web
Tablet
Mobile Web
```

Phase 3:

```text
PWA
```

Phase 4:

```text
iOS / Android packaging
```

Phase 5, only if justified:

```text
Dedicated native client
```

---

# 78. Future Server Evolution

When server functionality becomes necessary:

```text
Static Web App
       │
       ▼
API Layer
       │
       ├── Account
       ├── Cloud Saves
       ├── Leaderboard
       ├── Shared Scenarios
       └── AI Coach
```

Do not introduce this architecture before the features require it.

---

# 79. Final Technical Principle

> **Use the game engine for the game experience.**

> **Use the simulation engine for the game truth.**

> **Use Azure for the infrastructure the product actually needs.**

Do not add technical complexity simply because the game is about cloud architecture.

The Hackathon architecture should remain:

```text
Simple
Deterministic
Testable
Web-first
Azure-hosted
Renderer-independent
Multi-platform-ready
```

The most important technical question is:

> **Can we change the architecture, run the exact same scenario,
> and prove through deterministic simulation that the result changed for the right reason?**

If yes, the technical architecture is doing its job.
