# Product roadmap

Version: 1.0. Roadmap entries are planned work, **not implemented features or permission to choose arbitrary balance constants**. Current behavior is [Gameplay](GAMEPLAY_SPEC.md). Live issue status and sequencing are indexed by [#7](https://github.com/yeongseon/stack-and-survive/issues/7).

## Delivered foundation

- Deterministic Black Friday simulation and QA editor, architecture saves and comparison.
- Normal title/countdown/living operation, fixed slots, automatic topology, live Cache/Edge deployment and App scale-out (PR #122).
- State-accurate bays, facility framing, pooled traffic/pressure, pads, HUD/results and inert title (PRs #130, #133–#135, #137, #138, #140).
- Public source repository and owner-authorized GitHub Pages demo with a narrow [existing-asset exception](PAGES_DEMO_EXCEPTION.md); no project-wide license selected or game backend deployed.

Technical acceptance is not human acceptance. #25 is technically unblocked after PR #140 but needs an actual unfamiliar participant. Epic #123 waits for #25, not vice versa.

## Next approved planning and execution gates

| Phase | Issues | Gate / scope |
|---|---|---|
| Authority and safeguards | #141, #164 | Current/future docs separation; security settings and human rights/license decisions |
| Current-player baseline | #25 | Real raw answers, not another screenshot review |
| Free-asset policy | #143 | May prepare policy/manifest before baseline; do not import unreviewed assets |
| Production Quality | Epic #142, #144–#150 | After baseline: boundaries, Building V2, Environment V2, lighting, animation, optional audio, tutorial |
| Quality comparison | #151 | Real post-pass observation using baseline questions |
| Replayability P0 | Epic #152, #153–#159 | Identity → measured strategies → ladder → history → profiles → results → voluntary replay evidence |
| Replayability P1 | #160–#163 | Only after #159: objectives/modifiers → boss/workload families → UTC daily → collections |
| Scale-in decision | #132 | P1 design/approval only; no new action until reviewed delay/cooldown/cancellation rules |

Policy and headless measurement may inform planning before human sessions when issue dependencies explicitly permit it; do not silently bypass gates on player-facing implementation. One primary implementation issue is active at a time. Baseline tests, quality comparison and replayability validation ask different questions and are not interchangeable.

## Candidate concepts, not approved releases

Additional workload families, differing objectives and deterministic modifiers are useful experiments. Exact number of levels, RPS percentages, stars and profile thresholds require calibration. Flow streaks, achievements, shareable seeds and architecture collections must not grant permanent infrastructure power or disguise losses.

SQL upgrades, Queue/Functions, asynchronous processing, replication, new providers and advanced architecture branches require new semantics and explicit approval. Existing no-FIFO behavior cannot be reinterpreted as queue/draining simulation through art or a label.

## Long-term options

Protocol/observability packages, online challenge sharing, leaderboards, accounts, native wrappers and Azure backend services are not current tasks. Introduce them only for a demonstrated need, with approved security/privacy/hosting costs. No accounts, multiplayer, gacha, energy systems, premium currency or permanent stat boosts in current scope.

## Completion rules

Planning is complete when scope, evidence, dependencies and human decisions are explicit. Implementation is complete only after relevant tests, visual evidence, review and actual CI/merge. Human/approval issues stay open when their evidence is absent. Never fabricate participants, legal clearance, benchmark results or globally optimal strategy claims.
