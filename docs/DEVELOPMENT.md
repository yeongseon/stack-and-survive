# Development guide

[README](../README.md) · [Illustrated player guide](PLAYER_GUIDE.md) · [Contributing](../CONTRIBUTING.md) · [Technical design](TECHNICAL_DESIGN.md)

Run commands from the repository root unless a command explicitly selects a workspace package.

## Prerequisites

- Node.js **22**, satisfying `>=22.12.0 <23` (reference: 22.22.0).
- pnpm **10.32.1**, matching `packageManager` in [package.json](../package.json).
- Git. Chromium is needed for browser tests; an Azure account is **not** needed for the game.

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
```

Use the committed lockfile. Do not switch package managers or update dependencies merely to get started.

## Choose the right application mode

| Goal | Command | Open / output |
|---|---|---|
| Player UI with hot reload | `pnpm dev` | Printed origin with `/?tycoon` appended |
| QA/editor with hot reload | `pnpm dev` | Printed root URL |
| Ordinary production game | `pnpm build` then the preview command below | `apps/web/dist` |
| QA browser regressions | `pnpm build:qa` then `pnpm test:browser` | `apps/web/dist-qa`; inspector enabled |
| Project-path Pages verification | `pnpm build:pages` then `pnpm test:pages` | `apps/web/dist-pages`, `/stack-and-survive/` base |

```bash
pnpm build
pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1
```

For this ordinary production build, open the printed root URL **`/` without `?tycoon`**: it renders the player title. The `/?tycoon` selector is needed for the player surface in development/QA, not ordinary production. Use the printed URL instead of assuming a port. A preview serves an existing build; rerun the build after source changes. Stop interactive development/preview servers with Ctrl+C.

The development root is intentionally the QA/editor. Seeing it is not a broken player build. Production always selects ordinary gameplay: adding QA query parameters cannot enable inspector/manual-step APIs. **Never deploy `dist-qa` or a development server.**

![Production player view, distinct from the development QA editor.](images/opening.webp)

The image above is an actual production capture, not an editor screenshot. The [player guide](PLAYER_GUIDE.md) describes the UI you should see at `/?tycoon` during development or `/` in production.

## Workspace map and change boundaries

```text
apps/web/                 React player UI, Phaser integration, local state
apps/leaderboard-api/     Optional server replay verification
packages/schema/         Shared validation and types
packages/cloud-domain/   Resource definitions and architecture rules
packages/simulation/     Deterministic ticks, actions, outcomes and scoring
packages/scenarios/      Versioned workload/challenge definitions
tests/player/            Ordinary production browser tests
tests/e2e/               QA/editor and controlled-state regressions
tests/release/           Client API/identity regressions with isolated fixtures
tests/pages/             Static hosting, metadata, paths and recovery
scripts/                 Capture, asset checks and work-item validation
art/                     Editable original-art sources and provenance
docs/                    Contracts, development and submission guidance
```

`apps/engine-spike` is a historical engine experiment, not the production entry point. Start from [the documentation authority index](README.md), not archived implementation plans.

- UI formats/projected states must not change authoritative simulation values. `$1K` is the display of one credit; tests and stored runs retain numerical credits.
- Keep simulation changes test-first and consistent with [SIMULATION_SPEC](SIMULATION_SPEC.md), action replay, challenge identity and compatibility rules.
- Camera/rendering changes must not advance clocks, grant capacity or mutate economy. Preserve [resource visual states](RESOURCE_VISUAL_STATES.md).
- Coordinate with active UI/world/backend owners before changing shared files. Do not rewrite another branch to make integration easier.

## Tests: build the artifact that the test consumes

Fast baseline:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Install the browser once:

```bash
pnpm exec playwright install chromium
```

On Linux CI, Playwright may also require system dependencies (`pnpm exec playwright install --with-deps chromium`). Review that system-level installation before using it on a shared machine.

| Check | Preparation and command | Evidence / limits |
|---|---|---|
| Focused unit test | `pnpm exec vitest run apps/web/src/money.test.ts` | Fast pure/UI contract checks |
| Real ordinary-player loop | `pnpm build` then `pnpm test:player` | Real-time runs; full suite can take many minutes |
| Client API/identity | `pnpm test:release` | Starts isolated dev server; mock API, no production POST |
| QA integration | `pnpm build:qa` then `pnpm test:browser` | Controlled-state coverage, not human gameplay evidence |
| Pages | `pnpm build:pages` then `pnpm test:pages` | Project base, assets, metadata, reload and 404 recovery |
| Hardware smoke | `pnpm build:qa` then `pnpm test:performance` | Device-specific; macOS ANGLE/Metal configuration is not a portable FPS promise |
| Asset integrity | `pnpm test:assets`, `pnpm check:assets`, `pnpm test:art`, `pnpm check:assets:v3` | Hash/provenance validation, not legal permission |
| Approved demo inventory | `pnpm check:assets:demo` | Exact owner-approved asset inventory |

Focused browser example:

```bash
pnpm build
pnpm exec playwright test --config playwright.player.config.ts tests/player/top-hud.spec.ts
```

Tests start their own servers. Default ports are 43872 (QA), 43873 (performance), 43874 (player), 43875 (Pages), 43876 (release); capture uses 43877. Avoid running suites that share a port or result directory concurrently. Do not increase timeouts, skip tests or change fixtures simply to hide a failure. A tool timeout is not a passed test.

Outputs are ignored: `test-results/`, `test-results-player/`, `test-results-pages/`, `test-results-performance/` and `test-results-submission/`. Preserve useful failure artifacts before another run replaces the directory. Final validation should use the exact branch/head being reviewed; old counts are not evidence for new code.

## Optional leaderboard backend

Ordinary play and local rankings work without an API. Use an isolated local server or mocked tests for development—not the public board.

```bash
pnpm --filter @stack-and-survive/leaderboard-api dev
```

Check the backend's [environment example](../apps/leaderboard-api/.env.example) and [deployment/local-operation guide](LEADERBOARD_DEPLOYMENT.md) for current server settings. Development defaults to port 3001. The default allowed Vite origins use port 5173; if your dev server selects another port, explicitly configure its origin in local `CORS_ORIGINS` rather than allowing `*`.

In a second terminal, a POSIX shell can connect the player dev server with:

```bash
VITE_LEADERBOARD_API=http://127.0.0.1:3001 pnpm dev
```

Open the printed frontend origin with `/?tycoon`. `VITE_LEADERBOARD_API` is **build-time public configuration**, not a secret. Set it before a production build; changing the preview environment does not rewrite a built bundle. If unset/unavailable, the UI must distinguish local scores from verified server results.

Do not add credentials to `VITE_*`, commit `.env` or use real public submissions as routine tests. Score computation, supported challenges and nickname rules must remain aligned with [the API contract](LEADERBOARD_API_CONTRACT.md). Azure restart/deployment/storage changes require backend-owner coordination.

## Screenshots and demo evidence

```bash
pnpm exec playwright install chromium
pnpm capture:submission
```

This command builds ordinary production, starts its own loopback server and performs one real unaccelerated successful operation plus a separate no-action overload run. Allow roughly five minutes or more on a busy machine. It blocks external API requests and uses `DEMO` only for local score entry.

The timestamped output contains 16 milestones, a leaderboard detail image, `actual-run.json` and `capture-manifest.json`. Check `status: complete`, `sourceCommit`, `dirtyTree`, bundle hashes and observations. A failed or interrupted capture remains failed; rerun rather than relabeling missing states. [Exact milestone list](submission/SCREENSHOT_PLAN.md).

| Check construction truth | Check result identity and provenance |
|---|---|
| ![Construction capture shows a bay before activation, not free instant capacity.](images/construction.webp) | ![Result capture identifies the local DEMO entry and highlights the recorded row.](images/result.webp) |

Inspect the images yourself for clipped text, overlapping controls, incorrect state and wrong units. Capture outputs are not automatically committed, uploaded or approved as participant evidence. For a documentation refresh, copy only selected optimized derivatives into `docs/images/`, keep alt text, and update [image provenance](images/README.md). No additional image-conversion dependency is required to run the capture command.

Do not put screenshots in runtime `public/assets` or change asset hashes to admit new art without review. Label edited video, separate runs, local scores and test fixtures honestly. A full 180-second run plus introduction/result review is longer than a two-minute demo.

## Deployment and troubleshooting

The [Pages workflow](../.github/workflows/pages.yml) builds production with `/stack-and-survive/` after successful Quality on the current main SHA. It can skip a stale candidate; verify the **actual deploy job**, then open the public URL in a clean session. Do not change account-wide DNS, GitHub permissions or Azure resources as a frontend workaround.

| Symptom | First check |
|---|---|
| Editor instead of player | Development root vs `/?tycoon`; production uses `dist`. |
| Old UI in preview | Rebuild; verify the preview serves the intended output folder. |
| Blank world / missing images | Console/network, correct base path and build; use the existing graphics recovery flow. |
| Test server fails to start | Port already occupied or missing prerequisite build/browser. |
| Global board unavailable | Build-time API URL, actual allowed origin and server response; keep local fallback. |
| Asset release check fails | `check:assets:release` intentionally blocks unresolved rights; do not bypass or claim integrity implies permission. |

Before reporting success: record commands and exit results, read relevant screenshots, run `git diff --check`, and distinguish local tests from remote CI and actual deployment.
