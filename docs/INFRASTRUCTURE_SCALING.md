# Infrastructure scaling — rules 0.4

Computer 1 owns this gameplay/runtime integration. Computer 3 owns `art/**` and runtime art outputs. No art generator, exported image, manifest, or existing Azure icon is replaced by this branch.

## Mechanics

Scale out means more App machines; scale in removes the highest active bay after a three-second draining interval. Four bays remain the maximum, one active instance the minimum. Scaling a tier changes the same logical facility, not the machine count. SQL retains one primary; up to two companion read replicas add read capacity only.

| Facility / level | Capacity | Simulated running cost/min | Change delay |
|---|---|---:|---:|
| App Standard I |150 req/s per instance|5 credits per instance|6s tier change|
| App Standard II |240 req/s per instance|9 credits per instance|6s|
| App Premium I |360 req/s per instance|15 credits per instance|6s|
| SQL General Purpose I |180 reads/s,70 writes/s|12 credits|10s tier change|
| SQL General Purpose II |300 reads/s,110 writes/s|22 credits|10s|
| SQL Business Critical |480 reads/s,170 writes/s|36 credits|10s|
| Each SQL read replica |+180 reads/s,+0 writes/s|8 credits|8s add,3s remove|

App expansion remains8s; removal takes3s. Capacity and running cost retain the old values through the transition and change together at the start of the due tick. This is a simplified in-place update with delay/exposure to demand, **not a claimed Azure restart/draining/failover simulation**. No extra upfront fee or invented redundancy bonus. All App instances use the facility's current tier. Prices are game units (`1 credit` displayed as`$1K`), not Azure billing.

One pending infrastructure change per facility: horizontal App expansion conflicts with App shrink/tier changes. Independent App and SQL changes can proceed concurrently. Min/max, RUNNING status and affordability checks use the existing controller→engine gate. Pause stops authoritative ticks, not a renderer timer. A change due at180s does not activate in a run that processed ticks0–179.

## State and replay

- `Resource.tier?: 1|2|3`, only App/SQL; absent means1.
- `Resource.readReplicas?: number`, SQL only, integer0–2; absent means0.
- Existing `Runtime.scaleDue` remains the App scale-out path. New `infrastructureChanges` stores `{kind,type,started,due}` for other changes.
- Actions: `SCALE_IN`, `SCALE_UP_APP`, `SCALE_DOWN_APP`, `SCALE_UP_DATABASE`, `SCALE_DOWN_DATABASE`, `ADD_READ_REPLICA`, `REMOVE_READ_REPLICA`. Existing actions unchanged.
- Shared strict `parseAction` is used for history and backend input. The deterministic scheduler owns acceptance, rejection and activation; the renderer never creates capacity.
- New default challenge rules0.4, challenge version2 and hash. Original0.2/0.3 workload exports remain for regression; the original0.3 challenge is `blackFridayChallengeV03`.
- History/progress keys move to `balance-0.4.v1`. Old keys remain untouched and are not silently promoted. Full action log and final tier/replica state are checked by replay. New backend accepts the supported new ladder; old public scores are not relabeled.

### Deployment boundary

The currently deployed API may only support0.3. Deploy the matching0.4 replay backend **before** releasing the new client; verify its new challenge hash and successful local-test replay. Do not POST fabricated demo scores into the public board. An older API rejecting0.4 must leave local results working. This implementation task does not provision a model or change cloud subscriptions.

## Balance evidence

Run `pnpm --filter @stack-and-survive/leaderboard-api exec tsx ../../scripts/scaling-balance.ts`. It prints30 deterministic outcomes: ten schedules × three request mixes. Standard retains the existing180s traffic phases,75 funds and10% successful-sales reinvestment. Read/write alternatives are test workloads, not new released levels.

Measured standard-workload examples:

| Strategy | Outcome | Availability | Total running cost | Score |
|---|---|---:|---:|---:|
| No action |Failure45s|71.429%|12.750|810|
| Four small App + Cache, early |Complete180s|100%|115.333|8500|
| Existing timed Cache/Edge + three small App |Complete180s|99.620%|100.600|9474|
| Two Standard II + Cache/Edge |Complete180s|99.620%|116.783|9474|
| Four small App + one read replica |Complete180s|100%|114.933|8500|
| Two Premium App + Cache, early |Budget failure148s|100%|116.067|6538|
| Four App + SQL tier3, early |Budget failure127s|100%|108.200|6048|
| Timed late tier/replica evolution |Complete180s|99.620%|116.417|9474|

In the45%-write test workload, four App + tier3SQL completes at100% while Cache/read-replica strategies fail45s from SQL write losses. In the95%-read workload, these highly provisioned strategies exhaust funds because reads earn less; capacity success alone is not business success. These are limited samples, not proof of global balance optimality. Tier costs intentionally worsen per-capacity efficiency in return for compactness and a shorter App change delay. Cache/Edge still have distinct benefits and false-positive costs.

## Exact asset integration contract for Computer 3

Use existing `art/v3/runtime-inventory.json` records and the current canvas/origin/bounds geometry. Once approved and registered through that existing pipeline, these **optional record names** are discovered automatically:

```text
app-service-tier-1
app-service-tier-2
app-service-tier-3
app-module-tier-1
app-module-tier-2
app-module-tier-3
azure-sql-tier-1
azure-sql-tier-2
azure-sql-tier-3
azure-sql-replica
```

- `app-service-tier-N`: same base/bay geometry as`app-service`, **no baked active machines**. Actual per-bay `app-module[-tier-N]` images represent the authoritative instance count.
- `app-module-tier-N`: same module anchor/offset semantics as`app-module`, one image per active bay. Draining last module gets0.45alpha; its capacity/cost remain until removal.
- `azure-sql-tier-N`: one primary at existingSQL point. Preserve transparent margins/anchor so existing read/write overlays line up.
- `azure-sql-replica`: optional companion; rendered at42% primary scale at `replicaOffsets` in `scaling-art.ts`. It represents read offload, not a second writable primary.
- Unregistered or failed optional files fall back to`app-service`, `app-module`, `azure-sql`. Existing required V3 assets keep their recovery behavior. Do not weaken manifest integrity/rights gates to add files.
- Tier bars and text remain available regardless of optional art. Read representative packets split across primary/replicas, writes do not; App incoming samples spread across active bays. Sampling does not claim exact real-request routing.
- No simulation code depends on texture existence. Renderer layer/signature APIs remain existing Phaser contracts; no replacement engine/pipeline.

## Verification status

Initial baseline597 unit tests passed before edits. Additive core preserved all597, then version migration tests explicitly separated legacy/current identity. New coverage includes bounds, delayed activation, costs, replica read/write separation, deterministic replay, API acceptance and optional art fallback. Real unaccelerated production browser tests completed an180s9474-score evolving run and exercised an App-healthy/SQL-read-bound attempt with SQL up/down. Final checks and screenshot locations will be recorded after review/integration.

Human ten-second comprehension, new optional art delivery and broader balance tuning are not proven by automated screenshots. No live leaderboard submission or deployment is claimed.
