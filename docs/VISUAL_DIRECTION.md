# Stack & Survive

## Visual Direction

**Version:** 0.3  
**Status:** Hackathon Visual Direction  
**Related Documents:** `PRD.md`, `GAMEPLAY_SPEC.md`, `SIMULATION_SPEC.md`, `TECHNICAL_DESIGN.md`  
**Primary Context:** Microsoft Internal Hackathon  
**Primary Goal:** Make Stack & Survive recognizable as a data-center tycoon where growing workload moves through Azure infrastructure.

---

# 1. Visual Vision

Stack & Survive should look like:

> **A polished isometric data-center tycoon where Azure infrastructure behaves like a living production system and traffic behaves like visible workload moving through processing lanes.**

The player should immediately understand:

- This is a game.
- This is about Azure architecture.
- Azure services are real recognizable services.
- The buildings, environment, traffic, and effects belong to Stack & Survive.
- Architecture decisions visibly change system behavior.

The visual layer must not resemble only:

- an Azure Portal page,
- an architecture diagram,
- a monitoring dashboard,
- or a generic sci-fi game.

It should combine Azure identity with an original game presentation.

Version 0.3 supersedes the earlier outpost/defense presentation. The owner's indoor-data-center reference image is the composition target: raised floor tiles, racks/cooling/cable trays, larger interactive facilities, broad processing lanes, compact top HUD and bottom construction controls. Data Center Environment and representative Visual Queue are P0. Detailed sequence and constraints are in `TYCOON_REFRAME_IMPLEMENTATION_PLAN.md`.

The default world should occupy approximately 75–85% of desktop gameplay composition; information appears on demand in Insights / Events / Why. Preserve responsive fit, focus, non-color cues and reduced motion. Never label pressure markers as measured waiting requests or imply dropped work is buffered. The simulation remains unchanged.

---

# 2. Core Visual Principle

The primary rule is:

> **Official Azure icons identify the service. Custom game assets create the game world.**

These responsibilities must remain separate.

```text
Official Azure Icon
        +
Custom Building Asset
        +
Custom State Overlay
        +
Custom VFX
        +
Service Name
        ↓
Recognizable Azure Game Resource
```

Example:

```text
      [Official App Service Icon]

              ↓

       ┌───────────────┐
       │               │
       │  CUSTOM APP   │
       │   BUILDING    │
       │               │
       └───────────────┘

          App Service
              ×3
```

The official icon communicates:

> "This represents Azure App Service."

The custom building communicates:

> "This is a resource inside the Stack & Survive game world."

---

# 3. Why This Approach

Using only custom fictional buildings would make the game feel more generic.

Using only official Azure icons would make the experience feel more like an architecture editor or technical diagram.

Combining both provides:

```text
Azure Recognition
       +
Game Identity
       +
Architecture Readability
```

This is especially valuable for the internal Hackathon demo.

---

# 4. Azure Icon Usage Principle

Official Azure icons may be used as service-identification elements.

Examples:

- Build palette
- Resource selector
- Resource detail panel
- Small badge above or beside a building
- Tooltip
- Architecture information panel
- Result screen resource reference

The official icon should remain visually distinct from the custom game artwork.

---

# 5. Do Not Transform Official Icons

Official Azure icons must remain unchanged.

Do not:

- reshape them,
- crop them into new symbols,
- rotate them,
- distort them,
- redraw them,
- recolor them,
- merge multiple icons into a new logo,
- convert them into the physical shape of a building,
- or use them as the Stack & Survive product logo.

The custom game artwork must be created around the icon rather than by modifying it.

---

# 6. Asset Composition Model

Every deployable resource should be composed from multiple visual layers.

```text
Layer 1
Custom building

Layer 2
Official Azure service icon

Layer 3
Resource name

Layer 4
Gameplay state

Layer 5
Dynamic VFX
```

Example:

```text
        App Service Icon
              │
              ▼
       ╭────────────╮
       │ APP TOWER  │
       │            │
       ╰────────────╯
         App Service
             ×2

        HEALTHY / 64%
```

During normal gameplay, the label and state should remain compact.

Detailed metrics appear only when selected.

---

# 7. Brand Separation

Stack & Survive must have its own visual identity.

## Stack & Survive owns

- Product logo
- Game logo
- Game buildings
- Environment
- Map
- Traffic visuals
- Effects
- HUD structure
- Status effects
- Animation
- Scenario presentation
- Game typography
- Game-specific symbols

## Azure provides service identity

- Azure service names
- Official Azure service icons
- Azure terminology where appropriate

This separation must remain clear.

---

# 8. Product Logo

The Stack & Survive product logo must be original.

Do not build the product logo from Azure service icons.

Possible original motifs:

- stacked infrastructure blocks,
- shield,
- infrastructure facility,
- traffic path,
- architecture nodes,
- processing layers,
- stylized "S",
- modular grid.

Possible concept:

```text
Architecture Blocks
       +
Shield
       +
Traffic Flow
       =
Stack & Survive
```

Azure identity should come from the game content rather than from copying Azure branding into the product logo.

---

# 9. Main Screen Composition

The target Hackathon experience should follow a game-oriented layout.

```text
┌──────────────────────────────────────────────────────────────┐
│ STACK & SURVIVE   Credits   Traffic   Availability   Latency │
├──────────────┬───────────────────────────────────┬───────────┤
│              │                                   │           │
│ BUILD        │                                   │ OBJECTIVE │
│              │                                   │           │
│ Azure        │                                   │ EVENTS    │
│              │          GAME WORLD               │           │
│ Compute      │                                   │ TRAFFIC   │
│ Data         │                                   │           │
│ Security     │                                   │ MINI MAP  │
│              │                                   │           │
├──────────────┴───────────────────────────────────┴───────────┤
│ SELECTED RESOURCE / LIVE ACTIONS / RESOURCE DETAILS          │
└──────────────────────────────────────────────────────────────┘
```

The map must remain the dominant visual element.

Target:

```text
Game World:
approximately 75–85%

HUD and panels:
approximately 15–25%
```

---

# 10. Build Palette

The Build palette is one of the best places to use official Azure icons.

Example:

```text
BUILD

Azure

COMPUTE
[official icon]
App Service

DATA
[official icon]
Azure SQL

[official icon]
Azure Managed Redis

SECURITY
[official icon]
Protected Edge
```

For the MVP, show only resources that can actually be deployed.

Do not populate the catalog with unavailable services purely for visual richness.

---

# 11. MVP Resource Set

The Hackathon MVP should visually focus on four deployable resources.

```text
Azure App Service

Azure SQL

Azure Managed Redis

Protected Edge / WAF
```

Supporting object:

```text
Internet / External Traffic Source
```

Future resources must not appear as active Build choices until they are implemented.

---

# 12. App Service Visual Design

## Azure Identity

Use the official Azure App Service icon unchanged.

Possible locations:

```text
Building badge

Build palette

Selected-resource panel
```

## Custom Game Asset

Visual concept:

> **Application Processing Hub**

Characteristics:

- modular processing facility,
- visible processing core,
- expandable instance modules,
- clean Azure-inspired lighting,
- medium height,
- recognizable compute silhouette.

Example:

```text
      [App Service Icon]

        ┌───────┐
     ┌──┤ CORE  ├──┐
     │  └───────┘  │
     │ COMPUTE HUB │
     └─────────────┘

       App Service
           ×3
```

---

# 13. App Service Scale-Out

Scale-out must be visually dramatic.

Sequence:

```text
Current:
App Service ×1

Player:
Scale Out

        ↓

Ghost instance module appears

        ↓

Provisioning animation

        ↓

Module becomes active

        ↓

App Service ×2

        ↓

Traffic distributes

        ↓

Utilization decreases
```

The Azure icon does not change.

Only the custom building representation changes.

---

# 14. Azure SQL Visual Design

## Azure Identity

Use the official Azure SQL service icon unchanged.

## Custom Game Asset

Visual concept:

> **Data Vault**

Characteristics:

- heavy structure,
- cylindrical or layered storage form,
- reinforced base,
- animated data core,
- visually more stable than App Service.

Example:

```text
          [SQL Icon]

           ╭──────╮
          ╱  DATA  ╲
         │  CORE    │
         │==========│
         │==========│
          ╲________╱

           Azure SQL
```

---

# 15. SQL Pressure Visuals

Healthy:

```text
Calm blue data pulse
```

Warning:

```text
Amber data-ring acceleration
```

Overloaded:

```text
Red data pulse
Error sparks
Warning ring
Dropped requests near SQL
```

The player should immediately understand:

> The application is still running, but the database is now the bottleneck.

---

# 16. Azure Managed Redis Visual Design

## Azure Identity

Use the official Azure Managed Redis icon unchanged.

## Custom Game Asset

Visual concept:

> **High-Speed Cache Node**

Characteristics:

- smaller footprint,
- compact accelerator module,
- fast cyan energy pulse,
- visible memory-cell elements.

Example:

```text
       [Redis Icon]

         ◇ ◇ ◇
       ┌───────┐
       │ CACHE │
       └───────┘

    Azure Managed Redis
```

---

# 17. Cache-Hit Animation

Cache behavior must be visible.

Hit:

```text
Browse Request
      ↓
    Cache
      ✦
   request ends
```

Miss:

```text
Browse Request
      ↓
    Cache
      ↓
     SQL
```

Possible hit effect:

- short cyan flash,
- small sparkle,
- absorption ring,
- packet disappears.

This should visually explain why SQL traffic decreases.

---

# 18. Protected Edge / WAF Visual Design

The MVP uses a game abstraction representing protected ingress behavior.

## Azure Identity

Where appropriate, use the relevant official Azure service icon unchanged in UI and supporting resource identification.

The game resource itself remains labeled:

> **Protected Edge**

with explanatory Azure context where needed.

## Custom Game Asset

Visual concept:

> **Security Gateway**

Characteristics:

- digital ingress gateway,
- filtering field,
- checkpoint modules,
- perimeter checkpoint.

Example:

```text
        [Azure Service Icon]

          ╭─────────╮
      ────│ SHIELD  │────
          ╰─────────╯

          Protected Edge
```

---

# 19. Bot Blocking

Bot traffic must visibly collide with the Protected Edge.

Sequence:

```text
Bot packet
     ↓

Protected Edge

     ↓

Filter pulse

     ↓

Blocked marker / packet terminates
```

Normal mode:

- moderate filtering pulse.

Emergency WAF mode:

- brighter filter indicator,
- stronger checkpoint status cue,
- stronger block animation,
- more visible bot interception.

---

# 20. Internet Source

Internet does not need an Azure product icon.

It should be a custom environmental object.

Possible concepts:

- cloud portal,
- external traffic gateway,
- network uplink,
- edge-of-map traffic entry point.

Example:

```text
       CLOUD / INTERNET
              ↓
       Incoming Traffic
              ↓
        Protected Edge
```

---

# 21. Traffic Visual Language

Traffic must remain entirely custom game artwork.

Do not use Azure icons for requests.

## Browse

```text
Shape:
circle

Color:
cyan / blue

Meaning:
normal customer read traffic
```

## Order

```text
Shape:
diamond or square

Color:
gold / bright accent

Meaning:
business-critical write traffic
```

## Bot

```text
Shape:
triangle / sharp packet

Color:
orange-red

Meaning:
unwanted automated traffic
```

## Failed

```text
Shape:
broken packet / X / fragment

Color:
red
```

---

# 22. Traffic Density

Traffic visuals are representative.

Do not render every simulated request.

Example:

```text
500 simulated requests/sec

↓

25 representative particles
```

Higher traffic increases:

- particle density,
- movement frequency,
- visual pressure.

It must not increase simulation load or alter simulation results.

---

# 23. Custom VFX

All gameplay effects should be custom Stack & Survive assets.

Required MVP VFX:

```text
Provisioning

Scale Out

Overload

Cache Hit

WAF Block

Request Failure

Critical Warning

Scenario Success

Scenario Failure
```

These effects must not modify official Azure icons.

---

# 24. Provisioning Effect

Recommended:

```text
Placement

↓

Hologram building

↓

Construction ring

↓

Materialization

↓

ACTIVE
```

The Azure icon may appear once the resource identity needs to be communicated.

The construction effect belongs to the custom building, not the official icon.

---

# 25. State Overlay Model

Do not create a different Azure icon for each gameplay state.

Use custom overlays.

Example:

```text
Official App Service Icon
        unchanged

Custom building
        +

Healthy overlay
Warning overlay
Overloaded overlay
Provisioning overlay
```

This prevents Azure identity and game state from becoming visually mixed.

---

# 26. HUD

The HUD should be original Stack & Survive UI.

Do not reproduce Azure Portal UI.

Top HUD:

```text
Credits

Traffic

Availability

Latency

Scenario Phase
```

Example:

```text
BLACK FRIDAY

1,250 credits
320 req/s
99.92% availability
184 ms latency
Wave 3 / 5
```

The goal is immediate game readability.

---

# 27. Objectives Panel

Useful Hackathon objectives:

```text
☑ Survive all traffic phases

□ Maintain availability ≥ 99%

□ Keep average latency < 300 ms

□ Stay within budget
```

This turns technical requirements into game objectives.

---

# 28. Event Feed

The event feed is important for explaining simulation behavior.

Examples:

```text
10:23 Bot traffic detected

10:22 Protected Edge blocked malicious traffic

10:21 App Service overloaded

10:20 Scale-out completed

10:19 Cache deployed
```

Events should be generated from actual simulation state.

They must not invent events that did not occur.

---

# 29. Selected Resource Panel

When a resource is selected:

```text
[Official Service Icon]

App Service

● Running

Requests
280 / 400 req/s

Utilization
72%

Instances
3

Latency
186 ms

[ Scale Out ]

[ View Details ]
```

The icon acts as an identity badge.

The rest of the panel is original Stack & Survive UI.

---

# 30. Resource Labels

On-map labels should remain compact.

Example:

```text
[icon]

App Service
×3

██████░░
```

Avoid showing large amounts of text beneath every building.

Detailed information belongs in the selected-resource panel.

---

# 31. Environment Assets

The environment must be custom or properly licensed game artwork.

Possible sources for prototype assets:

- Kenney CC0 packs
- OpenGameArt CC0 assets
- Brackeys CC0 VFX
- Original project artwork

Environment assets include:

```text
Ground

Road / connection path

Walls

Trees

Rocks

Water

Build pads

Decorative infrastructure
```

They must not visually compete with resource buildings.

For the reframe, prefer indoor raised floors, rack rows, cooling units, vents, cable trays and utility equipment. Grass, trees, outdoor fortress scenery and floating platforms are no longer the target environment. Background racks have no service badges or interaction affordance.

---

# 32. Custom Building Asset Strategy

For the Hackathon, avoid creating dozens of original resources.

Build only:

```text
App Service Building

Azure SQL Building

Managed Redis Building

Protected Edge Building
```

These four should receive the highest visual polish.

Generic environmental assets may come from reusable asset packs.

---

# 33. Asset Layering

Recommended runtime composition:

```text
Resource Container

├── Shadow
├── Building Sprite
├── Azure Icon Badge
├── Status Ring
├── Resource Label
├── Instance Indicator
└── Dynamic Effects
```

Example:

```text
                    ⚠
                    │
             [Azure Icon]
                    │
            ┌─────────────┐
            │ APP SERVICE │
            │    TOWER    │
            └─────────────┘
                 ×3
              ███████░
```

---

# 34. Phaser Implementation Model

Conceptually:

```ts
ResourceView
 ├─ buildingSprite
 ├─ serviceIcon
 ├─ statusOverlay
 ├─ label
 ├─ instanceBadge
 └─ effects
```

The official icon is a separate sprite or image layer.

It is not baked into the custom building texture unless the usage policy for that asset specifically permits it.

Keeping it separate also makes later replacement easier.

---

# 35. Recommended Asset Structure

```text
apps/web/public/assets/

  azure-icons/
    app-service.svg
    azure-sql.svg
    managed-redis.svg
    application-gateway.svg

  buildings/
    app-service.webp
    azure-sql.webp
    managed-redis.webp
    protected-edge.webp

  environment/
    ground/
    build-pad/
    walls/
    vegetation/

  traffic/
    browse.webp
    order.webp
    bot.webp

  effects/
    provisioning/
    scale-out/
    overload/
    cache-hit/
    waf-block/
    failure/

  ui/
    actions/
    status/
    metrics/

  audio/
```

Official Azure icon files should remain clearly separated from original game assets.

---

# 36. Asset Provenance

Track where every asset came from.

Recommended:

```text
assets/
  ATTRIBUTION.md
```

Example:

```markdown
# Asset Attribution

## Microsoft Azure Icons

Source:
Azure Architecture Center

Usage:
Service identification only.

Files:
- app-service.svg
- azure-sql.svg
- managed-redis.svg

Modifications:
None.


## Kenney Assets

Pack:
Sci-Fi RTS

License:
CC0

Usage:
Prototype environment assets.
```

This becomes especially important if the repository is later made public.

---

# 37. Internal Hackathon Boundary

This visual direction is designed primarily for:

> **Microsoft Internal Hackathon use.**

The internal context allows Azure identity to be central to the experience.

However, internal use and future public distribution should remain separate decisions.

Before:

```text
Public GitHub release

Public hosted game

Marketing material

External commercial use
```

review:

- asset licenses,
- Azure icon usage,
- Microsoft trademark requirements,
- Hackathon IP rules,
- employer OSS policy.

The architecture should make official icons easy to replace if required.

---

# 38. Public-Release Compatibility

To preserve future flexibility:

```text
Do not bake official icons permanently
into custom building textures.
```

Instead:

```text
Building Asset
+
Icon Layer
```

If external-use requirements change later:

```text
Official Icon

can be replaced with

Neutral Service Badge
```

without redesigning the entire building.

---

# 39. Visual Vertical Slice

The next visual implementation should focus on a single polished scene.

Required architecture:

```text
Internet
    ↓
Protected Edge
    ↓
App Service ×2
    ├────→ Azure SQL
    ↓
Managed Redis
    ↓
Azure SQL
```

It should demonstrate:

- official Azure icons,
- custom buildings,
- custom environment,
- Browse traffic,
- Order traffic,
- Bot traffic,
- WAF blocking,
- Cache hits,
- SQL overload,
- App scale-out,
- provisioning,
- live HUD,
- objectives,
- event feed.

---

# 40. Visual Vertical Slice Acceptance Criteria

A first-time viewer should understand within approximately ten seconds:

```text
1. This is a game.

2. The game uses Azure services.

3. Traffic is entering the architecture.

4. Azure resources process that traffic.

5. Some resources are under pressure.

6. Architecture changes affect the outcome.
```

The viewer should not need to read the documentation first.

---

# 41. Hackathon Visual Priorities

## P0

- Data-center environment and processing lanes
- Bounded representative App/SQL pressure markers (not simulated queues)
- Compact budget/demand/availability/pressure HUD
- Build / Manage modes and on-demand Insights / Events / Why

- Game-world redesign
- Custom buildings for four MVP resources
- Official Azure icon integration
- Traffic animation
- Provisioning animation
- Scale-out animation
- Cache-hit effect
- WAF-block effect
- Overload feedback
- Tactical HUD
- Objectives
- Event feed
- Result comparison polish

## P1

- Better environment assets
- Additional VFX
- Small audio set
- Better transitions
- Mini-map
- Additional camera polish

## P2

- Additional Azure services
- Multiple environment themes
- Advanced lighting
- Full animation system
- Mobile-specific visual redesign
- Characters / specialists

---

# 42. Current Engineering UI Migration

The existing engineering MVP should be transformed rather than rewritten.

Keep:

```text
Simulation engine

Architecture editor

Traffic state

Live actions

Result calculations

Replay

Persistence
```

Replace or redesign:

```text
Primitive resource rectangles

Engineering-console styling

Large persistent text sections

Always-visible diagnostic information

Developer-oriented layout
```

The simulation remains untouched.

Keep existing procedural resource structures and state projections. Extract environment rendering into `environment-art.ts` when implementing the indoor scene. Add `queue-visualization.ts` only as a read-only projection of authoritative App/SQL pressure. No queue-depth metric, new price, fifth instance, fifth phase, live Cache/Edge deployment or other mockup-only mechanic is approved by the reference image.

Only the presentation layer becomes game-oriented.

---

# 43. Developer Inspector

Developer diagnostics remain valuable.

They should remain available only through a development mode.

Normal player experience should not show:

- JSON state,
- internal counters,
- debug controls,
- engine diagnostics,
- detailed regression information.

---

# 44. Final Visual Architecture

The intended visual architecture becomes:

```text
                    Azure Identity
                         │
              Official Service Icons
                         │
                         ▼
              ┌─────────────────────┐
              │                     │
              │  Stack & Survive    │
              │    Game Assets      │
              │                     │
              └─────────────────────┘
                         │
            ┌────────────┼─────────────┐
            │            │             │
            ▼            ▼             ▼
        Buildings      Traffic         VFX
            │            │             │
            └────────────┼─────────────┘
                         │
                         ▼
                 Simulation State
```

Azure identity explains **what the resource is**.

Stack & Survive visuals explain **what the resource is doing**.

---

# 45. Core Rule

The project should consistently follow:

> **Azure owns the service identity. Stack & Survive owns the game experience.**

And:

> **Official Azure icons remain official. Everything around them becomes a game.**
