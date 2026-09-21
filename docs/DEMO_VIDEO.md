# Stack & Survive — demo video

## Two-minute project introduction — current source

[![Learning Azure for the first time felt overwhelming.](media/project-introduction-preview.jpg)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/project-introduction-120s.mp4)

**[Watch/download the new project introduction (MP4, exactly 2:00)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/project-introduction-120s.mp4)** · [English transcript](media/PROJECT_INTRO_NARRATION.md) · [English SRT](media/project-introduction-120s.srt) · [Edit/provenance manifest](media/project-introduction-120s.json)

The video begins with a quiet **two-second Stack & Survive title cover**, then the same eight personal story slides: motivation → learning gap → idea → experience → decisions → tradeoffs → reflection → goal. It credits Microsoft Learn, not a replacement or proven education product. No feature-card pitch, AI segment, animated counter or marketing CTA. Nine PDF/browser pages; exactly 120 seconds.

The video is a narrated slide presentation with real screenshots, **not moving/live gameplay or one continuous run**. Screenshots retain source `a6f6956` and their original manifest. The 180-second result really scored 9,473 / 99.61% availability; the overload example is a different run. The deck does not invent hourly cost or mislabel lost sales. All internal capture/source/production/editing banners were removed from the audience deck and new video; provenance stays here and in the JSON manifest.

| Time | Content |
|---|---|
| 0:00–0:02 | Stack & Survive title cover; silence |
| 0:02–0:16 | My first experience learning Azure; Microsoft Learn gave me concepts |
| 0:16–0:32 | I knew the services, but not how they behaved together |
| 0:32–0:44 | “So I built this.” — one large real screenshot |
| 0:44–0:59 | Change the architecture and observe availability/cost |
| 0:59–1:16 | “What would you change?” — find the layer under pressure |
| 1:16–1:30 | “It survived. But was it a good architecture?” |
| 1:30–1:45 | Reflect, try again, return to Microsoft Learn |
| 1:45–2:00 | Make the first step into Azure easier |

Current audio is **stock neural English `en-US-GuyNeural` at default rate and pitch**, replacing the basic macOS Samantha version after owner feedback. **[Listen to the opening sample](media/narration-sample.mp3)** before downloading the full video. It is synthetic—not the developer, voice cloning or proof of a human performance. Voice selection is not a claim of independently measured popularity or guaranteed naturalness. No music, game audio or dramatic transitions are added. English captions remain selectable and available as SRT; sentence timing is approximate, not forced-aligned. Audio provenance stays in companion files. Human listening, pronunciation, provider/voice rights and event review remain separate.

The new video has 3,000 frames at 25fps, **1440×900**, H.264/AAC, and a 120.000s video/audio duration. Exact bytes, source hashes and audio origin are in the manifest. It intentionally replaces the previous overly mechanical introduction at the same URL; that version remains in Git history. Historical technical recordings below are separate evidence, not the final presentation.

### Automatic regeneration

```bash
pnpm install --frozen-lockfile
node showcase/check.mjs
node showcase/export-pdf.mjs
# Best: record slide-1.wav through slide-8.wav in your own voice
node scripts/render-project-video.mjs --narration-dir=/absolute/path/to/recordings
# Basic offline fallback only, not the current published neural voice
node scripts/render-project-video.mjs --voice
node scripts/check-project-media.mjs
```

`showcase/story.json` owns narration and timings; the renderer uses `slides.html`/CSS directly, hides navigation and rejects forbidden visible production/marketing labels. It preserves the existing screenshot pack and its provenance rather than re-encoding images. With neither audio option, output is silent with transcript/SRT/selectable subtitles. FFmpeg/ffprobe and Chromium are required. Rendering existing WAVs is local; the separately opted-in neural generator below uses network speech. No application/runtime dependency is added. Regenerating raw screenshots is a separate task, not a side effect of rendering this talk.

### Neural narration regeneration

The owner-approved GuyNeural audio was reused **byte for byte** for the cover update. `node scripts/retime-neural-narration.mjs <approved-narration-directory>` verifies unchanged text/WAV hashes and new duration limits, copies the recordings to a fresh output folder and records both prior/current story hashes. It does not call a voice provider, alter audio tempo or relabel changed words. Then render with `--narration-dir=<printed-output-directory>`. The two-second cover is silent; the first spoken section now starts at 0:02.

This is **not offline synthesis**. With explicit `--allow-network`, only the public `showcase/story.json` narration is sent to Microsoft Edge's online TTS service using the third-party [edge-tts](https://github.com/rany2/edge-tts) CLI, pinned to 7.2.7. No Azure account/resource/key is created or configured, and no npm/application dependency changes. Network availability, service behavior and applicable provider terms are outside this repository's guarantees.

```bash
python3 -m venv test-results-submission/neural-tts-env
test-results-submission/neural-tts-env/bin/python -m pip install edge-tts==7.2.7
node scripts/generate-neural-narration.mjs --allow-network --cli=/absolute/path/to/neural-tts-env/bin/edge-tts
# Use the generated output path printed by the command above:
node scripts/render-project-video.mjs --narration-dir=/absolute/path/to/neural-narration-output
node scripts/check-project-media.mjs
```

The generator preserves default `+0%` rate / `+0Hz` pitch. It fails if a segment does not fit—shorten the script or adjust slide allocations, not the audio playback speed. The source manifest binds voice/provider/version, full story, individual text and WAV hashes. Render checks that manifest and discloses neural generation in the video manifest/transcript. The sample is the same first-slide audio, normalized like the full track. Individual source audio stays in ignored local folders; only final video/sample/provenance are published. A missing/blocked neural service does not silently fall back to Samantha. Confirm terms and listen before submission.

Each render uses a fresh ignored output folder. The manifest binds deck/story/image hashes to the video, records the toolchain and audio origin, and lets the checker reject an out-of-date video. This is workflow reproducibility, not cross-platform byte identity or signed provenance. Human pacing and subtitle alignment still need review.

[Current status](CURRENT_STATUS.md) distinguishes confirmed hosted releases, local recording sources and merged-but-unactivated AI code. Older videos below retain their original `ff93cd6` and `24ca388` local recordings; neither was overwritten by the new introduction.

[Back to README](../README.md) · [Play the game](https://yeongseon.github.io/stack-and-survive/)

## Current rules 0.4: the bottleneck tradeoff

[![SQL bottleneck on the current scaling interface](media/scaling-tradeoff-preview.jpg)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/scaling-tradeoff.mp4)

**[Watch the 53.4-second current-feature clip](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/scaling-tradeoff.mp4)** · [machine-readable provenance](media/scaling-tradeoff.json)

One continuous, unaccelerated local production recording from runtime source `ff93cd6` (released `4c3e1e7` plus the inspector-boundary fix). Automated ordinary-player controls; no state injection, player name or public score submission. Silent H.264, 1440×1000, 25fps, 53.4 seconds; full-file decode verified. The 1440×900 game is preserved above a provenance footer. Final inspection is **paused**, not a completed 180-second run. This recording proves the observed game behavior, not human learning, real Azure performance or deployment status.

| Approximate clip time | Actual observation | Suggested spoken English |
|---|---|---|
| 0–9s | Title, countdown, compact Tier 1 SQL | “Infrastructure decisions are easier to understand when you can see their consequences.” |
| 9–18s | App scale-out request and real activation delay | “I add another App machine. More capacity arrives after construction, not immediately.” |
| 18–34s | SQL inspection; demand rises to 260 req/s | “The App now has enough capacity, but SQL reads are at 116%. Availability falls to 89.2%, losing 56 simulated dollars per second.” |
| 34–47s | SQL tier upgrade requested; old capacity remains during the delay | “More App machines won't fix this database bottleneck. I scale up SQL and wait for the change to take effect.” |
| 47–53.4s | Same 260 req/s, SQL reads 69%, availability 100%, losses zero; final inspection paused | “The same workload now recovers. But SQL running cost rises from 12 to 22 thousand simulated dollars per minute. The game is about the right tradeoff—not building everything.” |

The suggested narration is a descriptive transcript, not a timed human read-aloud. Shorten it for a live delivery. These are current tick values, not full-run averages. Cache or a read replica can be other choices for a read bottleneck; this clip does not establish SQL tier-up as optimal. Counts, prices and delays are game abstractions, not Azure pricing or benchmarks.

- MP4 SHA256: `20ea612ee3a540a086a07f8a470a78d1a6ae851f662d6c0c65974682bf043dfd`.
- Captured 2026-09-20 UTC; workspace contained uncommitted capture/docs work, disclosed as `dirtyTree: true`. Runtime source was committed; JS/CSS hashes and raw observations are in the manifest. Raw files remain under ignored `test-results-submission/`.
- Reproduce: `pnpm build`, then `node scripts/capture-tradeoff.mjs`. Requires FFmpeg/ffprobe and installed Chromium. Inspect frames, then run `node scripts/publish-tradeoff.mjs <successful capture directory>`. Publishing here means copying verified files into the repository, not deploying or submitting to an event.
- Current global API compatibility remains blocked in #306. This clip makes no leaderboard-success claim.

## Historical two-minute overview — rules 0.3

[![Open the gameplay video](media/demo-preview.jpg)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)

**[Watch / download MP4](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)** · [Repository file](media/stack-and-survive-demo.mp4)

GitHub Markdown does not reliably provide an inline player for a committed MP4. Click the preview or video link to open the file; if the browser downloads it, play it locally. The video is not loaded by the game, so it does not increase gameplay asset downloads.

## What the video shows

**Historical demonstration:** this video records `24ca388` / rules 0.3. The current game adds rules 0.4 infrastructure scaling and newer onboarding; this recording does not verify those features or the current backend. See the [current handoff](submission/HACKATHON_HANDOFF.md) and [scaling captures](INFRASTRUCTURE_SCALING.md#captured-scenes).

This is a **120-second, silent, edited demonstration of two actual ordinary-player runs**, including both success and failure. Run A deliberately makes no upgrades, reaches service interruption, and restarts. Run B is a separate recording with App, Cache and Edge construction and a real completed result. The transition between recordings is labeled; it is not presented as one continuous attempt. Moving clips remain at original speed. The title (8 seconds) and local-fallback ending (12 seconds) are labeled actual screenshots from Run B. All footage uses the same public Pages build, not an editor or mockup.

| Time | Picture | Suggested English narration / descriptive transcript |
|---|---|---|
| 0:00–0:08 | Actual title screenshot | “Same workload. Different architectures. Different outcomes.” |
| 0:08–0:23 | Run A: normal traffic, no upgrades | “One App instance handles the opening traffic. The money represents simulated business value, not real Azure prices.” |
| 0:23–0:33 | Run A: overload and service risk | “Demand rises, availability falls, and sales are lost. If this continues, the service will stop.” |
| 0:33–0:43 | Run A: actual failure, score 810 | “Without upgrades, this run failed at 45 seconds. The result explains what went wrong.” |
| 0:43–0:51 | Run A: Play again and fresh start | “After failure, start again with fresh infrastructure.” |
| 0:51–1:10 | Run B: separately recorded construction | “This is a different, separately recorded run. We prepare App, Cache and Edge ahead of demand, then wait for construction to complete. Capacity is not instant.” |
| 1:10–1:30 | Run B: customer spike and bot attack | “Cache helps eligible reads. Edge filters bots but can also reject legitimate traffic. We have to balance processing capacity, running costs and customer losses rather than simply building more.” |
| 1:30–1:40 | Run B: real completion, score 9454 | “This run completed all 180 seconds. Review availability, costs and the final score.” |
| 1:40–1:48 | Player Name and existing global rows | “These global rows are earlier verified runs, not a submission of this recorded run.” |
| 1:48–2:00 | Actual local-fallback screenshot after browser API block | “Here the browser API requests were blocked deliberately. The local score remains, while pending verification and retry are shown separately.” |

The transcript is suggested narration, **not an audio track**. On-screen labels identify edited gameplay, the title still and the existing-global-score limitation. Narration and any actual listening/haptic acceptance remain separate.

## Recording identity and verification

| Property | Value |
|---|---|
| Released source / Pages SHA | `24ca38805015cf87de710cb2ce9ffa5904ffc14f` |
| Run A capture started | 2026-09-18T00:16:41.977Z |
| Run B capture started | 2026-09-17T19:48:52.611Z |
| Public game | https://yeongseon.github.io/stack-and-survive/ |
| Browser | Chromium153.0.8010.12, automated ordinary-player inputs |
| Source recordings | Run A: real failure at game time45s and retry; Run B:239.48seconds including real180second completion and result interaction |
| MP4 | H.264,1440×900,25fps,120.000seconds; no audio stream |
| File size | 6,160,277 bytes (about 5.9 MiB) |
| MP4 SHA256 | `0ba01d4aa201919ee2fa11f62e338c9d30ce25902ad373bf31a3400c1a5815a2` |
| Run A raw SHA256 | `dbcb82b3ea769d6d77e253da55b12719c96bda76024957e38a27d5fc7f70e213` |
| Run B raw SHA256 | `dbfa723433fb08c25ea59309fd144795f871f0fad4e2814d49b623e440a79d3f` |
| Title still SHA256 | `38ac281c29c81202622e2573ea7f2597e1331ac0f25e59b4bbbee1ee7bff937b` |

The MP4 is encoded with `faststart` for browser delivery. Full-file FFmpeg decode and ffprobe duration/codec checks succeeded. This verifies decoding, not human acceptance or all-device playback. The preview is extracted from the video at 78 seconds.

### Edit provenance

Output uses: title still 8s; Run A video12–27s,36–46s,54–64s,64–72s; Run B video20–39s,42–52s,106–116s,216–226s,226–234s; Run B local-fallback screenshot held12s. Both manifests have the same captured HTML hash `318700c1d44d0a13c7da4ead0fee7fb8a9f215e9b05c4c92008404c7baa75b37`. The server board changed between recordings; rows are observed at their respective capture times, not a fixed shared score fixture. Raw recordings and manifests are retained in PC3 evidence, not loaded by the game.

## Demonstration boundaries

- No injected score, accelerated simulation or invented participant. Automation drove real player controls.
- Existing server rows were read successfully. Before saving YS, the capture runner deliberately aborted API requests in its browser context to demonstrate local fallback. That is not evidence of a successful public submission for this run.
- The visible results and server board are different: Run A failed with810; Run B completed with9454. The displayed global entries belong to previously verified server runs. Neither run was publicly submitted by this capture.
- This video does not establish unfamiliar-player comprehension, voluntary replay, listening, physical vibration or rights clearance.
- Recording a released demo does not grant broader reuse rights. See [licensing status](LICENSING_STATUS.md), [asset attribution](../apps/web/public/assets/ATTRIBUTION.md) and the [demo exception](PAGES_DEMO_EXCEPTION.md).

For presentation fallback, download the MP4 before the event. For a live demonstration, use the game link. See the [demo fallback guide](submission/DEMO_FALLBACK.md) and [submission checklist](submission/README.md).
