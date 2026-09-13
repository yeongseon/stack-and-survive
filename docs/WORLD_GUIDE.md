# Optional first-run world guide

Implementation: #150. This is a small contextual help surface, not an automated player, a hidden pause, or evidence that a human has learned the game.

## Flow

The first run shows Observe → Decide → Compare beneath the HUD and before the world. Advance only through explicit Next/Finish clicks; the guide never requires a specific build. Skip is always available, and Learn/help offers replay or pre-run opt-out. Completing the guide means dismissing all three tips, not passing a comprehension test.

Observe highlights traffic intake. Decide uses current actual pressure, pending/queued actions and budget: it can suggest reviewing App capacity, Cache for SQL reads, Edge for bot pressure, SQL write constraints or waiting. It never promises an expansion solves every metric and never recommends Cache for writes. If a maximum or already-installed resource remains overloaded, the guide explains the remaining constraint rather than saying no pressure exists. Compare prompts the player to inspect actual consequences after activation.

The guide does not mutate the controller or scenario, charge money, inject workloads, stop time or click controls. Alternative/late actions remain valid. No synthetic bottleneck is introduced to force a tutorial step.

## Persistence and accessibility

`stack-and-survive.guide.v1` stores only explicit `skipped` or `completed`; malformed/version-mismatched data resets to new. Replay clears that preference for a new walkthrough. Storage failure only affects persistence, not dismissal in the current session. A new unfinished attempt restarts at Observe.

The guide occupies normal document flow, not a blocking modal. Keyboard/touch targets remain accessible; Skip/Finish returns focus to Learn. Static outlines identify a relevant resource, so no flashing animation is required. Narrow screens may scroll; there is no automatic camera jump or forced focus steal during a run.

## Verification and remaining human gate

Unit tests cover immutable projection, real App/read/write/bot scenarios, no-pressure waiting, construction/queue/paused/error/terminal states, low budget and validated records. Browser tests compare unchanged simulation state before/after a guide step, perform alternative world actions, verify replay/skip/finish persistence, unavailable storage and initial viewport visibility.

Actual first-time-player usefulness remains #25/#151. Observe whether a participant finds the next action without being led, can explain a changed traffic path and understands that pressure is not a FIFO. Do not label automated UI tests or an explicit Finish button as human learning evidence.
