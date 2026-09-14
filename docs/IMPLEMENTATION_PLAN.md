# Implementation plan

Version: 1.1. Current execution plan, replacing [the archived MVP sequence](archive/IMPLEMENTATION_PLAN_MVP.md). Reviewed merged baseline #185 (`abdd412`). [Roadmap](PRODUCT_ROADMAP.md) owns scope categories; GitHub [#7](https://github.com/yeongseon/stack-and-survive/issues/7) owns live status.

## 0. Establish the current baseline

PR #140 (`816a7a5`) established the historical visual **technical** baseline and artifact isolation, not final human acceptance. Current merged work extends through #185. #141 authority reset and #143 manifest are delivered; public-source safeguards exist while #164 rights/license decisions remain. Do not rerun engine selection or rebuild the manual editor as normal gameplay.

1. #141 docs-only authority reset: archives, coherent current specs, future designs, link/code cross-check.
2. #164 public-source safeguards: inspect/enable available secret protections; code/art license and employer/third-party decisions require the owner. No default license selection.
3. #25 first-time-player evidence. It waits for a real participant, not Epic #123 closure. The independent pre-change baseline was not collected; later sessions must disclose that limitation instead of claiming retrospective comparison evidence.

## 1. Production Quality Epic #142

Policy preparation #143 was completed after docs. The original plan gated player-facing quality changes on #25; the owner subsequently reviewed the game, supplied new visual references and explicitly requested implementation to continue. Technical quality work therefore proceeds, but this feedback is not a substitute for an unfamiliar-participant baseline. #25/#151 remain open and any eventual comparison must disclose the missing pre-change independent baseline rather than fabricate it:

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

Software #144–#150 is merged. #149 remains open for manual listening/physical haptics, and #151 for human comparison evidence. The sequence above is the delivered technical foundation plus its remaining human gate, not a list of untouched future tasks. Preserve state/no-early-effect regressions and provenance gates.

## 2. Replayability Epic #152

```text
#153 challenge / workload / objective / comparison identity
 → #154 actual strategy measurement and approved calibration
 → #155 small deterministic ladder
 → #156 bounded versioned local bests/history
 → #157 explainable architecture profiles
 → #158 next-level / alternate-architecture result loop
 → #159 actual voluntary second-run validation
```

#153–#158 are merged: approved ladder, measured strategies, history, profiles and report exist. #159 remains actual voluntary replay evidence; the owner has prioritized the reframe below before collecting that evidence. A failed short run cannot win lowest-cost records against successful full runs. Scale-in #132 is a separate decision, not an implicit prerequisite or approved implementation.

## 3. Documentation-first Game-first Visual Reframe #186

The owner finds the current player UI too console-like despite #185's improved report. The next work changes the primary interaction surface, not engine rules. Follow the [camera/world interaction contract](PLAYER_CAMERA_AND_WORLD_INTERACTION.md) and Visual Direction v0.5:

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

PR #196 contains tested but unmerged #187 work. Preserve it; #197 must merge first, then reconcile its math notes/plan/index with the cross-layer authority before merging the foundation. Do not restart from scratch or claim user-facing zoom in #187. Only one primary issue is in progress; the foundation waits while documentation is active.

Two documentation stages:
1. **Before integration (#197):** PRODUCT_ROADMAP, IMPLEMENTATION_PLAN, VISUAL_DIRECTION v0.5, PLAYER_CAMERA_AND_WORLD_INTERACTION, docs/README and focused PRD principles/current-status corrections.
2. **After corresponding functionality merges:** GAMEPLAY_SPEC for supported navigation/direct actions; TECHNICAL_DESIGN for actual camera/store/projection/hit-test ownership; RESOURCE_VISUAL_STATES for actual hover/focus/selection/construction projection; root README for usable controls and revision-verified checks. Never preannounce target behavior as current support.

SIMULATION_SPEC, strategy balance, history/challenge semantics and asset inventory are outside this presentation reframe. The existing #185 analytical evidence remains available after hierarchy changes. Camera-only state must not leak into runtime or persistence, and React anchors must consume the world projection rather than duplicate it.

## 4. Human game-feel and replay evidence

#195 coordinates #25/#151/#159 questions and records unfamiliar participants verbatim, before explaining controls. Distinguish technical coverage, owner feedback and independent human acceptance. Observe the reframed interaction before interpreting low replay as a strategy-system failure. No invented quality percentages or historical baseline; software success cannot close a human gate.

## 5. Variety after the replayability gate

#160 objective/modifier application → #161 calibrated boss/workload families → #162 UTC daily challenge → #163 discoveries. Each new content/rule identity is deterministic and recorded with results. Do not start P1 solely because P0 tests are green; #159 requires actual human evidence or explicit owner rescoping.

## 6. Platform only when justified

Application boundary improvements do not authorize new workspace protocol/observability packages, servers or deployment. Future shared contracts need test-first versioning; telemetry needs consent/privacy design. GitHub Pages is now separately owner-authorized under the [exact-inventory demo exception](PAGES_DEMO_EXCEPTION.md); Azure/backend hosting remains deferred.

## Delivery protocol

Use issue/PR templates and labels, not new milestone/Project machinery. One primary implementation issue in progress. Before change: inspect actual code and relevant authority. During change: test-first numerical/contracts; evidence-first art; record concrete defects. Before completion: lint/types/related+full regression as applicable, inspect screenshots, obtain review and passing actual CI, merge, then close issue and clear stale workflow labels. Preserve original archives and user work.

When blocked by humans/approval, document the precise decision or participant evidence needed and continue only independent eligible tasks. Do not bypass guards, invent results, silently drop tests or claim a blocked epic complete.
