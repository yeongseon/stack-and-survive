# Cross-branch integration requirements

Current checkpoint: merged main `c68ec0c`. Azure visual/operations and rules 0.4 scaling are integrated; original handoff notes below are boundaries, not pending merge instructions. **Azure service guide**, visible scaling/compact SQL and bounded inspector are delivered. Export plus Microsoft Learn exists only in draft PR #316 (head `5ed4b9e`), not main. AI Coach remains separate and unmerged. [Current status](docs/CURRENT_STATUS.md) owns release/gate evidence.

## Computer 2 — telemetry and simulation owner

- Computer 1 adds `azure-presentation.ts`, a read-only adapter over existing `View` and `resourceVisualState`. Do not feed fabricated `appCpuPercent` or `p95LatencyMs` into it: current data is **request utilization** and **average latency**, not CPU or percentile latency. The proposed `SimulationMetrics` interface needs optional/unavailable support or genuine observations before those fields can be displayed.
- `ResourceState.health` needs a way to represent **unmeasured** separately from healthy/offline. Current resource presentation uses `AzureHealth` including `unknown`; absence/construction are explicitly labeled. Preserve that distinction when connecting the proposed shared interface.
- `AzureTrafficKey` reserves a labeled timeline integration area, but generates no incidents. Replace the reserved paragraph with Computer 2's event strip only when typed `SimulationEvent[]` is available. Keep existing traffic processing and fixed geometry; source any real lane severity from authoritative observations. Computer 1 adds only cross-hatch drawing for an already-dropping lane in `drawProcessingLane`; it does not change `processingLanes` calculations.
- No simulation-core changes are requested by this branch. If future telemetry requires them, Computer 2 is the single owner; numerical changes require separate review.

## Computer 3 — findings and result owner

- `AzureResourceNode` accepts service ID, instance count, health, nullable utilization, lifecycle, selection and an explicit bottleneck flag. Reuse it for a result report only with validated run evidence; do not treat catalog descriptions as architecture recommendations or `ArchitectureFinding` output.
- This branch does not change `GameResult`, recommendation logic, history/comparison models, scoring, routes or leaderboard APIs. Keep the AI Coach branch separate; it has not been merged here.

## Shared shell and catalog boundaries

- Integration touches `TycoonGame.tsx`, `GameFloor.tsx` and `LearnDialog.tsx`. Preserve their existing control handlers when combining another workstream. New catalog actions call existing controller methods; they must not introduce unsupported resources or direct mutations.
- Tutorial preference key is `stack-and-survive.azure-tutorial.v1`; existing guide/history/settings schemas are unchanged. The conceptual four-step tutorial remains optional and separate from adaptive World guide. Avoid mounting duplicate tutorial or service-panel entries during shell integration.
- Semantic tokens are in `azure-visual-tokens.css`. Other workstreams can consume them without importing a second styling framework. Existing Azure SVG bytes/manifest and general rights gate #164 remain unchanged; do not add unverified official icons when integrating concept-only Front Door/WAF/Monitor/Application Insights definitions.
## Available Azure operations layer (merged main)

## Infrastructure scaling (Computer 1 → Computer 3 art)

Rules 0.4 is merged through #305; exact mechanics and optional names are in `docs/INFRASTRUCTURE_SCALING.md`. Deployment compatibility is blocked in #306. Optional names: `app-service-tier-1/2/3`, `app-module-tier-1/2/3`, `azure-sql-tier-1/2/3`, `azure-sql-replica`. Preserve canvas/origin/bay geometry; unavailable textures fall back to originals. SQL active-tier size is shared with hit/label/lighting anchors; engine state never depends on images.

The operations resource projection now reads actual tier/replica capacity and cost; SQL peak utilization remains a ratio (not divided by capacity again). Existing synthetic CPU/p95 fields are not used as measured values by scaling UI. Typed incidents for tier/draining/replica transitions can be added by the observation owner later; current runtime pending changes are authoritative and available without timers.

## For Computer 1 (Design / UI)

### Available Components

The operations layer provides typed data for UI integration. No UI components need to be built by Computer 2.

### Importing Metrics

```ts
import { deriveMetrics, deriveResourceStates } from '@stack-and-survive/simulation/operations';
import type { SimulationMetrics, ResourceState } from '@stack-and-survive/simulation/operations';
```

Call `deriveMetrics(simulationState, requestSnapshot)` after each tick to get current operational metrics.

Call `deriveResourceStates(simulationState)` to get Azure-style resource health states.

### Importing Timeline

```ts
import { buildTimeline } from '@stack-and-survive/simulation/operations';
import type { TimelineEntry } from '@stack-and-survive/simulation/operations';
```

Pass accumulated `SimulationEvent[]` to `buildTimeline()` for an ordered incident history.

### Styling

All styling decisions belong to Computer 1. The operations layer provides only data and types.

## For Computer 3 (Architecture Evaluation)

### Available Snapshot

```ts
import { createSnapshot } from '@stack-and-survive/simulation/operations';
import type { SimulationSnapshot, ArchitectureFinding } from '@stack-and-survive/simulation/operations';
```

Call `createSnapshot(state, requestSnapshot, events, scenarioId, seed)` at game completion to get a serializable snapshot for architecture evaluation.

The `ArchitectureFinding` type is provided as a contract for Computer 3 to implement findings against.

### Replay Fixture

```ts
import { createReplayFixture } from '@stack-and-survive/simulation/operations';
```

Creates a serializable fixture containing snapshot + player actions for deterministic comparison.

## Required Integration Changes

The operations layer is additive and does not modify existing simulation behavior. UI wiring remains optional and must honor the measurement/unknown-state boundaries above. Existing field names do not establish actual CPU instrumentation or a measured latency percentile.

## Determinism Guarantee

Given the same scenario, seed, and player actions, the operations layer produces identical:
- metrics
- alerts
- timeline
- snapshots
