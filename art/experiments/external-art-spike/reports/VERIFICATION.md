# Executed verification

## PR #245 review follow-up

Four Copilot findings were reproduced and fixed without changing model, texture,
render or screenshot bytes. Five isolated regression cases failed before the
fix and pass afterward: colormap corruption, wrong overlay dimensions with
repinned hashes, stale screenshot hashes under optimized Python, wrong viewport
under optimized Python, and a controlled future acquisition clock.

`ART_ARCHIVE_DIR=/tmp/opencode node --test art/experiments/external-art-spike/source/regression.test.mjs art/experiments/external-art-spike/source/verify.mjs`
passes **9 tests** (five regressions plus four evidence checks). Selected Ruff
syntax/undefined-name checks also pass. Node child-test context is cleared so the
real child verifier executes rather than silently skipping nested test runners.

Acquisition now emits actual local verification time in `source/acquisition.json`
and candidate source records, explicitly not a network/license recheck. The
historical official license-page check remains 2026-09-16. The three colormap
archive-member hashes and byte counts are in `source/textures.json`. PNG signature,
IHDR and actual dimensions are checked, not inferred from layout metadata.
Protected-zone testing proves placement anchors only, not complete rendered bounds.

Below are the original prototype's historical validation results. Capture metrics
retain the original candidate-folder byte count; later provenance text additions
are not a rerender or a new image/performance measurement.

2026-09-16 UTC, isolated branch/worktree, Node22.22.0/pnpm10.32.1.

| Command / check | Result |
|---|---|
| `git fetch origin main` before any edits | Baseline7e2f145 obtained |
| `pnpm install --frozen-lockfile` | Passed, no lockfile edits; first systemNode24 warning avoided in subsequent Node22 runs |
| `pnpm exec playwright install chromium` | Passed |
| `uv run .../source/acquire.py /tmp/opencode` | Three ZIP hashes verified;15 GLBs extracted |
| Blender4.5.14 `--background --factory-startup --python .../source/blender/render.py` | Executed CyclesCPU real geometry render,2400×1350RGBA |
| `node .../source/capture.mjs` |18 final matched pairs; zero page errors; positive tick and intended states asserted |
| `uv run .../source/evidence.py` |18 side-by-sides,20-model upstream sheet, dimensions and screenshot hashes verified |
| `pnpm test:assets` |11 passed; includes intentional release-rights rejection test |
| `pnpm check:assets:demo` |Passed exact existing inventory; rights-pending warning retained |
| `pnpm check:assets:v3` |61 original V3 images/source/geometry verified |
| `pnpm typecheck` |Passed |
| `pnpm test` |338 tests /66 files passed |
| `pnpm lint` |Passed |
| `pnpm build` |Passed; existing large Phaser chunk warning |
| `git diff --exit-code` |Passed: no tracked baseline files changed |
| `node --test .../source/verify.mjs` |3 passed: source hashes,18 capture pairs/states/dimensions, bounded transparent render/layout |
| `node --check .../source/capture.mjs` |Passed syntax check |
| `uv run --with ruff ruff check --select E9,F63,F7,F82 .../source` |Passed selected syntax/undefined-name rules, not a full strict typecheck |
| LSP diagnostics on five new source files |Tool refused outside original request cwd (separate worktree); no zero-error LSP claim |

The capture harness was repaired before final evidence: pre-transform ordering,
production V3 versus dev legacy selection, correct canvas texture API, and waiting
for real operation rather than countdown. An initial four-minute capture command
timed out after11 pairs; a fresh ten-minute-budget run completed all18 and replaced
the partial metadata/captures. Earlier incorrect countdown images are not final evidence.

## Independent reviews

- Oracle integrity review: **PASS for honest Stage1 delivery**, source hashes,
  source isolation,18 matched pairs and disclosed QA limitations checked.
- Separate Oracle visual review: opened **all18 comparison boards**, **FAIL for
  integration / PASS for evidence honesty**. Local prop shading adds some depth,
  outweighed by style/scale mismatch and decorative density. No human game-feel,
  motion, hover or hardware-performance claim authorized.

These verdicts must not be paraphrased as visual integration approval. No Stage2.

## Concurrent work recheck

At completion fetch, `origin/main` advanced to
`f12c822` (#237), with #238 leaderboard correctness and #239 persistent storage/
production deployment configuration also merged. No open PRs were returned at
that recheck. This experiment stays pinned to starting main7e2f145; it does not
claim to capture those later revisions. Rebase/re-run before a future integration
or final human validation. No files in those concurrent changes were modified here.
