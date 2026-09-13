# Implementation plan

Version: 1.0. Current execution plan, replacing [the archived MVP sequence](archive/IMPLEMENTATION_PLAN_MVP.md). [Roadmap](PRODUCT_ROADMAP.md) owns scope categories; GitHub [#7](https://github.com/yeongseon/stack-and-survive/issues/7) owns live status.

## 0. Establish the current baseline

PR #140 is merged (`816a7a5`), including final visual acceptance and artifact isolation. #129/#139 are closed. Do not rerun the obsolete engine selection or rebuild the manual editor as normal gameplay.

1. #141 docs-only authority reset: archives, coherent current specs, future designs, link/code cross-check.
2. #164 public-source safeguards: inspect/enable available secret protections; code/art license and employer/third-party decisions require the owner. No default license selection.
3. #25 current-build first-time-player baseline. It waits only for a real participant, not Epic #123 closure. Record misunderstandings before art changes.

## 1. Production Quality Epic #142

Policy preparation #143 may proceed after docs without waiting for a participant. Actual player-facing quality implementation follows the baseline:

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

Keep each issue/PR focused. Preserve the state matrix and no-early-effect regressions. Art quality is judged through real scenes, not unsupported percentage claims. External files enter only after manifest/license review.

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

Do not publish ladder difficulty or strategy-success claims before measurement. A failed short run cannot win lowest-cost records against successful full runs. Scale-in #132 is a separate decision, not an implicit prerequisite or approved implementation.

## 3. Variety after the replayability gate

#160 objective/modifier application → #161 calibrated boss/workload families → #162 UTC daily challenge → #163 discoveries. Each new content/rule identity is deterministic and recorded with results. Do not start P1 solely because P0 tests are green; #159 requires actual human evidence or explicit owner rescoping.

## 4. Platform only when justified

Application boundary improvements do not authorize new workspace protocol/observability packages, servers or deployment. Future shared contracts need test-first versioning; telemetry needs consent/privacy design. Hosting remains deliberately deferred despite the public repository.

## Delivery protocol

Use issue/PR templates and labels, not new milestone/Project machinery. One primary implementation issue in progress. Before change: inspect actual code and relevant authority. During change: test-first numerical/contracts; evidence-first art; record concrete defects. Before completion: lint/types/related+full regression as applicable, inspect screenshots, obtain review and passing actual CI, merge, then close issue and clear stale workflow labels. Preserve original archives and user work.

When blocked by humans/approval, document the precise decision or participant evidence needed and continue only independent eligible tasks. Do not bypass guards, invent results, silently drop tests or claim a blocked epic complete.
