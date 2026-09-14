# Product roadmap

Version: 1.1. Status baseline: merged PR #185 (`abdd412`). Delivered foundations and future work are distinguished below; plans are **not implementation evidence or permission to choose new balance constants**. [Gameplay](GAMEPLAY_SPEC.md) owns current behavior; [#7](https://github.com/yeongseon/stack-and-survive/issues/7) indexes live issue status.

## Delivered foundations

- Deterministic Black Friday engine, QA editor, architecture saves and comparison; ordinary title/countdown/live operation, fixed slots and automatic topology (through PR #122).
- State-accurate active/empty/provisioning bays, original facility art, pooled traffic/pressure and visual foundation (through PR #140).
- Authority reset #141 and asset manifest/integrity #143. Public source, secret safeguards and owner-authorized Pages demo under the [existing-asset exception](PAGES_DEMO_EXCEPTION.md); no general project license/third-party clearance or game backend.
- Production-quality **software** #144–#150: separated boundaries, facility anatomy, environment, light/shadow states, activity, opt-in audio/haptics and guide. #149 manual listening/haptics and #151 human quality comparison remain open; Epic #142 is not fully accepted.
- Replayability #153–#158: full challenge identity, measured live strategies, approved three-objective ladder on the same workload, bounded local records/bests, descriptive profiles and replay-focused report. #159 voluntary replay remains unverified; Epic #152 is not complete.

The owner repeatedly directed technical improvements before an unfamiliar-participant baseline. This does not create that missing baseline retrospectively. #25/#151 findings must disclose it; Epic #123 remains subject to human evidence. PR #185 improved report readability but the owner still found the overall console-like interaction unsatisfactory.

## Current priority: Game-first Visual Reframe

[Epic #186](https://github.com/yeongseon/stack-and-survive/issues/186) changes presentation/interaction, not simulation. **The world is the primary interface**: a playable indoor diorama, direct facilities/bays/footprints, shared camera projection, minimal HUD and outcome-first results with analysis on demand.

| Order | Issue | Scope / gate |
|---|---|---|
| First | #197 | Documentation guardrails and cross-layer [camera/world interaction contract](PLAYER_CAMERA_AND_WORLD_INTERACTION.md); merge before camera foundation |
| 1 | #187 | Unified presentation camera/coordinates; PR #196 is tested but unmerged at this roadmap revision, not supported navigation |
| 2 | #188 | Zoom/pan/Fit/focus, gestures and invariant/performance proofs |
| 3 | #189 | World-dominant player layout |
| 4 | #190 | Direct facility/empty-bay/footprint interaction with accessible equivalents |
| 5 | #191 | Physical construction/activation from real state |
| 6 | #192 | Minimal HUD and projected local actions |
| 7 | #193 | Indoor diorama hierarchy and depth |
| 8 | #194 | Game outcome first; existing rich evidence in Details |
| 9 | #195 | Five-width/input/reduced-motion/performance and real-human game-feel acceptance |

Sequence: production-quality foundation → replayability foundation → game-first reframe → human game-feel/replay evidence → gated variety. This owner-directed insertion before #159 reduces confusion between a weak interaction presentation and the underlying strategy loop. It does not guarantee replay motivation or replace actual observation.

Use Visual Direction v0.5 and the new contract prospectively. Update current-behavior Gameplay/Technical/Resource States and root README only as corresponding functionality merges. Do not advertise planned zoom or remove documented current pads prematurely. One primary issue active; preserve/reconcile existing PR #196 after #197 rather than discarding its tested work.

## Remaining gates and later work

| Work | Issues | Boundary |
|---|---|---|
| Human comprehension/quality/replay | #25, #151, #159, #195 | Actual verbatim unfamiliar-participant evidence; missing historical baseline explicitly disclosed |
| Manual audio/haptics | #149 | Software shipped; actual listening and device verification pending |
| Rights/license | #164 | Technical safeguards shipped; owner/employer/third-party decisions remain |
| Replayability P1 | #160–#163 | After #159 or explicit owner rescope: objective/modifier system → calibrated workloads/bosses → UTC daily → discoveries |
| Scale-in decision | #132 | P1 design/approval only; no implemented action or implicit reframe prerequisite |

Additional workloads/modifiers, extra levels or scoring rubrics need measured contracts. Existing approved ladder and four reachable descriptive profiles are not speculative features; they also do not prove global optimality. SQL upgrades, queues/functions, asynchronous processing, replication and new providers need separate semantics/approval. Never reinterpret the current no-FIFO model through visual queues.

## Exclusions and completion

No full3D/rotation, arbitrary placement/manual routing in ordinary play, backend/accounts/multiplayer, paid assets, permanent stat bonuses, gacha or real Azure provisioning. Future platform/telemetry/hosting extensions require demonstrated need, privacy/security and cost approval. Current Pages is an explicit narrow exception, not an authorization for Azure infrastructure or general asset release.

Planning is complete when scope, evidence and gates are explicit. Implementation completes only after tests, applicable visual evidence, review, actual CI and merge. Human/rights issues stay open without their evidence. Never fabricate participant answers, legal clearance, benchmark results or aesthetic quality scores.
