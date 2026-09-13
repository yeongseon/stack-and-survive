# Stack & Survive — Gameplay Specification

Version: 1.0. Current ordinary behavior through PR #140. [Simulation](SIMULATION_SPEC.md) owns calculations; [Roadmap](PRODUCT_ROADMAP.md) marks future features.

## 1. Normal-player journey

```text
Title → Start Game → 5-second countdown → living business
 → demand grows → observe pressure → world-local decision
 → accepted provisioning/action → real changed flow → outcome
 → Play again (fresh baseline) / Review business (Learn)
```

No architecture setup precedes Start Game. Decorative TitleWorld and title help consume no gameplay time/budget and produce no results. Repeated start must not create duplicate clocks. The 180-second deterministic Black Friday schedule starts after countdown; title/review time is additional. Internal phase counters are not primary player chrome.

## 2. Initial architecture and routes

Fixed Internet → App1 → SQL. Cache/Edge start absent. Desktop flow is left-to-right; narrow viewports stagger anchors without affecting throughput or latency.

Edge activation replaces direct ingress with Internet → Edge → App. Cache activation adds App → Cache → SQL for eligible reads; **direct App → SQL writes remain**. Until accepted deployment completes, the original route stays valid. Players never wire partial live topology.

Browse reads may terminate successfully at Cache; misses/overflow reach SQL. Orders write directly to SQL. Bots consume App capacity but neither access SQL nor generate revenue. WAF/limiting may reject legitimate customers; those losses remain in outcomes.

## 3. Supported actions

| Control | Runtime action | Existing effect |
|---|---|---|
| App pad/local capacity action | `SCALE_OUT` | +1 instance after 8s, max four; +5 credits/min active cost |
| Cache pad | `DEPLOY_RESOURCE` cache | One-time deployment after 5s; +8 credits/min active cost |
| Edge pad | `DEPLOY_RESOURCE` edge | One-time deployment after 4s; +3 credits/min active cost |
| Intake Limit/Restore | `RATE_LIMIT` | 5% broad rejection after 2s; existing toggle interval applies |
| Active Edge Boost | `EMERGENCY_WAF` | Once per run; 8 credits, 1s delay, 30s effect, higher bot filtering and 3% customer false positives |

These summaries do not redefine [numerical rules](SIMULATION_SPEC.md). Acceptance, ordering, affordability and exact activation ticks remain in that contract. Live actions require RUNNING; duplicates/pending conflicts are rejected. No runtime scale-in, SQL/Cache scaling, uninstall, move or disconnect exists.

Pads display `+` and role. Hover/focus reveals identity/duration/running cost. Click/tap opens confirmation; Confirm queues the action, Cancel/Escape returns focus. Unavailable pads may still explain why, but confirm is disabled. The App local card also exposes the existing guarded capacity action with cost/delay; this is not a purchase economy.

## 4. Before / during / after

Solid App module count equals active instances. Next empty bay is available, later bays locked, queued intent still empty, accepted scale-out a construction bay. Only activation creates the new solid server. Any pressure relief depends on actual measured demand/capacity.

Cache/Edge lifecycle is exclusive: absent pad, provisioning construction, or installed building. No Add pad beside an active facility. SQL read/write pressure is separate; Cache cannot imply write relief. Scheduled Edge boost is not active filtering. Internet density reflects bounded offered traffic, and limiter/rejection cues reflect actual policy effects.

[Resource Visual States](RESOURCE_VISUAL_STATES.md) keeps lifecycle, pressure and activity orthogonal. Packets are representative, not individual requests. Pressure is not FIFO depth, and dropped requests cannot succeed later.

## 5. HUD, cards and Learn

Primary HUD: remaining budget, offered demand, current availability, one dominant pressure reading; Learn and Pause/Resume. Meters are readings, not forecasts. Frozen readings differ from live processing.

Resource cards prioritize state/action while retaining cost and false-positive tradeoffs. Learn contains actual objectives/events, pressure explanation, capacities, accounting and glossary. Production has no persistent Build/Manage, initial-instance form, save/reset architecture controls, standalone command console or developer inspector.

Business feedback uses actual served orders/tick revenue, never spendable budget or duplicate per-render rewards. Optional original synthesized sound and feature-detected vibration are controlled in Learn/help, default off and gesture-enabled; [audio lifecycle and pending listening acceptance](AUDIO_FEEDBACK.md) are separate from simulation. The [optional world guide](WORLD_GUIDE.md) offers three explicit Observe/Decide/Compare tips based on real pressure, with Skip/Finish and replay in Learn. It never pauses or acts for the player; finishing tips is not a comprehension score.

## 6. Pause, errors and results

Pause freezes authoritative time, accepted countdowns and costs; inspection remains available, new live actions do not. Errors stop advancement; renderer rebuild reconstructs from existing state. Countdown recovery resumes its remaining time safely. Normal restart from pause/error returns to clean title/baseline and invalidates stale callbacks.

At completion/failure preserve the stopped world. Result shows engine cause, score, NBV, availability, elapsed time and insight. Survival is distinct from target attainment. Play again is primary and receives focus; Review opens Learn and returns focus on close.

Normal retry resets architecture, runtime, budget and temporary actions. It does **not** preserve upgraded infrastructure. Refresh starts a fresh player experience. There is no current normal-player personal best, history, level progression or architecture persistence.

## 7. Accessibility and validation

Keyboard/touch semantics, focus restoration and non-color cues are required. Reduced-motion changes apply during a session without changing simulation. Offscreen rendering can stop while authoritative RUNNING time continues. Very short screens may scroll, but required controls/results must remain reachable.

Verify 320/390/1024/1440/1920 widths, actual before/during/after fixtures, no pad collisions and truthful endpoint effects. Do not add fake SQL pressure to optimized scenes. #25 requires actual participant understanding; #151 compares the quality pass and #159 tests voluntary replay.

## Appendix A — QA/development editor only

Explicit QA/development defaults to the manual editor; `?tycoon` selects player interactions with diagnostics. Production query parameters cannot expose editor/JSON/manual ticks.

QA retains preparation free placement/move/remove, validated manual connections, initial instance choice, delayed preparation scaling, start validation, Build/Manage, manual steps, architecture save/reset, redesign/retry and session comparison. Required resources complete preparation before editor Start. Active disconnected optional resources cost money but do not process traffic; partial optional paths are invalid.

The QA shell is a full alternate application path, not merely a debug overlay. When its storage repository is available it loads the saved architecture at startup and automatically saves architecture changes, in addition to explicit Save/Clear controls. The versioned save stores architecture, not runtime progress. Redesign preserves completed resources/instances and clears scenario counters; unfinished scale-out grants no capacity. Existing session comparison labels different duration/status rather than calling an early failure more efficient. These implemented QA tools are distinct from future normal-player challenge/history/profile progression.

## Appendix B — Future replay loop

[Replayability Design](REPLAYABILITY_DESIGN.md) proposes challenge → result → comparison → alternative architecture/next level. Do not display Next Level, profiles, stars or personal-best claims before their data, eligibility and persistence contracts are implemented and verified.
