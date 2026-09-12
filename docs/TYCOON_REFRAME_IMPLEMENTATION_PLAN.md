# Stack & Survive — Data-Center Tycoon Reframe

**Version:** 0.1  
**Status:** Owner-requested direction; implementation pending by issue  
**Target:** Microsoft Internal Hackathon, desktop web  
**Stack:** Existing Phaser 3, React and deterministic TypeScript simulation

## 1. Goal

> **Build. Scale. Keep the business flowing.**

Stack & Survive is a real-time cloud infrastructure management game where players scale and optimize Azure architecture as demand grows, keeping requests flowing, customers served, and costs under control.

The world shows the problem; metrics explain it; the player improves the architecture. This is a presentation and gameplay-language reframe, not a simulation rewrite. The owner's detailed reframe proposal is the direction behind this concise execution plan.

## 2. Owner's visual reference

The owner supplied a reference image in the conversation depicting an isometric indoor data center, large service facilities, illuminated processing lanes, representative request blocks, a compact top HUD and a bottom-left construction tray.

Use that image as the principal composition and art-direction reference. The attachment is not currently a repository asset and is not approved third-party game artwork to copy into the application. Do not claim its source, license or exact artwork has been acquired.

### Reproduce the visual principles

- **Facility, not floating base:** raised floor tiles, background server rows, cooling equipment, cable trays, vents, utility cabinets and restrained safety markings. Decorative equipment has lower contrast and no playable service badge.
- **Recognizable processing facilities:** retain and improve the existing custom App hub, SQL data core, memory accelerator and ingress checkpoint. Add coherent depth, surfaces and detailing rather than restarting the engine or replacing service identity with arbitrary icons.
- **Readable processing lanes:** broad lane bases, illuminated centers, directional marks and bounded moving requests. Paths must be traceable between real connected resources; decorative cables must not look like active request routes.
- **Visible pressure:** representative markers collect near the constrained App or SQL input, with separate first-loss failure cues. They communicate demand/capacity pressure, not a real FIFO queue.
- **World-dominant composition:** the facility is the focal point. A compact top bar and bottom construction controls replace permanently expanded telemetry. Objectives, events and explanations are available on demand.
- **Contextual resource cards:** short name, instance/state indicator and selected details. Cards must not obscure nearby buildings, lane endpoints or input targets.

The reference contains rendered, textured assets and lighting. Similar spatial composition is achievable in Phaser; comparable material/detail quality requires deliberate original or properly licensed art work. A background image alone is not an implementation of an interactive game world, and primitive placeholders must not be described as pixel-equivalent to the reference.

### Do not copy mockup semantics

| Reference element | Required implementation interpretation |
|---|---|
| Dollar purchase prices | Existing operational credits and running costs; no new placement charge |
| `Queue 24` | Representative pressure indicator, never a measured number of waiting requests |
| `3/5 instances` | Actual active/pending instances and existing four-instance limit |
| `Wave 2/5` | Actual Black Friday demand phase out of four |
| Forecast percentages or income/min | Display only when derived and accurately labeled; do not invent growth or revenue |
| Large Microsoft wall mark | Not required; do not add unverified logo artwork or imply endorsement |
| Glowing/recolored service emblems | Use unchanged official service badges in separate layers, with existing provenance limits |
| Fast-forward button | Not a new gameplay speed feature merely because the reference depicts it |

## 3. Invariants

- Preserve `packages/schema`, `packages/cloud-domain`, `packages/scenarios`, `packages/simulation` and `SIMULATION_SPEC.md` for this reframe.
- Preserve admission, independent capacities, Browse/Order/Bot routing, Cache read eligibility, WAF filtering, provisioning, actions, failure, economy, scoring, replay and persistence.
- Preserve PREPARATION/RUNNING/PAUSED/COMPLETED/FAILED. Cache/Edge deployment remains preparation-only; additive live deployment is a later separately scoped decision.
- No stored queue, new wait latency or later completion of requests already dropped. Visual markers are recomputed from current authoritative pressure. Paused state cannot imply continued processing.
- SQL pressure is derived from its independent read/write utilization and drops; more App capacity does not guarantee lower SQL pressure or higher business value.
- Existing source artwork, official icon separation, keyboard access, reduced motion, narrow-view usability and offscreen rendering optimization remain intact.
- Budget is not revenue or cash balance. Label the selected primary economy metric explicitly.
- Normal player and QA build separation remains. Hosting, GitHub Pages, subscription/visibility changes and telemetry remain deferred.

## 4. Sequential P0 delivery

| Order | Issue | Deliverable / exit evidence |
|---|---|---|
| A | #80 | Product-language reframe: PRD 0.6, Gameplay 0.4, Visual Direction 0.3, README and primary player copy. No defense-based primary positioning; reference scores unchanged. |
| B | #81 | **Data Center Environment:** extract `environment-art.ts`; original facility floor/racks/cooling/cables. Inspect screenshots against the owner's composition, with decorative/playable hierarchy clear. |
| C | #83 | Processing lanes: trace actual ingress/read/write paths and direction without relying on technical labels. |
| D | #82 | **Visual Queue:** bounded stateless App/SQL pressure projection near the real constrained destination, including stage-local drops and non-color cues. |
| E | #84 | Compact budget/demand/availability/one-alert HUD; world occupies approximately 75–85% of the desktop gameplay composition as a guideline, not a rigid small-screen constraint. |
| F | #88 | On-demand Insights / Events / Why, reusing actual objectives, event history and rule-based explanation. |
| G | #86 | Build / Manage separation: supported resources first, advanced topology tools on demand, original controls still functional. |
| H | #87 | Processing-oriented scale/cache/filter effects; no combat spectacle or fabricated recovery. |
| QA | #85 | Full reference regressions, ordinary-player and QA builds, responsive screenshots, motion/accessibility checks and actual-GPU measurement. |
| I | #25 | Actual human comprehension test. Record what players infer from pressure and architecture changes; never substitute screenshots or AI review for responses. |

Data Center Environment and Visual Queue are P0, not optional polish. The former optional umbrella #29 and deferred hosting/telemetry issues #26–#28 were closed as Not planned during owner-requested backlog cleanup; do not execute them from historical references. Issue #7 is the current ordered index. Implement and review one issue at a time; discovered defects receive linked issues before correction. Future optional work requires a focused approved issue.

## 5. Visual pressure contract

Introduce `queue-visualization.ts` only in the application presentation layer. Inputs come from authoritative utilization, offered/admitted demand and stage-specific drops; outputs describe representative marker count, severity and destination.

- Below 70% or zero relevant demand: no pressure markers.
- Counts are bounded (initial maximum 12) and nondecreasing for increasing valid utilization, with explicit tests at 70%, 90%, 100% and 120% boundaries.
- Exact marker mapping is a presentation setting, not a change to simulation balance or a measured queue-depth metric.
- Invalid/nonfinite inputs cannot create runaway counts. Distinguish an unavailable metric from measured zero.
- Failure cues use actual first-loss-stage counts, never extra simulated losses or implied retries.
- A scale completion does not clear markers unless subsequent authoritative demand/capacity warrants it.
- Explain on selection or Why: “Representative pressure markers; this simulation does not buffer requests in a real queue.” Do not display a numerical waiting count as game truth.

## 6. Acceptance

The normal-player build should visibly resemble a data-center flow-management game, not the previous outpost or a monitoring dashboard. Capture baseline, actual App pressure, actual SQL pressure, Cache shortcut, Edge filtering and scale activation states. The fully optimized configuration must not be forced into SQL overload for a screenshot.

Verify semantic behavior as well as images: lane destinations, cache/write split, first loss, marker bounds/monotonicity, unchanged numerical results, placement/connection/resize/retry/save, keyboard focus and reduced motion. Preserve ordinary production tests separately from diagnostic QA tests. Profile before introducing pooling or heavier assets.

Human review should ask: what is moving, what limits flow, what the pressure markers mean, what scale-out changed, why Cache helped or did not help, and what Edge changed. A user inferring that dropped requests are buffered for later service is a learning defect to fix.

## 7. Deferred scope

Live Cache/Edge deployment, new purchase prices, persistent tycoon economy, progression/unlocks, additional scenarios/services/providers, advanced forecasts, native mobile and true 3D remain outside this P0 reframe. The title **Stack & Survive** remains; internal API/status names need not be renamed solely for marketing consistency.
