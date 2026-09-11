# Stack & Survive

## Visual Direction

**Version:** 0.2  
**Status:** Hackathon Visual Direction  
**Related Documents:** `PRD.md`, `GAMEPLAY_SPEC.md`, `SIMULATION_SPEC.md`, `TECHNICAL_DESIGN.md`  
**Primary Goal:** Make Stack & Survive feel like a cloud strategy game rather than an architecture simulator or operations dashboard.

---

# 1. Visual Goal

Stack & Survive must achieve three things at the same time:

1. **Look like a game**
   - It should not feel like an architecture diagram, admin portal, or monitoring dashboard.

2. **Make cloud behavior immediately readable**
   - Traffic flow, bottlenecks, caching, security filtering, and scale-out should be visible without requiring the player to study detailed metrics.

3. **Create strong first-impression value for a Hackathon demo**
   - Within the first 10 seconds, the viewer should understand:

> This is a strategy game where cloud architecture itself acts as the defense system.

---

# 2. High-Level Art Direction

The recommended visual direction is:

> **Azure-inspired tactical base-building game**

The experience should borrow the visual grammar of strategy and base-building games while keeping the architecture technically understandable.

Primary influences:

- Base-building strategy games
- RTS readability
- Clean cloud infrastructure visualization
- Stylized 2.5D / isometric environments
- Modern technical aesthetics

The goal is not to imitate any specific existing game.

---

# 3. Style Keywords

## Desired

- Isometric
- 2.5D
- Tactical
- Clean
- Stylized
- Modular
- Readable
- Modern cloud infrastructure
- Animated system flow
- Compact strategy base

## Avoid

- Enterprise admin dashboard
- Generic monitoring console
- Flat architecture diagram
- Dark hacker interface
- Excessive cyberpunk styling
- Realistic military visuals
- Generic fantasy tower defense
- Large amounts of persistent text
- Dense metric panels covering the world

---

# 4. Core Visual Principles

## 4.1 Architecture Must Look Buildable

Cloud resources should look like structures the player is constructing and operating.

The player should feel that they are building a cloud base rather than arranging diagram nodes.

---

## 4.2 Traffic Must Feel Alive

Traffic is one of the main visual actors in the game.

The player should be able to see:

```text
Traffic arrives
      ↓
Architecture processes it
      ↓
Some requests succeed through App and SQL
Some eligible reads succeed through Cache hits
Some bots are filtered before compute
Some legitimate requests are rejected or fail
```

Cache hits are successful requests, not a separate failure/success category. Motion is a projection of engine snapshots, never a source of request counts or outcomes.

## 4.3 World-First Information Layout

The architecture is the primary play surface. On the baseline at 1440×900 and 1024×768, the board should be visible without scrolling past documentation. At 390×844 and 320×568, show the top of the board in the initial viewport and keep the full baseline graph inside the board after Fit view. Larger player-built layouts remain reachable through pan/zoom; fitting the baseline does not promise every arbitrary layout is always visible.

Keep start/pause controls, time and essential pressure/economy signals easy to reach. Put full explanations, saves, glossary and detailed metrics in secondary panels or disclosures rather than covering the world. Do not delete educational information merely to reduce visible text. On small screens, panels may stack or collapse, but their controls must remain discoverable and keyboard/touch accessible.

## 4.4 Resource and State Identity

Use original lightweight Phaser geometry or original sprites. The following are minimal silhouette references, not mandatory exact artwork:

| Resource | Buildable silhouette | Operational identity |
|---|---|---|
| Internet source | Arrival platform or cloud beacon | External traffic origin, not deployable compute |
| App Service | Modular compute building with visible bays | Completed instances add modules; pending instances are not active capacity |
| Azure SQL | Cylindrical data store on a platform | Separate read/write dependency, not another App building |
| Cache | Compact layered memory structure | Read shortcut with a visible local response cue |
| Protected Edge / WAF | Gateway or arch | Traffic crosses it before App only on the active protected path |

| State | Minimum non-color cue |
|---|---|
| Selected | Outline/brackets and resource name/details |
| Provisioning | Incomplete scaffold/outline and remaining time; no fake processed traffic |
| Active | Complete structure and status label |
| Warning / overloaded | Explicit label and warning glyph; restrained emphasis rather than constant screen shake |
| Disconnected | Broken-link or disconnected label; no traffic effect, runtime cost still applies if active |

Colors support these differences but are never the only cue. Azure-inspired means recognizable cloud-service roles and a clean technical palette, not official branding or a replica Azure portal. Prefer calm blue/teal surfaces, clear warm warning accents and readable contrast over neon hacker/cyberpunk styling. Review asset provenance and brand guidance before public distribution.

## 4.5 Traffic Outcome Vocabulary

| Engine event | Visual requirement |
|---|---|
| Browse | Read marker distinguishable from Order and Bot by shape |
| Order | Write marker follows App → SQL; Cache never removes writes |
| Cache hit | Local response/ring at Cache; that representative read does not continue to SQL |
| Cache miss / overflow | Read continues Cache → SQL according to snapshot volumes |
| WAF bot filter | Threat-marked packet stops at the connected Edge; no off-path filtering aura |
| WAF false positive / rate rejection | Rejected-customer cue, not a successful response or security-score gain |
| App / SQL drop | Failure marker at its first loss stage; do not count the same loss twice visually as two requests |
| Completed scale-out | Completed instance becomes a full module when the engine grants capacity, not at button click |

Continue to use aggregated simulation and bounded representative markers, not one entity per request. Labels and the legend explain shapes and outcomes. Rate-limited requests stop before App processing; blocked or failed traffic must not be animated as success. Disconnected resources do not receive decorative request flow.

## 4.6 Motion and Technical Limits

Phaser 3.90.0 remains the accepted renderer. Isometric/2.5D here means a fixed, stylized 2D presentation; this direction does not authorize a full 3D renderer, engine change, free camera rotation, physical-distance latency or new gameplay mechanics.

Use animation to explain arrival, processing, filtering, provisioning and capacity completion. Respect reduced-motion preferences with static symbols and status text in place of optional pulses/travel effects. Pause freezes gameplay time; visual motion must not imply that traffic continues to be processed during pause or after termination.

## 5. Visual Acceptance and Review

1. At the baseline and a connected Cache/WAF design, reviewers can identify every resource by silhouette plus label without relying only on color.
2. Capture desktop/tablet/phone views and exercise selection, placement, connections, pan/zoom and Fit view. No core control is obscured by fixed panels; no horizontal page overflow is required to access controls.
3. Show healthy, provisioning, overloaded and disconnected states. Status remains understandable with animation reduced and color cues ignored.
4. Replay known snapshots: Cache-hit response ends locally, Order bypasses Cache, filtered bots stop at Edge, and failures match the first loss stage. The existing simulation reference matrix must remain unchanged.
5. Run the full browser regression suite and repeat peak rendering measurement with the actual graphics backend disclosed. Screenshots and FPS establish presentation/technical evidence only.
6. For the first-ten-seconds goal, show the initial play surface to an unfamiliar person and ask “What do you build, and what puts it under pressure?” Record the actual response under the human-validation issue; do not infer understanding from automated tests.

Implementation order: [#52](https://github.com/yeongseon/stack-and-survive/issues/52) criteria and responsive baseline → [#53](https://github.com/yeongseon/stack-and-survive/issues/53) resource silhouettes → [#54](https://github.com/yeongseon/stack-and-survive/issues/54) traffic/state motion → [#55](https://github.com/yeongseon/stack-and-survive/issues/55) visual verification → [#25](https://github.com/yeongseon/stack-and-survive/issues/25) actual human validation.

Numerical behavior remains authoritative in `SIMULATION_SPEC.md`. Player-facing paths and accessibility principles remain authoritative in `GAMEPLAY_SPEC.md`. This document refines their visual expression and does not certify the game as human-validated or hosted.
