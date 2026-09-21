# Player console and operation report

Current rules 0.4 additionally show final active App/SQL tiers, instances/read replicas and optional-resource provisioning. Optional global ranking is distinct from local records and currently blocked for 0.4 by #306. Export to Azure/Microsoft Learn panels remain draft-only #316; they are not part of this deployed report. See [Current status](CURRENT_STATUS.md).

Issues #157/#158 and owner feedback on low gameplay UI quality. The existing engine, workload, resource geometry, Azure badges and asset inventory remain unchanged.

## Presentation

The game-first outcome layer now shows actual challenge outcome/cause/score, availability and architecture before analysis. Native Details contains the metrics, profiles, evidence, experiments, comparisons and history described below. Background world/header controls are inert during results; guide/camera/local controls are hidden, Tab cycles through visible result controls, and Review opens the existing Learn dialog with focus return. No comparison or record eligibility semantics changed.

`player-console.css` scopes a matte navy/amber/teal console to ordinary gameplay: readable HUD metrics, consistent world-local construction controls, quieter inline guidance and resource cards. No new floating dashboard or authoritative renderer calculation is introduced. The title illustration and QA editor remain separate.

`GameResult` renders an operation report with outcome, score, availability, total cost (including emergency cost), business value, [architecture profile](ARCHITECTURE_PROFILES.md), observed tradeoff and suggested next experiment. The report body scrolls independently; action buttons stay visible. Desktop uses a two-column profile/experiment layout; narrow viewports stack the content.

Next level is primary and receives focus only when a real next level is available after objective success. Otherwise Play again is primary, with the explicit purpose Try another architecture. Review business opens Learn as the secondary inspection action and restores focus on close. Retry preserves the selected challenge but resets infrastructure, budget, runtime and temporary actions; no unearned capacity carries over.

## Comparison semantics

The persistence hook captures `buildRunReport` against history **before** saving the current result. The report is associated with the exact terminal result object, so an earlier report cannot appear on a new run. Clear history also clears comparison state. Failed storage writes retain the report for the session, consistent with existing history fallback.

Previous attempt and previous highest-NBV eligible completion require exact challenge identity. Signed deltas additionally require equal status and elapsed duration. Availability deltas are percentage points; cost includes emergency charges; NBV is business value, not spendable budget. Different duration/status is labeled without an efficiency comparison. UI rounds to two decimals; record selection retains raw values and existing engine tolerance. A displayed 0.00 delta may hide a sub-display-precision difference.

New personal best labels require objective-valid completion and strict improvement against the prior retained best; first eligible completions establish all three bests and ties keep the earlier record. Existing bests remain available in the history disclosure. Missing/cleared report data is labeled unavailable rather than falsely claiming a first attempt.

## Evidence and limits

Unit tests cover four reachable full live profiles, accepted action ordering and negative cases, compatible deltas, unlike challenge/status/duration exclusion, initial records and ties. Browser coverage includes actual failure-to-success history, profile/record labeling, three real level completions and focus, five-width report containment and visible touch-sized retry, keyboard restart, Learn return and persistence failures. Screenshots are inspected, not merely generated. These checks are technical evidence; voluntary replay and aesthetic acceptance remain actual human work in #159 and related acceptance issues.
