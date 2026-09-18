# Azure visual experience — Computer 1

## Baseline (before implementation)

- Branch: `feature/azure-visual-experience`; base `587985bacab3ba0382e1b4013a6fe76ab8ffb519`, fetched from origin/main on 2026-09-18.
- Isolated worktree; no AI Coach, operational work or other feature branch merged.
- React 19 + TypeScript + Vite 6; Phaser 3 owns the existing isometric world. No router: production `/` is ordinary play; development `/` is the editor and `/?tycoon` is player mode. `mode.ts` controls diagnostics.
- State: controller external store via `useSyncExternalStore`, local React state for presentation, existing local storage repositories for history/settings. No new state framework.
- Source boundaries: `apps/web/src` UI/rendering, `apps/leaderboard-api/src` optional replay API, `packages/schema`, `cloud-domain`, `scenarios`, `simulation` numerical rules. `art/`, `scripts/`, `tests/`, `docs/`, `showcase/` support production assets/verification/documentation.
- Composition: `main.tsx` → `ChallengeApplication` → `TycoonGame`; `GameHUD`, `GameFloor`/`world.ts`, `WorldGuide`, `LearnDialog`, `PauseMenu`, `GameResult`. Existing resource projection is `resource-visual-state.ts`; existing measurement/observation logic is not owned here.
- Styles: ordinary CSS files (`style.css`, `player-console.css`, `gameplay-hud.css`, `title-scene.css`). Preserve the diorama, camera geometry and existing responsive behavior. Existing layout breakpoints include 1250/1100/899/700/600 px; phone gameplay uses landscape, including 844×390. Portrait retains the orientation gate.
- Existing icon source: four unchanged Microsoft V24 SVGs in `public/assets/azure-icons`, pinned in `art/asset-manifest.json`. Usage is a narrow owner-directed demo exception, not blanket Microsoft permission. No resource is added by adding a visual definition.

### Commands actually run before edits

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile unchanged; existing esbuild install-script approval warning |
| `pnpm test` | PASS — 78 files, 597 tests |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS; existing Phaser chunk >500 KB and mixed static/dynamic ladder import warnings |
| `pnpm check:assets:demo` | PASS — existing exact-inventory exception; rights remain pending |

No baseline unit/lint/type/build failures observed. Full historical browser/performance suites were not run at baseline; targeted actual-production before/after captures and visual browser regression checks are recorded below. General release asset clearance remains intentionally blocked by unresolved rights, not a new feature failure.

### Existing work and boundaries

Read README, package scripts, source-folder structure, visual/camera/resource-state/asset contracts and the source TODO/issue-reference audit. Open GitHub issues checked: #7, #25, #149, #152, #159, #164, #186, #195. These are tracker, human acceptance, audio/device or rights gates; visual automation does not close them. Historical #260/#261, #132 and #151 are not new work. README's old showcase language is Computer C's scope and is not changed here.

Computer 1 owns tokens, presentation components, service identity and onboarding. Computer 2 owns operational metrics/events and simulation-core changes; Computer 3 owns findings/recommendations/results/comparison. No changes to scoring, traffic, routes, existing persistence schemas, backend or numerical formulas are permitted. Missing telemetry must remain unavailable, not fabricated as CPU/p95 or an invented health measurement.

## Implementation direction

Dark technical canvas, restrained Azure blue/cyan, high-contrast semantic tokens and text/shape state cues. Preserve original facilities and camera; add a reusable resource card in an on-demand contextual catalog. Keep status and traffic understandable without animation. Retain existing adaptive World guide; add an independent, optional four-step conceptual tutorial with its own preference key, reachable through Help without starting or modifying a run.

## Verification and captures

Pending implementation. Before/after images go in this non-production documentation folder; screenshots are actual local game captures, never fabricated telemetry or evidence of human learning.
