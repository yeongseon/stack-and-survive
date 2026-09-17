# Implementation plan

Version: 1.2. Current execution plan, replacing [the archived MVP sequence](archive/IMPLEMENTATION_PLAN_MVP.md). Reviewed merged baseline #253 (`9421e74`). [Roadmap](PRODUCT_ROADMAP.md) owns scope categories; GitHub [#7](https://github.com/yeongseon/stack-and-survive/issues/7), read with its latest updates, owns live status. The [release checkpoint](submission/RELEASE_CHECKPOINT.md) separates completed preparation from outstanding acceptance.

## 0. Establish the current baseline

PR #140 (`816a7a5`) established the historical visual **technical** baseline and artifact isolation, not final human acceptance. Current merged work includes camera/world interaction, V3 art, #212 gameplay, #213 baked hall, #216 Settings/Pause and #253 client release preparation. #141 authority reset and #143 manifest are delivered; public-source safeguards exist while #164 rights/license decisions remain. Do not rerun engine selection or rebuild the manual editor as normal gameplay.

1. #141 docs-only authority reset: archives, coherent current specs, future designs, link/code cross-check.
2. #164 public-source safeguards: inspect/enable available secret protections; code/art license and employer/third-party decisions require the owner. No default license selection.
3. #25 first-time-player evidence. It waits for a real participant, not Epic #123 closure. The independent pre-change baseline was not collected; later sessions must disclose that limitation instead of claiming retrospective comparison evidence.

## 1. Delivered history: Production Quality Epic #142

Policy preparation #143 was completed after docs. The original plan gated player-facing quality changes on #25; the owner subsequently reviewed the game, supplied new visual references and explicitly requested implementation to continue. That software is delivered, but owner feedback is not a substitute for an unfamiliar-participant baseline. #25 remains open; #151 was closed not planned because the pre-change independent baseline was never collected. The historical sequence was:

```text
#143 free-asset manifest / rights / reproducibility
 → #144 application and interaction boundaries
 → #145 original Building V2
 → #146 coherent Environment V2
 → #147 shadows / light pools / emissive state
 → #148 resource animation and action feedback
 → #149 optional accessible sound / supported haptics
 → #150 skippable world tutorial
 → #151 actual baseline comparison
```

Software #144–#150 is merged. #149 remains open for manual listening/physical haptics. The sequence above is delivered technical history, not a list of untouched future tasks. Do not reconstruct #151's missing baseline. Preserve state/no-early-effect regressions and provenance gates.

## 2. Delivered software: Replayability Epic #152

```text
#153 challenge / workload / objective / comparison identity
 → #154 actual strategy measurement and approved calibration
 → #155 small deterministic ladder
 → #156 bounded versioned local bests/history
 → #157 explainable architecture profiles
 → #158 next-level / alternate-architecture result loop
 → #159 actual voluntary second-run validation
```

#153–#158 are merged: approved ladder, measured strategies, history, profiles and report exist. #152 remains open for #159 actual voluntary replay evidence. A failed short run cannot win lowest-cost records against successful full runs. Scale-in #132 is closed not planned, not an implicit prerequisite or approved implementation.

## 3. Delivered history: Game-first Visual Reframe #186

The owner requested a world-first interaction surface after #185. The implementation is delivered through the camera/direct-action slices, canonical map, V3 integration and subsequent gameplay/settings passes. #186 remains open only for #195 human acceptance. The original dependency sequence below explains the design history, not current work orders; preserve the [camera/world interaction contract](PLAYER_CAMERA_AND_WORLD_INTERACTION.md):

```text
#197 documentation / cross-layer contract (first)
 → #187 shared player camera coordinate foundation
 → #188 zoom / pan / Fit / focus
 → #189 world-first screen composition
 → #190 direct facility / empty bay / construction footprint interaction
 → #191 physical construction / activation
 → #192 minimal HUD / world-local actions
 → #193 indoor diorama depth / facility hierarchy
 → #194 outcome first / existing analysis in Details
 → #195 technical and actual human acceptance
 → #159 voluntary replay evidence (coordinate participant sessions)
```

#197 and the camera foundation no longer await integration. The camera/world/direct-action slices #199/#200 and tests #201, canonical map #209, V3 runtime/refinements #210/#211, baked hall #214 and gameplay #217 are delivered. Do not restart those systems from the historical sequence.

The documentation discipline used during implementation remains applicable to future authorized work:
1. **Before integration (#197):** PRODUCT_ROADMAP, IMPLEMENTATION_PLAN, VISUAL_DIRECTION v0.5, PLAYER_CAMERA_AND_WORLD_INTERACTION, docs/README and focused PRD principles/current-status corrections.
2. **After corresponding functionality merges:** GAMEPLAY_SPEC for supported navigation/direct actions; TECHNICAL_DESIGN for actual camera/store/projection/hit-test ownership; RESOURCE_VISUAL_STATES for actual hover/focus/selection/construction projection; root README for usable controls and revision-verified checks. Never preannounce target behavior as current support.

Simulation/balance changes are outside a presentation-only task; #212 separately authorized the implemented balance0.3 changes. The existing analytical evidence remains available after hierarchy changes. Camera-only state must not leak into runtime or persistence, and React anchors must consume the world projection rather than duplicate it. Asset changes still require provenance and applicable demo/release approval.

## 4. Human game-feel and replay evidence

#195 coordinates #25/#159 questions and records unfamiliar participants verbatim, before explaining controls. Use the [one-session worksheet](submission/HUMAN_TEST_SCRIPT.md), keeping comprehension, game feel and voluntary replay outcomes separate. Distinguish technical coverage, owner feedback and independent human acceptance. Observe the reframed interaction before interpreting low replay as a strategy-system failure. No invented quality percentages or historical baseline; software success cannot close a human gate.

## 5. Retired scope, not queued development

#160 objectives/modifiers, #161 workload families, #162 daily challenges, #163 discoveries and #132 scale-in are closed not planned for this Hackathon. Their design notes preserve possible future ideas, not queued implementation. Passing #159 does not automatically reopen them; new work requires explicit owner rescoping.

## 6. Platform only when justified

Application boundary improvements do not authorize new workspace protocol/observability packages, servers or deployment. Future shared contracts need test-first versioning; telemetry needs consent/privacy design. GitHub Pages is separately owner-authorized under the [exact-inventory demo exception](PAGES_DEMO_EXCEPTION.md). The optional API has been deployed by the backend owner; health200/storage:file alone does not prove browser access or persistence across restart. Historical CORS issue #260 is closed and PR #261 merged; consult [final release readiness](submission/FINAL_RELEASE_READINESS.md) for newer browser evidence and remaining gates. Client work must not change backend operations, account DNS or public score data without separate authorization.

## 7. Current final-delivery sequence

1. Preserve #253 client metadata/local-status/layout/capture work and the [submission pack](submission/README.md); #248 documentation links are complete.
2. Recheck exact-main Quality and the actual Pages deploy job, then public client behavior. Record dated observations rather than treating a workflow conclusion or API configuration as sufficient proof.
3. Preserve the resolved #260 approved-origin boundary and verify remaining backend production replay-submission/persistence evidence under separate authorization, following the final release readiness report. The local game remains the fallback.
4. Conduct actual #25/#195/#159 participant and #149 listening/device sessions; resolve #164 rights decisions. Do not substitute automation or close these gates prematurely.
5. Fix only observed critical blockers, rehearse and record the labeled two-minute edited demo, and complete final submission review. Captures and a script are preparation, not proof that recording or submission occurred.

No new mechanics, art adoption or camera redesign is implied. #245's separate external-art experiment is not runtime adoption. Live social-card caches and native browser zoom remain manual checks unless actual evidence is recorded.

## Delivery protocol

Use issue/PR templates and labels, not new milestone/Project machinery. One primary implementation issue in progress. Before change: inspect actual code and relevant authority. During change: test-first numerical/contracts; evidence-first art; record concrete defects. Before completion: lint/types/related+full regression as applicable, inspect screenshots, obtain review and passing actual CI, merge, then close issue and clear stale workflow labels. Preserve original archives and user work.

When blocked by humans/approval, document the precise decision or participant evidence needed and continue only independent eligible tasks. Do not bypass guards, invent results, silently drop tests or claim a blocked epic complete.
