# Release checkpoint

Observed 2026-09-16 UTC (2026-09-17 KST). This is a dated handoff, not perpetual deployment status or final submission approval. Recheck before presenting.

## Merged and deployed client

- [PR #253](https://github.com/yeongseon/stack-and-survive/pull/253) is merged; main revision `9421e743678e9adc638fedda4331df7036e7f7aa` includes the client release work and merged backend test/storage follow-ups #257/#259.
- [Main Quality 35082909012](https://github.com/yeongseon/stack-and-survive/actions/runs/35082909012) succeeded for that revision.
- [Pages 35087298580](https://github.com/yeongseon/stack-and-survive/actions/runs/35087298580) ran both build and deploy successfully for the same revision; the deploy job was not skipped.
- Entry: <https://yeongseon.github.io/stack-and-survive/>. A fresh headless Chromium browser resolved to `https://yeongseon.dev/stack-and-survive/`, returned200 and showed the updated title and introduction. Settings opened with sound, volume, vibration, guide and fullscreen controls; this interaction produced no console errors or failed requests. No audio was enabled or judged.
- Earlier Cache activation/Pause/reload/404 smoke is recorded in [the completed release update](https://github.com/yeongseon/stack-and-survive/issues/7#issuecomment-5696372342); it is not relabeled as newly rerun evidence.

## Current blocker: backend-owned #260

[Issue #260](https://github.com/yeongseon/stack-and-survive/issues/260) remains open and was reproduced in a fresh browser. Reading `/api/leaderboard?challenge=fnv1a64%3A94c60ed35e117b48` from the resolved `https://yeongseon.dev` origin failed with a CORS error: no `Access-Control-Allow-Origin` response header.

Read-only health returned200 and `status: ok`, `storage: file`. An OPTIONS request for POST with `Content-Type` returned204, but also lacked `Access-Control-Allow-Origin`. Neither status proves successful browser access, replay verification or storage durability across restart. No public score was submitted and no backend configuration, DNS or account setting was changed.

Backend owner next steps: narrowly allow the approved actual frontend origin(s), check allowed/disallowed GET and preflight behavior, verify the browser leaderboard read, then perform a separately authorized test submission and persistence check with explicit test-data handling. Do not use wildcard CORS or claim global rankings are working based on health alone. Local gameplay remains the fallback.

At the follow-up review, backend PR #261 was open for this fix and operational checks. Client presentation work does not edit those files or treat an open PR as a deployed fix. Separately, environment PR #245 is now Iteration04 awaiting owner visual review; it must not be automatically merged or imported into runtime.

## Existing capture pack

Local ignored directory: `test-results-submission/2026-09-16T08-43-11.408Z/`. These are not public artifact URLs.

- `capture-manifest.json`: `status: complete`, `errors: []`, clean source `c09f7f3f421c2e52070a57c14199feaebeb15fbe`, production wall-clock ticks with no state injection/time acceleration.
- HTML SHA-256: `98a0f3244a6a02dd5a9d90a767ccef39123243c3a4eedaff3659c66fc643f06b`; entry-bundle hashes are in the manifest.
- Sixteen milestones, result9473/10000 and `actual-run.json`; a separate no-action overload run was paused, not completed or submitted.
- The manifest is explicitly local-board-only and automated, not a participant session. Its source predates the merged-main SHA above; do not describe it as a capture of the deployed Pages artifact.

Use [the screenshot plan](SCREENSHOT_PLAN.md) to reproduce captures when needed. A capture pack does not mean a video was recorded or a submission was sent.

## Local game-presentation follow-up (not deployed)

After this checkpoint the owner requested further game-like presentation without colliding with parallel work. The local follow-up adds a compact mission clock, current observed traffic phase, duration-proportional progress segments and the existing consecutive-loss interruption countdown. It changes no simulation rule, action timing, camera behavior, art inventory or backend operation. Current-phase text follows the processed snapshot (runtime elapsed time points to the next tick), so it agrees with visible demand. Pause/error stop emphasis; reduced motion removes the arrival animation. Countdown values are outside live announcements.

Local evidence: lint/typecheck and364 unit tests passed with no skips; production player tests18/18 passed in two isolated runs (14 mission/lifecycle/layout/visual cases and4 long leaderboard/readiness cases). The first all-in-one baseline player run exceeded the tool's10-minute limit and is not counted as a successful full run. Production/QA/Pages builds passed with existing chunk-size/dynamic-import warnings. General `check:assets:release` still fails intentionally for pending rights; demo inventory,11 asset tests and7 original-art tests passed.

Final integrated validation also passed all97 QA cases in sequential33/32/32 shards and3 Pages cases. No assertions, timeouts or skipped tests were relaxed. Markdown has no configured language server in this environment; documentation was checked by direct reads, diff checks and independent review rather than reporting nonexistent Markdown LSP coverage.

Current follow-up screenshots are ignored under `test-results-player-mission/`, including `mission-status-mission-pro-45b51-reezes-on-pause-at-1440x900/mission-spike.png` and667/844 landscape opening captures. These are local automated evidence, not deployed visuals, participant acceptance or a new video. Prior capture-pack hashes above describe only their original artifacts.

## Remaining acceptance and owners

| Item | Required evidence / owner |
|---|---|
| #25 / #195 / #159 | Actual unfamiliar participant; separate verbatim comprehension, game-feel and unprompted replay observations using [the worksheet](HUMAN_TEST_SCRIPT.md) |
| #149 | Actual listening and supported-device haptic checks; unsupported hardware explicitly recorded |
| #164 | Owner decisions on code/art licenses, Azure terms, employer/IP and Hackathon/public-distribution conditions |
| Demo recording / rehearsal | Actual labeled two-minute edit and fallback rehearsal, followed by final submission review |
| Social previews / native zoom | Actual platform card rendering and browser-chrome zoom observations; static metadata/equivalent CSS viewports are not substitutes |

Completed camera/V3/gameplay/Settings work must not be reopened merely because older plans list it as pending. #151's missing historical baseline and #132/#160–#163 are closed not planned. No new mechanics, art pack, cloud provisioning or fabricated human acceptance is authorized by this handoff.
