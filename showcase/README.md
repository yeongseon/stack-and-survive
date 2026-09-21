# Showcase — Why I built Stack & Survive

Before presenting, read [Current status](../docs/CURRENT_STATUS.md): main `c68ec0c` is deployed; API 0.4 support is blocked and Export/Microsoft Learn result links remain draft #316. This deck's image provenance stays historical even when accompanying status documentation is updated.

For the latest scaling interface and compact SQL, use the [53-second current-feature clip](../docs/DEMO_VIDEO.md#current-rules-04-the-bottleneck-tradeoff) as a separate optional demo. Existing slide screenshots remain historical; the new clip is a local candidate capture, not human validation. Allow an additional minute or replace part of the talk—do not promise a three-minute talk plus a full demo in the same slot.

**[Download the English PDF](stack-and-survive-showcase.pdf)** · [Browser slides](slides.html) · [English speaker notes](SPEAKER_NOTES.md) · [Play the game](https://yeongseon.github.io/stack-and-survive/)

Seven slides tell the story in plain English: **working in support → building a game → Black Friday → App/Cache/Edge → results → returning to documentation → closing**. The technical-architecture slide remains removed. Speaker notes include the main talk, a 60-second version, a short live-demo transition and Q&A.

This is a personal product motivation—not Microsoft's assessment of Microsoft Learn. The game is not official training, a replacement for documentation or a proven educational intervention. No identifying customer details, private cases or internal-system screenshots are used.

> Same workload. Different architectures. Different outcomes.<br>
> Build. Scale. Keep the business flowing.

## Open the slides

GitHub displays `slides.html` as source. Clone/download the repository and open it in a browser, or run this from the **repository root**:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/showcase/slides.html`. Keep the repository layout: images are referenced from `../docs/images/`. No external font, CDN or presentation framework is needed. Use loopback only and stop the optional server with Ctrl+C. Python is not a gameplay dependency.

| Control | Action |
|---|---|
| Left / Right, PageUp / PageDown | Previous / next slide |
| Home / End | First / last slide |
| Previous / Next buttons | Mouse, touch and keyboard navigation |
| Print / PDF | Print all slides in landscape |
| Download PDF | Save the included seven-page PDF |

The current slide appears in the URL as `#slide-3`. Without JavaScript, all slides appear in order. There is no autoplay, music or automatic fullscreen.

## PDF and regeneration

`stack-and-survive-showcase.pdf` contains **seven A4 landscape pages** with embedded images. It can be shared on its own. On GitHub, use the PDF viewer's download button to save the original file.

After changing content or styles, regenerate from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node showcase/export-pdf.mjs
node showcase/check.mjs
```

The exporter uses local HTML, fonts and images; it makes no gameplay/API requests. Manual browser printing also exports all seven slides. Disable browser headers/footers and enable background graphics when needed. Keep the PDF and slide source in sync.

## Timing and demo safety

- The English script targets **roughly 2:40–3:00**, not the Korean script's former 155-second budget. Actual human read-aloud timing has not been measured. Rehearse and trim rather than speaking faster.
- A whole game takes **180 seconds plus opening/result time**. Do not squeeze another full game into the talk. A 20–30-second live segment needs its own time allowance, including startup and switching back to slides.
- Recorded results and edited video must be labeled. The [published demo video and English transcript](../docs/DEMO_VIDEO.md) are a separate 120-second edit, not the seven-slide talk.
- If the API is unavailable, use local play and identify local scores honestly. Keep the [fallback guide](../docs/submission/DEMO_FALLBACK.md) available. Coordinate any production submission with the backend owner.
- Slide screenshots come from `24ca388` / rules 0.3; retain [their provenance](../docs/images/README.md). Current rules 0.4 scaling and onboarding are not shown in those captures. A local automated DEMO score is not a human participant or a public verified run. Read the [current handoff](../docs/submission/HACKATHON_HANDOFF.md), including the backend compatibility blocker, before promising global leaderboard availability.
- Human understanding, voluntary replay, listening/device and rights approval remain distinct from software tests. See [the tracker](https://github.com/yeongseon/stack-and-survive/issues/7).

## Before presenting

- [x] Automated 2026-09-19 UTC: all seven slides fit at 1920×1080, 1440×900, 1366×768 and 820×1180, without clipped captions or controls.
- [x] Automated: arrow keys, PageUp/PageDown, Home/End, direct slide URLs, local speaker-note/PDF links, image loading and no-JavaScript reading order pass (`node showcase/check.mjs`). External URL reachability and the exported PDF's page count are separate checks, not assertions in this script.
- [ ] The PDF has seven landscape pages with readable images and no clipped text.
- [ ] Time your actual spoken English, including slide changes and any optional demo, against the confirmed event limit.
- [ ] Recheck the public game/API on the day and prepare an honestly labeled fallback.

## Global submission handoff

Use [the English submission draft and checklist](../docs/submission/GLOBAL_SUBMISSION.md). The official global-event page, deadline/timezone, video limit and judging requirements have **not been provided or verified**. This deck is ready for review, but its length is not a claim of compliance with unknown event rules.

## Editing boundaries

`slides.html` owns the story, `slides.css` layout, and `slides.js` navigation. The notes follow the same seven-slide order. Gameplay, simulation, backend and screenshot sources are unchanged. Sharing these materials does not create a new license or imply Microsoft endorsement; review [rights status](../docs/LICENSING_STATUS.md) and the applicable submission terms.
