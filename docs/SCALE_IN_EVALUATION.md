# Runtime App scale-in — evaluation only (#132)

> **Archived proposal, not current rules.** #132 closed not planned; separate owner-approved #305 later implemented App scale-in (3s, minimum one, no refund), App/SQL tiers and SQL read replicas. Use [Infrastructure Scaling](INFRASTRUCTURE_SCALING.md). Original alternatives/approval language below are historical, not today's controls or an open #132.

Status: proposal for later approval, outside the visual P0. No code, new action, new balance constants or player controls are authorized by this document. Revisit after real first-time-player evidence (#25).

## Decision to evaluate

Reducing instances trades lower future infrastructure cost for reduced capacity and greater incident risk. Existing gameplay has scale-out only, minimum one and maximum four App instances. Cache and Edge have one-time installation; SQL remains fixed. A visual overhaul must not imply any inverse actions exist.

| Alternative | Benefit | Cost / risk |
|---|---|---|
| No scale-in | Clear existing decision space; preserves reference matrix | Cannot reduce an overinvestment during a run |
| Immediate reduction | Simple implementation and unambiguous boundary | Encourages rapid toggling; abrupt overload; no transition cue |
| Delayed decommission | Visible before/during/after decision and time to understand risk | Needs approved delay, cancellation and concurrent-action rules |

Recommended direction **if later approved**: delayed decommission of the highest-numbered active module, keeping at least one. This is not a current product decision. Do not choose a numeric delay or cooldown without a separate balance review. Prefer the term *decommissioning*: this model has no persisted queue or in-flight request objects to drain. A real draining mechanic would require a separately approved simulation change.

## Proposed contract requiring approval

- Reject while not RUNNING, at one instance, while another capacity action is pending, or during the approved cooldown. Decide whether Cache/Edge installation may proceed independently.
- Keep old capacity and cost throughout the decommission countdown. At one precisely defined tick boundary, before requests/economy, reduce instance count and recurring cost together. Never refund already incurred cost or add revenue to budget.
- The standard App cost implies one fewer active instance reduces future cost by the existing five credits/minute; this is not a purchase refund.
- Pause freezes the timer. Terminal/error recovery follows existing runtime rules. Decide whether cancellation is supported, when it is allowed, and how it is logged; do not silently provide it.
- Retain monotonically sequenced action logging and deterministic replay. Old scenarios with no new action should preserve outputs; new action schedules need explicitly versioned expected results.
- Visually keep the module solid but distinctly marked as decommissioning until the approved boundary, then replace it with an empty socket. No early capacity/cost reduction; no fake buffered requests being drained.

## TDD plan for a future implementation issue

Test minimum/maximum bounds; duplicate/conflicting actions; malformed timestamps; exact before/activation tick capacity and cost; pause/resume; cancelled action policy if approved; terminal/error recovery; cooldown boundary; reduced capacity causing real App losses; unchanged legacy no-action matrix; no refunds; deterministic replay and action attribution. Browser tests must verify keyboard/touch controls and the solid→decommissioning→empty visual sequence, without pretending SQL capacity changed.

## Approval gate

Record the decision after #25: retain no-scale-in, approve a reviewed action contract, or defer. Approval must name delay, cooldown, cancellation, concurrency, failure risk, balancing/version impact and test ownership. Only then create an implementation issue. #132 remains open awaiting that decision; documenting alternatives does not authorize implementation or mark approval complete.
