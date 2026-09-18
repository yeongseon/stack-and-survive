# Azure Operations Workstream

## Baseline

- Main SHA: `587985b`
- Tests: 597 pass (pre-operations)
- Simulation entry: `packages/simulation/src/results.ts` → `advanceSimulation()`
- Tick model: 1 tick = 1 second, synchronous, deterministic
- No random behavior (seeded scenario, fixed traffic phases)
- Existing event model: `apps/web/src/observations.ts` (game events)

## Files Created

| File | Purpose |
|------|---------|
| `packages/simulation/src/operations/contract.ts` | Typed contracts (ResourceState, SimulationMetrics, SimulationEvent, SimulationSnapshot) |
| `packages/simulation/src/operations/metrics.ts` | Metric derivation from simulation state |
| `packages/simulation/src/operations/alerts.ts` | State-driven alert generation |
| `packages/simulation/src/operations/timeline.ts` | Incident timeline projection |
| `packages/simulation/src/operations/snapshot.ts` | Deterministic snapshot and replay fixture export |
| `packages/simulation/src/operations/index.ts` | Barrel export |
| `packages/simulation/src/operations/operations.test.ts` | Deterministic tests (21 tests) |

## Files NOT Modified

No existing simulation files were changed. All operations code is a read-only projection layer on top of existing state.

## Ownership

Computer 2 owns all files in `packages/simulation/src/operations/`.

Computer 1 and Computer 3 may import from `packages/simulation/src/operations/index.ts` but should not modify the operation files directly.

## Integration

Import from the barrel:
```ts
import { deriveMetrics, deriveResourceStates, createAlertState, generateAlerts, buildTimeline, createSnapshot } from '@stack-and-survive/simulation/operations';
```

See `INTEGRATION_NOTES.md` for Computer 1 and Computer 3 usage instructions.
