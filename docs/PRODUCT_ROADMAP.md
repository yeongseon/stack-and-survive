# Product roadmap

Version: 1.2. Reviewed main `aa2f826`, including test-only review fixes in #201. [Gameplay](GAMEPLAY_SPEC.md) owns current behavior; [#7](https://github.com/yeongseon/stack-and-survive/issues/7) is the live execution tracker. Plans do not approve new balance rules or establish human acceptance.

## Delivered and retired

- Deterministic living-operation engine, live deployments/scale-out, automatic routing and separate QA editor.
- Production-quality software #143–#150; challenge/provenance/strategy/ladder/history/profile/results #153–#158.
- Game-first camera/world/direct-action/HUD slice #199, physical construction/depth/outcome-first slice #200, strengthened test-only camera lifecycle #201.
- #123 and #142 closed completed as historical software epics; no further implementation belongs there. Manual audio remains #149.
- #151 closed not planned: independent pre-change baseline was never gathered. Do not fabricate or reconstruct it through an obsolete-build experiment.
- Public Pages demo and technical security safeguards delivered; public source is not licensed OSS or blanket third-party rights clearance.

## Current P0: Production Art V3 #202

The interaction architecture is sufficient. The next quality gain is cohesive production art, not more systems. **Make the already-game-like interaction look like a polished management game.**

| Group | Issue | Deliverable |
|---|---|---|
| ART PR A | #203 | Distinct Intake/Edge/App facility/App module/Cache/SQL silhouettes and materials; four real App bays and SQL read/write regions |
| ART PR B | #204 | Cohesive racks/cooling/electrical/walls/doors/floors/grates/vents/trays/conduits/rails/decals/lights/pipes |
| ART PR C | #205 | Lighting/semantic traffic/plaques/local actions/HUD micro-art integration; B/C may combine for two total PRs |

Stylized-realistic indoor2.5D industrial art, not SaaS illustration, pixel art, cinematic3D or unrelated packs. No outdoors/plants/logistics clutter. Original/custom first, CC0 second, verified CC-BY only when useful, no paid dependencies. Raster sprites encouraged; source/master/runtime/state overlays stay reproducible and attributable. Record manifest/provenance before runtime import. The previous Pages exception pins old asset bytes: review new inventory/public-distribution scope with #164 instead of silently changing approval.

Iterate at1440x900 with affected unit/renderer smoke and actual screenshot inspection; then390/1920. Full lint/types/unit/player/QA/Pages/assets once per complete grouped PR; allfive widths and relevant hardware performance at final integration. Do not rewrite unrelated docs or refactor unaffected systems.

## Parallel manual and release gates

- **#164:** code/original-art licenses; Azure asset treatment and applicable terms; employer/IP/Hackathon/public-distribution and attribution/redistribution decisions. Never blanket-license Microsoft materials. Art production can proceed while distribution conditions are unresolved; unreviewed runtime imports cannot.
- **#149:** one focused manual cue/volume/mute/spam/pause/resume and actual supported-device haptic check. Software complete; redesign only if a real defect is heard. Report unsupported devices honestly.

## One human session after finished V3

Keep #25, #195 and #159 open with distinct criteria. Show title without explaining controls; observe traffic/pressure/navigation/actions and physical expansion; then record answers verbatim about App/Cache/Edge, budget/no-FIFO, game-vs-dashboard and next strategy. **Do not prompt another run.** Observe whether retry is voluntary, whether decisions change and what tradeoff they explain. A declined/prompted replay does not pass #159.

#186 remains open only for #195; V3 is not new scope inside #186. #152 remains open for #159, with P0 software checked complete. No AI participant/quality scores or fabricated prior baseline.

## Frozen future, not active development

| Issues | Gate |
|---|---|
| #160 objectives/modifiers | FUTURE / BLOCKED BY #159; no implementation now |
| #161 workload families/bosses | FUTURE / BLOCKED BY #159; Flash Sale/Bot Attack/Read Storm/Order Rush are candidates only |
| #162 daily challenges | FUTURE / BLOCKED; no daily seeds/UTC/local-daily work now |
| #163 discoveries | FUTURE / BLOCKED; no collection before proven replay motivation |
| #132 runtime scale-in | Design evaluation only, NOT AUTHORIZED; after V3 + human tests + observed need + explicitly approved exact semantics |

No fake draining FIFO, arbitrary cooldown/cost, SQL scaling, routing/score/capacity changes or permanent bonuses. Strict test-first contract discipline remains for any separately approved simulation change. Owner must explicitly revise a gate to reprioritize frozen work.

## Submission polish

After art and observed human blockers: fix only observed issues, collect title/gameplay/overload/construction/success evidence, rehearse an honest2minute demo, refine README/Hackathon pitch and architecture explanation, disclose limitations and recovery fallback. Avoid major new gameplay during submission preparation. Preserve historical issues; close completed or explicitly retired work without deleting implementation history.
