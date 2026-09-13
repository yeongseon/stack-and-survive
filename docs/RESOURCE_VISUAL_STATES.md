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

## Pause, failure, errors and reduced motion

Pause/terminal retains actual lifecycle and last measured pressure. It must not replay processing successes or filtering events. Error stops animation. Reduced motion replaces continuous scans/pulses with equivalent static shape/state cues without changing requests, timers or routing. Repeated rendering of one snapshot must not manufacture new rewards.

## Evidence requirements

Every reference screenshot must name the actual architecture, controls and tick. In particular, App1 + no Cache/Edge + 220 RPS (176 Browse/44 Order) overloads App, not SQL: the App limits downstream throughput. Do not paint SQL critical for that fixture. Use a verified higher-App fixture for real SQL pressure.

Solid App server count must equal active instance count; empty sockets must not be faint complete servers. Absent service means no building, and installed service means no Add pad. Do not imply real FIFO depth, delayed success of dropped requests, spendable revenue, runtime scale-in or SQL scaling.

This contract and initial App-bay integration are #131 deliverables. Stronger Cache/Edge endpoint visuals, SQL pressure-side art, intake density and diegetic controls are owned by the consuming issues above and are not declared implemented merely by this document. #25 remains the actual human observation gate. Runtime scale-in is #132, a separate P2 design evaluation requiring gameplay approval.
