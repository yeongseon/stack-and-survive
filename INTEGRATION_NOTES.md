# Integration Notes — Azure Operations Layer

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

None required. The operations layer is additive and does not modify existing simulation behavior. Computers 1 and 3 can import and use the data at their discretion.

## Determinism Guarantee

Given the same scenario, seed, and player actions, the operations layer produces identical:
- metrics
- alerts
- timeline
- snapshots
