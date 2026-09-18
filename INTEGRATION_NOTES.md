# Cross-branch integration requirements

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
