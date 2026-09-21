# Final Release Readiness Report — Computer 1

Current release/draft boundaries are centralized in [Current status](../CURRENT_STATUS.md). This report's original SHA/counts/pending statements remain historical and must not be rewritten as newly executed evidence.

> **Historical report, not current status.** This September 17 checkpoint is retained for its original evidence. For the September 19 integrated rules 0.4 candidate, merged #294, current API compatibility blocker and presentation materials, use [HACKATHON_HANDOFF.md](HACKATHON_HANDOFF.md). Pending-merge statements below describe that earlier checkpoint and must not be read as today's backlog.

Observed 2026-09-17. **READY WITH RISKS** for the existing owner-authorized demo, not blanket rights approval or proof of final visual acceptance.

## Candidate and ownership

Audited main: `b1477176fffd566869314b3fe4d2cf487253e4d4`. Local follow-up: `chore/final-release-readiness`. This follow-up is not yet merged/deployed. Pending #265 owns earlier mission-HUD/authority-document changes; Computer 3 owns scene/environment/buildings/traffic/lighting/camera/art. This branch changes none of those visual files and does not reimplement #265.

Last verified deployment: `aec20f1e5e36863d8428e39637e3609230c0104d`, [Pages run35164605874](https://github.com/yeongseon/stack-and-survive/actions/runs/35164605874); both build and actual deploy jobs succeeded. At the final status check, [main Quality35168054887](https://github.com/yeongseon/stack-and-survive/actions/runs/35168054887) for `b147717` had completed player tests and was still running QA. Do not equate these different revisions with the local hardened candidate.

Before PR delivery, upstream main `b7aa13f` was integrated without changing its backend/adversarial-test work. The newly merged Promise rejection handler was reconciled with request generations and the active-submission guard. Integrated lint/typecheck,431 unit tests and7 release-browser cases passed locally. The398-unit and earlier full-player/QA/performance evidence below describes the pre-integration candidate; remote exact-commit CI must validate the combined version. No final deployment or visual merge is implied.

Backend #261 and #264 are merged. #260 is closed. The earlier `yeongseon.dev` CORS incident is historical: after the owner's separately approved parent-Pages domain removal, a fresh browser now stays at <https://yeongseon.github.io/stack-and-survive/>. DNS was not modified by this readiness audit. Browser/CDN caches can retain earlier redirects; verify the actual final URL, not only a repository setting.

## Verified

- Initial audit before source changes: lint, typecheck,380 unit tests, production/QA/Pages builds and exact demo inventory passed.
- Live public page returned200 with the expected game title, no fatal console errors or failed requests. Observed entry bundle: `assets/index-DgZcP4h6.js` (not the local follow-up bundle).
- Live health200 (`storage: file`), leaderboard GET200 with a valid empty board, and POST preflight204 all allowed `https://yeongseon.github.io`. Browser-origin GET succeeded. This proves reads/preflight, not live replay POST or restart durability.
- Clean Chromium session,1920×1080: Cache + Edge + App3 built through normal controls; observed100→440→600req/s, completed180s with9451 points. Score matched the saved run; objective was met.
- Play again reset to100req/s and74.8 funds after the first tick. No-action run then failed with810 points; terminal score stayed fixed. Reload preserved the two completed/failed history records. No nickname was registered and public POST count was0.
- Result/leaderboard/retry access checked at1920×1080,1440×900 and1366×768. Production player tests also cover small landscape and portrait gates. No scene layout was changed.
- End-to-end rehearsal took about188s to the successful result and243s through the subsequent failed run. Therefore the full game is **not** a continuous two-minute demo: use the existing [labeled edited script](DEMO_SCRIPT.md), or budget over3 minutes plus commentary for live play.

## Fixed

1. **P1 — malformed API success responses reached rendering unchecked.** New tests reproduced14 failures before the fix. The client now validates board identity, availability, entry arrays, numeric ranges and accepted/rank confirmation before exposing data to the UI. Invalid JSON/schema, HTTP errors, timeout and offline conditions preserve local fallback.
2. **P1 — stale response ordering could mix challenges or overwrite verified results.** Challenge changes clear old data; request generations discard outdated GET/submission responses. Duplicate in-flight submits are ignored. Pending payload is saved before sending, survives refresh, and a successful retry clears it. No backend protocol, score formula or submission policy changed.
3. **Regression coverage.** Added actual React StrictMode hook browser tests, configured-API failure runs of the actual game, and three consecutive production start/pause/title cycles with mute/zero-volume persistence and one renderer per run. The isolated harness is under `apps/web/tests`, not production assets or the production entry graph.

## Tests and build

| Command / scope | Result |
|---|---|
| `pnpm lint`, `pnpm typecheck` | PASS |
| `pnpm test` | PASS —398 tests,0 skipped |
| `pnpm test:release` | PASS —7 browser cases; all API writes intercepted at an invalid test origin |
| `pnpm test:player` file groups | PASS —16 cases (12 control/layout/restart +4 long score/readiness cases) |
| Relevant `pnpm exec playwright test` QA files | PASS —20 cases: persistence/history, lifecycle, sound, final sprint, build guards, missing/corrupt images, responsiveness |
| `pnpm test:pages` | PASS —3 cases |
| `pnpm test:performance` | PASS —3 measurement cases |
| `pnpm build`, `pnpm build:qa`, `pnpm build:pages` | PASS; existing Phaser bundle-size/shared dynamic-import warnings remain |
| `pnpm check:assets:demo` | PASS for the exact owner-approved inventory; not general rights clearance |

The20 QA cases are the relevant subset, **not** a claim that the whole97-case QA suite was rerun locally for this branch. Main CI must finish separately, and final visual integration needs its own full run. Initial audit tests, prior #265 tests and this branch's tests are not interchangeable evidence.

On this Mac's actual Apple M1 Pro / ANGLE Metal Chromium153,1440×900, three20-second peak-workload samples measured approximately60.02–60.04 renderer fps,16.7ms p95 frame interval, at most67 representative packets and20 advancing ticks. This is a current-build device-specific smoke, not a memory-profile proof or final Computer-3 performance guarantee. Three production restarts left zero canvases at title and one live renderer during play; no duplicate-clock symptoms were observed.

Verification limitations: isolated-file language-server output retained an existing `ImportMeta.env` diagnostic despite the canonical project compiler passing with `apps/web/src/env.d.ts`; no type suppression was added. Markdown has no configured language server. Test harness mistakes (initial production board role selector and initial dev editor URL) were corrected and rerun; those failed attempts are not counted as passing product tests. Audio was exercised at zero volume/muted; no subjective listening or physical haptics acceptance is claimed.

## Remaining P0

None observed in the audited demo path. This does not certify unmerged Computer-3 visuals or arbitrary backend deployments.

## Remaining P1 / release gates

- Merge and deploy the client boundary fixes before calling **this candidate** live. The currently deployed game remains vulnerable to malformed/stale API responses until then; its ordinary healthy path passed.
- Backend owner must provide authorized production replay-submission and persistence-after-restart evidence if judges are promised verified global submission. Computer1 intentionally made no public score writes or server restarts. Local score entry and graceful fallback passed separately.
- Final Computer-3 visuals must land, pass integration smoke, and produce fresh screenshots/video. Existing captures are not current final-art evidence.

## Submission checklist

- [x] Production build passes; critical unit and targeted browser tests pass.
- [x] Existing production deployment loads in a fresh session without redirect/fatal console errors.
- [x] New game, normal actions, event pressure, success/failure, score consistency and restart work.
- [x] Local score entry/persistence and configured-API graceful fallback work.
- [x] Public API health/read/preflight work from the actual frontend origin.
- [x] README pitch/local commands and existing architecture explanation distinguish represented Azure services from real infrastructure; simulation values are explicitly game assumptions.
- [x] Demo URL is `https://yeongseon.github.io/stack-and-survive/`.
- [x] Actual live core-loop rehearsal completed; real operation180s plus opening/review is disclosed.
- [ ] This readiness follow-up merged, exact SHA Quality passed, actual Pages deploy job succeeded.
- [ ] Final visual branch integrated and desktop checks repeated.
- [ ] Final screenshots/video refreshed after visual merge and linked in submission/README.
- [ ] Labeled2–3minute edited video assembled/rehearsed (or longer live demonstration budget approved).
- [ ] Backend owner confirms authorized production score submission/retry/persistence evidence.
- [ ] Human comprehension/game-feel/replay (#25/#195/#159), listening/device (#149), rights/legal (#164) and final submission approval recorded by their owners.

## Post-Visual-Merge Verification

After Computer3 lands, pin the exact final SHA and rerun:

1. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:release`, production/QA/Pages builds and the applicable approved demo asset inventory check. New image bytes require the appropriate provenance/approval; do not bypass the gate.
2. Full `pnpm test:player`, `pnpm test:browser`, `pnpm test:pages`; then performance smoke on the final rendered scene. Check real world hit targets/activation/delays with the visual owner, without rewriting the scene here.
3. Confirm exact-main Quality and the **actual deploy job** succeeded. Check canonical github.io URL, assets, refresh/404 recovery and API origin configuration.
4. Fresh browser: start → build → spike/bots → success/failure → leaderboard/fallback → restart → refresh. Recheck1920×1080,1440×900,1366×768; no clipped HUD/buttons/modal or unreadable score. Label scene findings **VISUAL MERGE FOLLOW-UP** for Computer3.
5. Rebuild captures from the final artifact with [SCREENSHOT_PLAN](SCREENSHOT_PLAN.md), rehearse [DEMO_SCRIPT](DEMO_SCRIPT.md) and [DEMO_FALLBACK](DEMO_FALLBACK.md), then obtain actual submission approval. Never label automation as a human participant or invent final-art approval.

No framework/dependency migration, cloud provisioning, visual-world edit, public score mutation or automatic merge is part of Computer1's follow-up. Broader README/authority cleanup is already in #265; reconcile its dated backend/domain statements rather than cherry-picking stale status as current fact.
