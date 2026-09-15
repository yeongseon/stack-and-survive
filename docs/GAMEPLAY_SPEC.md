# Stack & Survive — Gameplay Specification

Version: 1.2. Current ordinary behavior includes the game-first camera/direct-world slice (#199) and matching physical/outcome polish. [Simulation](SIMULATION_SPEC.md) owns calculations; [Roadmap](PRODUCT_ROADMAP.md) marks future features.

## 1. Normal-player journey

```text
Title → Start Game in landscape → whole-map Fit → operating-sector reveal
 → existing 5-second countdown → living business
 → demand grows → observe pressure → world-local decision
 → accepted provisioning/action → real changed flow → outcome
 → Play again (fresh baseline) / Review business (Learn)
```

No architecture setup precedes Start Game. Decorative TitleWorld and title help consume no gameplay time/budget and produce no results. Repeated start must not create duplicate clocks. The 180-second deterministic Black Friday schedule starts after countdown; title/review time is additional. Internal phase counters are not primary player chrome.

## 2. Initial architecture and routes

Fixed Internet → App1 → SQL. Cache/Edge start absent. One canonical2400×1350 landscape world preserves the same facility geography on every device; viewport changes camera framing and HUD, never positions or topology.

Edge activation replaces direct ingress with Internet → Edge → App. Cache activation adds App → Cache → SQL for eligible reads; **direct App → SQL writes remain**. Until accepted deployment completes, the original route stays valid. Players never wire partial live topology.

Browse reads may terminate successfully at Cache; misses/overflow reach SQL. Orders write directly to SQL. Bots consume App capacity but neither access SQL nor generate revenue. WAF/limiting may reject legitimate customers; those losses remain in outcomes.

## 3. Supported actions

| Control | Runtime action | Existing effect |
|---|---|---|
| Next physical App bay/local capacity action | `SCALE_OUT` | +1 instance after 8s, max four; +5 credits/min active cost |
| Cache world footprint | `DEPLOY_RESOURCE` cache | One-time deployment after 5s; +8 credits/min active cost |
| Edge world footprint | `DEPLOY_RESOURCE` edge | One-time deployment after 4s; +3 credits/min active cost |
| Intake Limit/Restore | `RATE_LIMIT` | 5% broad rejection after 2s; existing toggle interval applies |
| Active Edge Boost | `EMERGENCY_WAF` | Once per run; 8 credits, 1s delay, 30s effect, higher bot filtering and 3% customer false positives |

These summaries do not redefine [numerical rules](SIMULATION_SPEC.md). Acceptance, ordering, affordability and exact activation ticks remain in that contract. Live actions require RUNNING; duplicates/pending conflicts are rejected. No runtime scale-in, SQL/Cache scaling, uninstall, move or disconnect exists.

Click physical facilities to inspect; click the next empty App bay or absent Cache/Edge footprint for projected cost/delay confirmation. Confirm queues the existing action; Cancel/Escape returns focus to the opener or Fit. Keyboard equivalents reveal as an outlined group on focus and use the same controller contracts. Unavailable actions explain why and cannot be confirmed. SQL has no scaling control.

### Camera navigation

Wheel/trackpad zoom anchors at the pointer; touch pinch zooms and drag pans after a six-pixel threshold. Drag/pinch/cancel release never activates infrastructure. Buttons offer75/90/100/125/150/180% relative whole-map Fit. Move exposes pan/focus, with optional Arrow/+/-/0 while camera controls are focused. New runs show Fit750ms then a1050ms focus to145% operational view, before the five-second countdown; reduced motion jumps directly. Pause/recovery preserves the store; resize preserves canonical center/zoom and clamps. Navigation and intro do not alter simulation/replay/economy. Outside-world scrolling remains normal.

Viewports up to900px wide and taller than wide show a rotate-device gate on Start or mid-operation, not a vertical map rearrangement. Title/help/results can be read in portrait. Start/Continue attempts fullscreen/orientation lock on coarse-pointer devices; unsupported/rejected requests leave manual landscape play available. Portrait holds countdown and pauses active gameplay. Landscape alone does not resume: Continue resumes only a run interrupted by the gate, while a previously manual Pause stays paused. Hidden pre-run countdown is held; hidden RUNNING retains its existing clock policy. No budget/time is spent during orientation gate or opening reveal.

## 4. Before / during / after

Solid App module count equals active instances. Next empty bay is available, later bays locked, queued intent still empty, accepted scale-out a construction bay. Only activation creates the new solid server. Any pressure relief depends on actual measured demand/capacity.

Cache/Edge lifecycle is exclusive: absent pad, provisioning construction, or installed building. No Add pad beside an active facility. SQL read/write pressure is separate; Cache cannot imply write relief. Scheduled Edge boost is not active filtering. Internet density reflects bounded offered traffic, and limiter/rejection cues reflect actual policy effects.

[Resource Visual States](RESOURCE_VISUAL_STATES.md) keeps lifecycle, pressure and activity orthogonal. Packets are representative, not individual requests. Pressure is not FIFO depth, and dropped requests cannot succeed later.

## 5. HUD, cards and Learn

The world fills the player viewport with a small overlay HUD: remaining budget, offered demand, current availability, short pressure, Learn/Pause and camera controls. Facility plaques display actual identity/active instances/construction/pressure. Detailed meters are not permanent chrome; frozen readings remain distinct from live processing.

Resource cards prioritize state/action while retaining cost and false-positive tradeoffs. Learn contains actual objectives/events, pressure explanation, capacities, accounting and glossary. Production has no persistent Build/Manage, initial-instance form, save/reset architecture controls, standalone command console or developer inspector.

Business feedback uses actual served orders/tick revenue, never spendable budget or duplicate per-render rewards. Optional original synthesized sound and feature-detected vibration are controlled in Learn/help, default off and gesture-enabled; [audio lifecycle and pending listening acceptance](AUDIO_FEEDBACK.md) are separate from simulation. The [optional world guide](WORLD_GUIDE.md) offers three explicit Observe/Decide/Compare tips based on real pressure, with Skip/Finish and replay in Learn. It never pauses or acts for the player; finishing tips is not a comprehension score.

## 6. Pause, errors and results

Pause freezes authoritative time, accepted countdowns and costs; inspection remains available, new live actions do not. Errors stop advancement; renderer rebuild reconstructs from existing state. Countdown recovery resumes its remaining time safely. Normal restart from pause/error returns to clean title/baseline and invalidates stale callbacks.

At completion/failure preserve the stopped world. First show actual outcome/cause/score, availability, challenge and architecture. Details preserves all [operation report](OPERATION_REPORT.md) NBV/cost/profile/evidence/comparisons/records. Survival and objective attainment remain distinct. Eligible Next level receives focus; otherwise Try another architecture (accessible name Play again) is primary. Actions stay visible as Details scrolls; background guide/camera/resource controls are hidden. Review opens Learn with focus return.

Normal retry resets architecture, runtime, budget and temporary actions. It does **not** preserve upgraded infrastructure. Refresh starts at the title with validated local completion progress and [run records/personal bests](RUN_HISTORY.md), but no running scenario or architecture restoration.

The approved ladder is Survive (180s) → Reliable Business (180s and ≥99% cumulative availability) → Customer First (180s and ≥99.9%). Workload and resource rules remain the same. Only objective-valid completion opens the next level. Level selection creates fresh infrastructure. Progress settings reset ladder completion; Run history clears only history/bests. Storage failure preserves session play with feedback.

## 7. Accessibility and validation

Keyboard/touch semantics, focus restoration and non-color cues are required. Reduced-motion changes apply during a session without changing simulation. Offscreen rendering can stop while authoritative RUNNING time continues. Very short screens may scroll, but required controls/results must remain reachable.

Verify phone844×390/740×390 and desktop1024/1440/1920 gameplay,320/390 portrait gates, actual lifecycle fixtures and truthful endpoints. #25/#195/#159 share one final human session after V3; historical comparison #151 is retired.

## Appendix A — QA/development editor only

Explicit QA/development defaults to the manual editor; `?tycoon` selects player interactions with diagnostics. Production query parameters cannot expose editor/JSON/manual ticks.

QA retains preparation free placement/move/remove, validated manual connections, initial instance choice, delayed preparation scaling, start validation, Build/Manage, manual steps, architecture save/reset, redesign/retry and session comparison. Required resources complete preparation before editor Start. Active disconnected optional resources cost money but do not process traffic; partial optional paths are invalid.

The QA shell is a full alternate application path, not merely a debug overlay. When its storage repository is available it loads the saved architecture at startup and automatically saves architecture changes, in addition to explicit Save/Clear controls. The versioned save stores architecture, not runtime progress. Redesign preserves completed resources/instances and clears scenario counters; unfinished scale-out grants no capacity. Existing session comparison labels different duration/status rather than calling an early failure more efficient. These QA tools are distinct from normal-player challenge progression and history; profiles remain planned.

## Appendix B — Remaining replay scope

[Replayability Design](REPLAYABILITY_DESIGN.md) separates implemented identity/ladder/history/profiles/results from gated P1 content. No unreviewed stars/modifiers/permanent capacity bonuses. Actual unfamiliar-person game-feel and voluntary replay remain #195/#159, not automated-test conclusions.
