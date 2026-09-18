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

Implemented semantic tokens, eight service definitions (four existing-game identities and four non-selectable concepts), reusable accessible resource nodes, on-demand service panel, a static traffic key and route drop hatching, and a separate optional four-step tutorial. Existing measured pressure is reused; absent/construction state has unknown health rather than an invented outage.

### Final verification

- `pnpm test`: **610 tests / 82 files passed** (baseline 597; 13 new).
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: passed. Same pre-existing Phaser chunk/mixed-import warnings.
- `pnpm exec playwright test --config playwright.azure-visual.config.ts`: **six passed**, actual production preview, including tutorial completion/skip/reopen, keyboard and live App expansion, failed-icon fallback, no-upgrade score810 at45s and restart. No simulation tick injection.
- New UI checked at 1440×900, 1024×768, 844×390 and 700×390; title tutorial at320×568 and844×390. Existing portrait gameplay gate retained. Tests check non-overlap with camera/HUD and reduced-motion computed styles.
- `pnpm test:assets`:11 passed. `pnpm check:assets:demo`: passed; all existing runtime bytes/rights boundaries retained. General release approval remains unresolved.
- LSP diagnostics for the three new main presentation components: no errors. Primary capture and gameplay paths: no uncaught browser errors.
- Independent review found a focus restoration race, pointer hit-area issue and an ambiguous absent-resource health label; all were corrected and covered. An initial narrow-title scrollWidth check counted intentional offscreen decorative SVG geometry; it now checks actual tutorial bounds and control reachability rather than altering baseline TitleWorld.
- No full historical browser/performance suite or human/grayscale perception study claimed. CPU/p95 and operational timeline are integration boundaries, not generated data.

### Actual before/after captures

Capture command: `node scripts/capture-azure-visual.mjs before|after` after `pnpm build`, using the preview server configured by `.codegpt-game.json` on127.0.0.1:43889. Before images were committed in `0f49ce1` before feature implementation. After images show the optional catalog open. Both use actual Pause → Inspect and reduced motion at the opening state; they are not live-load comparison evidence. External requests are blocked, no leaderboard POST occurs. No image edits/crops applied.

| View | Before | After |
|---|---|---|
| Desktop architecture1440×900 | [Before](azure-visual-experience/before-architecture-1440.png) | [After](azure-visual-experience/after-architecture-1440.png) |
| Landscape architecture844×390 | [Before](azure-visual-experience/before-architecture-844.png) | [After](azure-visual-experience/after-architecture-844.png) |
| Desktop title1440×900 | [Before](azure-visual-experience/before-title-1440.png) | [After](azure-visual-experience/after-title-1440.png) |
| Landscape title844×390 | [Before](azure-visual-experience/before-title-844.png) | [After](azure-visual-experience/after-title-844.png) |

Branch-only deliverable: push `feature/azure-visual-experience`, no merges or live deployment. See [asset provenance](../azure-assets.md) and [cross-branch notes](../../INTEGRATION_NOTES.md). Existing AI Coach and cloud migration worktrees are intentionally untouched.
