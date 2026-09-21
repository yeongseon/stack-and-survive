# Hackathon handoff — 2026-09-19 UTC

## Personal-story redesign — #328

The current presentation is now eight English slides and a matching 120-second narrated slide video: the owner's Azure learning experience, the gap between definitions and behavior, the game, decisions, consequences, reflection and a modest first-step goal. It is not a product launch or live agent demo. Internal production/capture/editing labels are removed from audience frames; provenance stays in files. Presenter-recorded per-slide WAVs are supported and preferred; supplied audio is a disclosed synthetic draft. Older media/layout notes below are historical. [Current presentation](../../showcase/README.md).

## Latest material refresh — source a6f6956

#326 refreshes 19 walkthrough/deck images, rebuilds the seven-page PDF, and adds an exact 120-second introduction with synthetic English narration, captions, real gameplay excerpts, agent-design explanation and closing. [Video/transcript/provenance](../DEMO_VIDEO.md#two-minute-project-introduction--current-source). Notes below preserve older versions. Export/Agent code is merged; activation is separately gated in #325. No live model, hosted-artifact capture or human listening approval is claimed.

## Current authority — 2026-09-21

Use [Current status](../CURRENT_STATUS.md): deployed `c68ec0c`, exact-main Quality 35517501080 and actual Pages build/deploy 35522927900 passed. #318/#319 delivered service-guide wording, inspector bounds, current-feature clip and participant preparation. Dated updates below retain their own source/counts, not today's backlog. Export/Learn draft #316 is not deployed; API #306 and human/audio/rights/event gates remain open.

## Update — 2026-09-20 UTC

Latest verified released runtime at this update: **`4c3e1e7` (#312)**. Exact-main [Quality 35482554523](https://github.com/yeongseon/stack-and-survive/actions/runs/35482554523) and actual Pages [build + deploy 35486222214](https://github.com/yeongseon/stack-and-survive/actions/runs/35486222214) passed. Public pointer checks verified App 1→2→1 and App/SQL tier 1→2, with zero page errors and no public score POST. There are 672 passing unit tests at that checkpoint. #307/#308/#311 and PRs #309/#310/#312 are delivered; their old pending statements below are historical.

**New presentation evidence:** [53.4-second rules 0.4 bottleneck clip and transcript](../DEMO_VIDEO.md#current-rules-04-the-bottleneck-tradeoff), recorded from candidate `ff93cd6` (the deployed source plus #314 inspector layout correction). It shows actual 260 req/s demand, SQL reads 116%→69%, current-tick availability 89.2%→100%, losses $56/s→$0/s and the higher SQL cost. The local capture is not deployment or human acceptance; its manifest discloses source and workspace state. Use it to explain one tradeoff, not as evidence of completing a full operation.

The existing 120-second video and slide screenshots remain explicitly historical. Use the [blank cohort summary](HUMAN_TEST_SUMMARY.md) after real participant observations; no participant data or learning claim has been added. Current API #306 was rechecked and still returns 400 `Unsupported challenge`. Rights, actual listening, official event criteria and final submission remain unresolved. The September 19 checkpoint below is retained, not silently rewritten as current evidence.

**Software and presentation preparation, not completed event submission or human acceptance.** This checkpoint supersedes older pending-merge statements, not their historical evidence. Live status can change: verify the exact commit and actual deploy job before presenting.

## Judge-facing materials

- [Play](https://yeongseon.github.io/stack-and-survive/)
- [Repository](https://github.com/yeongseon/stack-and-survive)
- [English PDF — direct download](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/showcase/stack-and-survive-showcase.pdf)
- [Seven-slide deck and local instructions](../../showcase/README.md)
- [English speaker notes, 60-second version and Q&A](../../showcase/SPEAKER_NOTES.md)
- [120-second MP4 — direct download](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)
- [Video transcript and exact provenance](../DEMO_VIDEO.md)
- [Submission-form English draft](GLOBAL_SUBMISSION.md)

The MP4 has been published in the repository since #286; it is not only a local artifact. It is silent, edited footage from two real automated ordinary-player runs of `24ca388` / rules 0.3. Its SHA256 is `0ba01d4aa201919ee2fa11f62e338c9d30ce25902ad373bf31a3400c1a5815a2`. Existing screenshots and the deck use that historical release. Do not describe them as the current rules 0.4 interface or human playtesting. [Newer scaling captures](../INFRASTRUCTURE_SCALING.md#captured-scenes) have their own provenance.

## Integrated software checkpoint

- #294 merged as `0d39d82315dd64a1dbb51b4560783afea6592dbe`; both actual review threads are resolved. Its exact head `5cea814` passed [full Quality 35399017896](https://github.com/yeongseon/stack-and-survive/actions/runs/35399017896).
- Integrated local Node 22.22.0 / pnpm 10.32.1: lint, typecheck, **667 unit tests**, production build and backend bundle passed. Four real-time onboarding journeys passed at 1440×900, 1920×1080, 1366×768 and 844×390 (reduced motion on the last).
- Merged-main [Quality 35453839381](https://github.com/yeongseon/stack-and-survive/actions/runs/35453839381) was still running at this checkpoint. Do not label #294 deployed until its actual Pages deploy job succeeds.
- Previous successful Pages run: [35397150239](https://github.com/yeongseon/stack-and-survive/actions/runs/35397150239), source `8c42145`. This is separate from the locally tested candidate.
- Rules 0.4 include App scale-out/in and tiers, SQL tiers/read replicas, version-separated history and compatible replay code. See [the numerical contract](../INFRASTRUCTURE_SCALING.md). New onboarding does not change those rules.
- Presentation checks pass at three desktop widths for all seven slides, keyboard/button navigation, images, local links, print bounds and no-JavaScript order. PDF regenerated as seven A4 landscape pages. These are automation checks, not timed spoken rehearsal or physical-projector validation.

## P0 production blocker: #306

Read-only requests to the configured API `https://stack-survive-mcaps-ychoe.azurewebsites.net` returned:

| Request | Observed result |
|---|---|
| Health | 200, file storage; no deployed build identity returned |
| Current 0.4 hash `fnv1a64:429acdb090861edf` | 400, `Unsupported challenge` |
| Legacy 0.3 hash `fnv1a64:94c60ed35e117b48` | 200, previous verified entries |
| Allowed-origin response | `Access-Control-Allow-Origin: https://yeongseon.github.io` |

The compatible backend code is merged, but that does not deploy it. Existing App Service is running Node 22, one worker, `node server.js`, file storage `/home/data/leaderboard.json`. Both standard CLI and Entra-authenticated deployment-metadata access returned 403. No access control was weakened, cloud configuration changed, process restarted or public score posted. **Backend owner action:** deploy the compatible bundle through the authorized path, preserve storage/settings, record source identity and verify both generations. Keep [#306](https://github.com/yeongseon/stack-and-survive/issues/306) open until actual evidence exists.

Until then, present local gameplay/results honestly; do not promise a current verified global submission. The existing historical global rows are not current-run evidence. Restart durability also remains unverified: 34-hour retention is not a recorded restart event.

## Presenter runbook

1. Download PDF and MP4 before the event. Open the game once and check the actual URL, rendering and audio settings. Use no saved player name for rehearsals to avoid automatic public score submissions.
2. Use the seven-slide English talk (estimated 2:40–3:00; not measured human delivery). Keep technical details in Q&A.
3. If an additional 20–30 seconds is available, Start → point out Next/Funds → request one construction → wait for activation → Pause. A full operation takes 180 seconds plus startup/results; it cannot fit as an additional continuous run inside a two-minute video.
4. If networking/rendering fails, switch to the downloaded, explicitly historical edited recording. Do not describe a still, pause or prerecorded result as live.
5. Follow [recovery instructions](DEMO_FALLBACK.md). Do not reset public data or use QA tick injection to manufacture a successful demonstration.

## Gates that need real people or external authority

| Gate | Record required | Status |
|---|---|---|
| #25 comprehension | Consented unfamiliar participant, exact build, raw actions/answers and assistance | Not performed here |
| #195 / #186 game feel/navigation | Unprompted first impression, traffic/action/camera understanding | Not performed here |
| #159 / #152 replay | Observe voluntary second run before asking; record declined/prompted honestly | Not performed here |
| #149 sound/device | Actual listening, volume/mute/pause and supported physical vibration | Not performed here |
| #164 rights | Explicit code/art license, Azure terms, employer/IP/event decisions | Not approved here |
| Event form | Official URL, deadline/timezone, eligibility, field/video limits, approval and confirmation | Not supplied / not submitted |

Use [the participant worksheet](HUMAN_TEST_SCRIPT.md), [audio checklist](../AUDIO_FEEDBACK.md) and [rights decisions](../LICENSING_STATUS.md). Public source visibility does not select a license. Secret scanning/push protection were enabled and open alerts numbered zero at this check; that is not proof all secrets are absent.

Owner-requested game-feel follow-up is separately tracked in [#307](https://github.com/yeongseon/stack-and-survive/issues/307), after release triage and presentation packaging [#308](https://github.com/yeongseon/stack-and-survive/issues/308). Do not close human gates merely because software or presentation work is delivered.
