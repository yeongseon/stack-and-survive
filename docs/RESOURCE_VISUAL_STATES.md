# Infrastructure visual-state contract

Issue #131 defines the presentation contract before art refinement (#125), traffic/VFX (#126), pads (#127), local cards (#128), and integrated visual acceptance (#129). It does not add gameplay actions or change simulation truth. The current #125 art draft is preserved separately until this prerequisite passes review.

## Sources and dimensions

`resourceVisualState(view, reducedMotion)` is a read-only projection. Lifecycle (absent/provisioning/active), pressure (unmeasured/healthy/warning/overcapacity), routing and transient activity are separate dimensions. An installed but disconnected QA resource is not processing. A healthy resource may still have a representative busy marker at the existing 70% threshold; that marker does not redefine engine health.

Use runtime resources for installation and physical capacity, accepted timers for construction, queued actions for intent, and the last processed snapshot for traffic, revenue, filtering and pressure. A queued command is not accepted capacity. Snapshot `time`, not the next runtime boundary, determines whether boost has actually affected traffic.

## Before / during / after matrix

| Resource/state | Silhouette | Motion and glow | Packet/local cue | Action affordance |
|---|---|---|---|---|
| App active bay | One solid server per actual instance | Processing light when traffic exists | Work belongs only to active capacity | No scale-in control |
| App next empty bay | Flat empty socket, no server texture | Quiet outlined socket | No processing | Next expansion + |
| App later bays | Empty subdued sockets | No activity | No processing | Unavailable until preceding expansion |
| App queued | Same empty socket | Pending-command cue, no build completion | No added throughput | Prevent duplicate request |
| App construction | Open scaffold/grid in exactly next bay | Restrained build scan; static grid for reduced motion | Existing servers continue; no new capacity | Progress from accepted due time |
| App completion | Scaffold replaced by one solid server | One activation cue | Relief only if next measured utilization/drops improve | Next empty bay becomes available, up to four |
| Cache absent | Empty pad only | Quiet cyan/green outline | No cache path/activity | Add Cache with existing 5s/+8 cr/min details |
| Cache provisioning | Construction/hologram, not active building plus Add pad | Build scan, static scaffold alternative | No cache hits or early routing | Pending, not deployable again |
| Cache active | Compact solid facility, no Add pad | Activity only when eligible reads are processed | Actual hits terminate here; misses/overflow continue to SQL; writes stay direct | Inspect, no invented scaling |
| Edge absent | Empty gate pad only | Quiet outline | Existing direct ingress remains | Add Edge with existing 4s/+3 cr/min details |
| Edge provisioning | Gateway scaffold | Build scan/static alternative | Old ingress remains until activation | Pending only |
| Edge active | Solid pass-through gateway | Filtering cue only for actual traffic | Actual filtered bots stop; legitimate false positives stay separately identifiable | Boost when permitted |
| Edge boost queued/scheduled | Same gateway | Command/countdown cue, not strengthened filtering | Retain actual previous filtering | No duplicate boost |
| Edge boost active | Same gateway, brighter scan | Distinct non-combat mode cue | Stronger rejection only within actual snapshot window and nonzero filtered traffic | Once-only boost becomes spent after expiry |
| SQL normal | Fixed solid data core | Cool cyan | Actual reads/writes served | Inspect; no SQL scaling |
| SQL read pressure | Same core with read-side warning | Orange or red according to existing utilization | Read-specific ingress mass/loss cue | Explain Cache effect without claiming write relief |
| SQL write pressure | Same core with distinct write-side warning | Orange/red plus non-color marker | Direct App→SQL write loss cue | No invented Cache fix or SQL upgrade |
| Internet normal | Demand source | Bounded offered-demand density | Offered classes remain distinguishable | Intake policy action |
| Intake queued/pending | Same source | Policy transition cue only | No early rate rejection | Toggle disabled while pending/cooldown |
| Intake limited | Source plus limiter cue | Static mode marker, not fabricated throughput | Actual rejected bots/customers separated; density still distinguishes offered from admitted | Restore intake when allowed |

## Direct-world interaction and physical construction

The game-first implementation derives facilities, absent footprints and next App bay from authoritative resources. Hover adds a non-color outline; keyboard equivalents reveal with visible focus; selected/build actions project and clamp using the shared player camera. Neither hover nor camera movement changes eligibility. Pan/pinch/cancel never confirms an action.

`constructionSites` includes accepted Cache/Edge provisioning and an accepted pending App bay only. `drawConstruction` uses remaining/due ticks for scaffold height, progress strip and boot markers. Queued-only intent is not construction. Pause freezes progress, active resources have no construction overlay, and existing activation effects remain deduplicated. App/SQL floor plinths are decorative depth, never added capacity.

## Paused/terminal presentation

Pause/terminal retains actual lifecycle and last measured pressure. It must not replay processing successes or filtering events. Error stops animation. Reduced motion replaces continuous scans/pulses with equivalent static shape/state cues without changing requests, timers or routing. Repeated rendering of one snapshot must not manufacture new rewards.

## Evidence requirements

Every reference screenshot must name the actual architecture, controls and tick. In particular, App1 + no Cache/Edge + 220 RPS (176 Browse/44 Order) overloads App, not SQL: the App limits downstream throughput. Do not paint SQL critical for that fixture. Use a verified higher-App fixture for real SQL pressure.

Solid App server count must equal active instance count; empty sockets must not be faint complete servers. Absent service means no building, and installed service means no Add pad. Do not imply real FIFO depth, delayed success of dropped requests, spendable revenue, runtime scale-in or SQL scaling.

This contract and initial App-bay integration were delivered in #131. Subsequent rendering work added pooled endpoint cues, intake density, diegetic controls and larger physical App bays. #145 completes procedural resource anatomy around the existing original textures: separate read/write SQL banks, active-only Cache banks, and Edge request dots / activation clock / active boost bars. `facilityStateKey` invalidates structural art when these independent states change, even if maximum utilization is unchanged. Diagnostics record the actual draw result; reduced-motion changes invalidate diagnostic snapshots separately.

The before/during/after browser sequence exercises App1–4, Cache/Edge deployment, real filtering at tick76, queued/scheduled/active boost, paused/reduced-motion display, five-width installed badge bounds and missing SQL texture/badge fallback. Original PNG/SVG bytes and the owner-approved Pages asset inventory remain unchanged; the V2 presentation combines those sources with project-authored procedural structures, not a new external asset pack. #25 remains an uncompleted human observation gate. Runtime scale-in is #132, a separate P1 design evaluation requiring gameplay approval.

## Production V3 supersession

The preceding V2 paragraph describes historical QA coverage. Production V3 shipped in #210 under an explicit owner-approved expanded demo inventory: 61 original PNGs with paired sources, separate from unchanged Microsoft assets. Runtime scale-in #132 was subsequently retired as not planned, not implemented.

V3 construction uses the actual next bay and remaining/due ticks for progress strips; a queued request alone does not create a server or advance progress. Activation feedback occurs at the completed bay and does not replay on repeated snapshots. V3 pressure uses localized warning layers and heat/chevrons rather than stacking the old generic ring effects. SQL read-only pressure never illuminates its write warning; combined critical requires both sides over capacity. Cache hit and Edge filter layers require the actual corresponding processed outcome and stop when paused. Reduced-motion preserves static meaning. No authoritative values, current delays or action contracts changed.

Developer screenshots and production clicks validate implementation, not unfamiliar-player recognition or aesthetic approval. Those remain #25/#195/#159; do not close them with generated evidence.
