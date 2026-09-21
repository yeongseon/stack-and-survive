# Why I built Stack & Survive

A brief **Stack & Survive title cover**, followed by eight personal story slides: **motivation → learning gap → idea → experience → decisions → tradeoffs → reflection → goal**. The owner supplied the learning experience; no customer stories or educational results are invented. PDF/browser: nine pages. Video: silent two-second cover, then unchanged approved GuyNeural speech; still 120 seconds total.

**[English PDF](stack-and-survive-showcase.pdf)** · [Browser slides](slides.html) · [Speaker notes](SPEAKER_NOTES.md) · [120-second video and transcript](../docs/DEMO_VIDEO.md#two-minute-project-introduction--current-source)

The story is simple: Microsoft Learn gave me the concepts. I wanted an easier way to experience how those concepts work together. The game is an additional experience, not a replacement for documentation or proven training. Agent implementation details are optional Q&A, not a main-story sales pitch.

## Present

Open `showcase/slides.html` locally with its relative images intact, or serve the repository on loopback:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/showcase/slides.html`; stop the temporary server when finished. GitHub displays HTML as source, while the PDF can be downloaded independently.

| Control | Action |
|---|---|
| Arrows / PageUp / PageDown | Previous or next slide |
| Home / End | First or last slide |
| Navigation buttons | Mouse, touch and keyboard operation |
| Print / PDF | Title cover + eight story slides: nine A4 landscape pages |

Without JavaScript, all slides appear in order. There is no autoplay, excessive motion, external font or presentation library. The personal story and simple annotations remain, with the owner's preferred earlier palette restored: dark navy, pale text, teal service names and warm yellow notes. No marketing cards, glow or gradients were restored. Source/build/production labels remain absent from audience frames.

## One story for deck, video and notes

`slides.html` and `slides.css` own the visual story. `story.json` owns the two-second silent cover plus eight spoken sections totaling another 118 seconds. The opening story allocation is 14 seconds; its approved 12.7-second speech fits without truncation or tempo changes. `slides.js` navigates explicit IDs (`#cover`, `#slide-1` through `#slide-8`), preserving existing story links. The same deck renders to video; underlying images are not modified.

```bash
node showcase/check.mjs
node showcase/export-pdf.mjs
# Prefer your own voice: eight files named slide-1.wav through slide-8.wav
node scripts/render-project-video.mjs --narration-dir=/absolute/path/to/recordings
# Basic offline fallback only (not the current published voice):
node scripts/render-project-video.mjs --voice
node scripts/check-project-media.mjs
```

The current video uses **Microsoft `en-US-GuyNeural`**, a stock neural English voice at its default rate/pitch, replacing basic macOS Samantha. [Listen to the first-slide sample](../docs/media/narration-sample.mp3). This is synthetic—not the developer's voice, a cloned voice or a guarantee of naturalness. The owner should judge the sample's pronunciation and tone; waveform/duration checks cannot do that.

Neural generation is an explicit network operation through the third-party `edge-tts` 7.2.7 media CLI. It sends the already-public narration to Microsoft Edge's online TTS service; it does not provision or configure Azure Speech. No application/runtime dependency is added. Confirm provider and event usage terms separately. [Reproduction instructions](../docs/DEMO_VIDEO.md#neural-narration-regeneration).

Omit both rendering audio options for a silent captioned version. Own-voice or generated WAV files must fit each section with 0.3 seconds spare; the renderer rejects long audio rather than truncating or accelerating it. Generated files include a source manifest with voice/text/WAV hashes so they cannot be labeled as a human recording. The offline `--voice` mode remains a basic fallback, not a silent fallback when neural generation fails.

Render intermediates remain in a new ignored `test-results-submission/personal-story-*` folder for inspection; they are not uploaded and may be removed after reviewing the published files. The WAV-input path was exercised with silent test fixtures, not a human recording. Browser playback/decode tests cannot judge the human delivery or pronunciation.

## Timing

| Slide | Time | Purpose |
|---|---|---|
| Cover | 0:00–0:02 | Stack & Survive — quiet project introduction |
| 1 | 0:02–0:16 | Personal motivation; credit Microsoft Learn |
| 2 | 0:16–0:32 | Definitions versus system behavior |
| 3 | 0:32–0:44 | “So I built this.” |
| 4 | 0:44–0:59 | A choice changes the system |
| 5 | 0:59–1:16 | “What would you change?” |
| 6 | 1:16–1:30 | Survival is not the whole question |
| 7 | 1:30–1:45 | Reflect, try again, return to Learn |
| 8 | 1:45–2:00 | A modest first-step goal |

Human read-aloud timing and listening remain to be checked. The video is a narrated **slide presentation**, not live or continuous gameplay. A full operation lasts 180 seconds; do not fit another whole run into this two-minute slot. The overload and result screenshots are different operations and are not represented as a before/after intervention.

## Evidence and limits (outside the audience deck)

Actual screenshots retain [source `a6f6956` provenance](../docs/images/README.md). The successful result is 9,473 points / 99.61% aggregate availability; background `$19.14/s` is last-tick lost sales, **not hourly infrastructure cost**. The game represents Application Gateway/WAF, not playable Front Door. The script avoids unsupported cost numbers and claims of optimal architecture.

AI code is merged, but live Azure model/operator acceptance remains #325. The main talk makes no AI promise; Q&A describes its implementation and limitations honestly. No human learning/replay result or rights approval follows from software tests. [Current status](../docs/CURRENT_STATUS.md) and [rights status](../docs/LICENSING_STATUS.md) remain separate. Official event criteria and submission approval must still be confirmed.

## Checks before sharing

- [x] Cover plus eight slides fit 1920×1080, 1440×900, 1366×768 and 820×1180; navigation, images, links, print and no-JavaScript order pass.
- [x] Video uses the same source/imagery; exact 120 seconds, 3,000 frames, complete decode and browser playback/seeks checked by the media checker.
- [ ] Listen to the final narration; prefer the presenter's own voice and verify pronunciation/pacing.
- [ ] Check final PDF/video on the actual presentation device and confirm the event rules.
