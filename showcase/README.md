# Why I built Stack & Survive

An eight-slide personal account of learning Azure: **motivation → learning gap → idea → experience → decisions → tradeoffs → reflection → goal**. The owner supplied the learning experience; the presentation does not invent customer stories, research results or education claims.

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
| Print / PDF | All eight A4 landscape pages |

Without JavaScript, all slides appear in order. There is no autoplay, excessive motion, external font or presentation library. The layout uses paper-like space, actual screenshots and short annotation-style questions. Source/build/production labels are deliberately absent from audience frames.

## One story for deck, video and notes

`slides.html` and `slides.css` own the visual story. `story.json` owns its eight spoken sections and their **120-second total**. `slides.js` handles navigation; `check.mjs` validates counts, bounds, navigation, print and forbidden audience labels. The video renderer screenshots the same deck, with navigation hidden, so it cannot drift into a separate product pitch. It does not modify or overwrite the underlying game screenshots.

```bash
node showcase/check.mjs
node showcase/export-pdf.mjs
# Prefer your own voice: eight files named slide-1.wav through slide-8.wav
node scripts/render-project-video.mjs --narration-dir=/absolute/path/to/recordings
# Or make an explicitly synthetic offline draft on macOS:
node scripts/render-project-video.mjs --voice
node scripts/check-project-media.mjs
```

Omit both audio flags for a silent version with selectable English subtitles and SRT. Own-voice files must fit each section with 0.3 seconds spare; the renderer rejects long recordings rather than cutting off or accelerating speech. Synthetic output uses installed Samantha at 155 words/minute; it is not the developer's voice. Its origin is disclosed in companion documentation and metadata, not as an internal on-screen banner. For an authentic final delivery, rehearse and record the speaker's own voice.

Render intermediates remain in a new ignored `test-results-submission/personal-story-*` folder for inspection; they are not uploaded and may be removed after reviewing the published files. The WAV-input path was exercised with silent test fixtures, not a human recording. Browser playback/decode tests cannot judge the human delivery or pronunciation.

## Timing

| Slide | Time | Purpose |
|---|---|---|
| 1 | 0:00–0:16 | Personal motivation; credit Microsoft Learn |
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

- [x] Eight slides fit 1920×1080, 1440×900, 1366×768 and 820×1180; navigation, images, local links, print bounds and no-JavaScript order pass.
- [x] Video uses the same source/imagery; exact 120 seconds, 3,000 frames, complete decode and browser playback/seeks checked by the media checker.
- [ ] Listen to the final narration; prefer the presenter's own voice and verify pronunciation/pacing.
- [ ] Check final PDF/video on the actual presentation device and confirm the event rules.
