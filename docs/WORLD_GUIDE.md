# Optional first-run world guide

Implementation: #150. This is a small contextual help surface, not an automated player, a hidden pause, or evidence that a human has learned the game.

## Flow

The first run shows a compact overlay Observe → Decide → Compare, with a smaller landscape-phone layout. Advance only through explicit Next/Finish; no build is required. Skip and Learn replay/pre-run opt-out remain available. Balance0.3 tips describe single-action expansion, real activation delay and10% reinvestment. Finishing tips is not passing a comprehension test.

Observe highlights traffic intake. Decide uses current actual pressure, pending/queued actions and budget: it can suggest reviewing App capacity, Cache for SQL reads, Edge for bot pressure, SQL write constraints or waiting. It never promises an expansion solves every metric and never recommends Cache for writes. If a maximum or already-installed resource remains overloaded, the guide explains the remaining constraint rather than saying no pressure exists. Compare prompts the player to inspect actual consequences after activation.

The guide does not mutate the controller or scenario, charge money, inject workloads, stop time or click controls. Alternative/late actions remain valid. No synthetic bottleneck is introduced to force a tutorial step.

## Persistence and accessibility

`stack-and-survive.guide.v1` stores only explicit `skipped` or `completed`; malformed/version-mismatched data resets to new. Replay clears that preference for a new walkthrough. Storage failure only affects persistence, not dismissal in the current session. A new unfinished attempt restarts at Observe.

The overlay is not a blocking modal and text does not intercept world input. Keyboard/touch controls remain accessible; Skip/Finish returns focus to Learn. Static outlines identify relevant resources. No automatic camera jump or forced action occurs.

## Verification and remaining human gate

Unit tests cover immutable projection, real App/read/write/bot scenarios, no-pressure waiting, construction/queue/paused/error/terminal states, low budget and validated records. Browser tests compare unchanged simulation state before/after a guide step, perform alternative world actions, verify replay/skip/finish persistence, unavailable storage and initial viewport visibility.

Actual usefulness remains #25/#195/#159; #151's missing historical comparison was retired. Observe current understanding without leading actions or prompting replay. Automated tests/Finish do not constitute human evidence.
