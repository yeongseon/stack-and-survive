# Local run records and personal bests

Implementation scope: #156. Records are stored only in this browser under `stack-and-survive.history.v1`; they are not accounts, online rankings, anti-cheat evidence or a saved running game.

## Storage and comparison

- Version 1 retains the latest 20 finished attempts in insertion order and at most three best groups for the exact approved challenges, not merely a scenario name or hash.
- Each group independently retains highest availability, lowest total cost and highest NBV, even when those runs leave the recent list. Only objective-valid full-duration completions qualify. Failed and objective-missed runs remain history but cannot set bests.
- Total cost includes infrastructure and emergency cost. Values are stored unrounded; comparisons use engine tolerance. Ties retain the earlier record.
- Highest recorded completed level describes records, not unlock authorization. Ladder progression is separate.
- Each summary preserves full challenge, initial/final architecture, complete ordered actions and accepted/rejected outcomes, duration/status, customer totals, costs, NBV, score and pressure peaks.

## Validation and lifecycle

Load/record boundaries replay initial architecture and full action schedule through the existing engine to verify metrics, final architecture and outcomes. Repeated identical records within one parse are checked once. No replay occurs per animation frame. Payload length, record/action counts and supported challenges bound the work. Unknown versions/conditions or inconsistent records fall back to empty in-memory history.

Self-consistency is not a signature: a localStorage editor can replace an entire valid run. It cannot prove a human played or a best is globally optimal. Do not use these records as a trusted leaderboard.

The current immutable result object is deduplicated during handoff; persisted IDs prevent duplicate references. Distinct attempts with identical outcomes remain distinct. Random UUIDs identify records, not simulation conditions.

Unavailable/quota-limited storage retains session records, reports the write failure and offers Retry saving records. Clear removes only history, not ladder/audio/guide/QA settings; failed clear preserves records. Corrupt input is not overwritten on load; a later explicit record/save/clear may replace it. Version 1 has no invented migration from unrelated save keys.

## UI and evidence

Title/result details show current-challenge bests and recent attempts with duration/objective status. Other conditions are labeled not comparable. `recentComparable` returns the latest matching run for the [operation report](OPERATION_REPORT.md); its snapshot is captured before the current run is added. The report displays [descriptive profiles](ARCHITECTURE_PROFILES.md), compatible previous/best comparisons and fresh-run actions without changing stored record schema.

Tests cover real failure→success, retention beyond 20, first-tie behavior, unlike objectives, duplicate handoff, rejected actions, altered final architecture/metrics, reload, storage retry and isolated clear. Human replay motivation still requires #159.
