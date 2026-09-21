# Current demo screenshot provenance

These are actual ordinary-player captures from merged source **`a6f69560d063ae1454c12edc0532bbfc93424679`**, rules 0.4, captured **2026-09-21T08:40:19.355Z**. The production build was local with `VITE_LEADERBOARD_API` empty; this is not a capture of the hosted Pages artifact. The runtime source was clean; the working tree contained media tooling/doc changes (`dirtyTree: true`). [Machine-readable manifest](capture-manifest.json) records build hashes, raw-frame hashes, derivative hashes and actual HUD observations.

- 19 images: `title`, `opening`, `construction`, `cache`, `app-scaling`, `warning`, `spike`, `edge`, `gameplay`, `recovery`, `sql-scaling`, `final-wave`, `join`, `learn`, `result`, `landscape-result`, `overload`, `pause`, `settings`.
- Originals are 1440×900 except `landscape-result` at 844×390. Chromium Canvas converts them to WebP within 1200×750, preserving aspect ratio without cropping, compositing or altering UI values.
- The successful operation really completed 180 seconds with **9,473 points and 99.61% aggregate availability** (raw ratio `0.996147577584282`). The background HUD at the final tick reads 99.5% for that tick; it is not the full-run aggregate displayed on the report. The manifest keeps both separately. `DEMO` is an automation label, not a participant or public verified submission.
- `overload`, `pause` and `settings` come from a **separate no-action operation**, not the successful architecture. No state injection, accelerated ticks or external score submission occurred.
- `learn` shows actual curated Microsoft Learn links. AI was unconfigured, so no model output or Export success is shown or fabricated.
- Raw recording and frames: ignored `test-results-submission/current-2026-09-21T08-40-19.305Z/`. The folder timestamp was allocated immediately before manifest `capturedAt` (`08:40:19.355Z`), so the 50ms difference is expected, not a different capture. The manifest records `captureDirectory` explicitly. Raw actual-run SHA256 is recorded; raw files are not public artifact URLs.

Reproduce with `node scripts/capture-current-media.mjs`, then `node scripts/publish-current-images.mjs <complete-capture-directory>`. Inspect frames/provenance before committing. The personal-presentation video renderer now consumes the existing verified image pack rather than replacing it; rebuild PDF/video after image changes. Runtime assets are not modified. Previous screenshots remain in Git history; historical gameplay MP4s retain their original provenance.

Screenshots are derived documentation media, not new runtime artwork or a broader license grant. Existing [rights limitations](../LICENSING_STATUS.md) and [Azure/project attribution](../../apps/web/public/assets/ATTRIBUTION.md) still apply.
