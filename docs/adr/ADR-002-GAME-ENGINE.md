# ADR-002: Game Engine Selection

## Status

Accepted — the project owner explicitly selected “Phaser 확정·순차 진행” in the development session, authorizing Phaser and sequential verified commit/push/PR merges. The comparative spike was executed on 2026-09-11. Tracking: [issue #1](https://github.com/yeongseon/stack-and-survive/issues/1). Human playtesting, Azure deployment, and external telemetry require separate evidence/approval.

## Context

Stack & Survive requires:

- Web-first deployment and TypeScript
- Fixed 2D / 2.5D view
- Building placement, selection, and dragging
- Pan / zoom
- Traffic animation and connection visualization
- Mobile-web readiness, without requiring a mobile client for the MVP
- React HUD integration
- A renderer-independent simulation

See [the current Technical Design architecture](../TECHNICAL_DESIGN.md#architecture); the original decision and measurements in this ADR remain historical evidence.

## Candidates

- Phaser
- PlayCanvas

## Spike

Timebox the combined comparison to approximately half a day to one day. Build the same small scene with each candidate:

```text
Internet → App Service → Azure SQL
```

Required checks:

- Render buildings in a fixed isometric or equivalent view.
- Select and drag App Service.
- Pan and zoom without interfering with selection.
- Draw a directional connection.
- Animate 100+ representative packets, not one object per simulated request.
- Display an explicit SQL overload state.
- Mount alongside a minimal React HUD and cleanly destroy/remount the renderer.

Use the same static architecture and synthetic snapshot fixtures for both candidates. Do not implement simulation rules inside either prototype. Production packaging, polished assets, mobile UI, and Azure deployment are outside this spike.

Record observations rather than assumed engine capabilities:

| Check | Phaser | PlayCanvas |
|---|---|---|
| TypeScript setup and React integration | Strict typecheck/build passed; React shell + async adapter | Strict typecheck/build passed; React shell + async adapter |
| Placement, selection, connections, pan / zoom | Mouse interaction checks passed | Same checks passed |
| Packet animation and overload feedback | 120 animated primitives, SQL warning glyph/text, screenshots inspected | 120 animated box entities, SQL material/text warning, screenshots inspected |
| Responsiveness on the same browser / hardware | Headless Chromium interactions passed; no hardware FPS claim | Same software-WebGL environment; no hardware FPS claim |
| Development effort and integration obstacles | Smaller adapter and draw-primitive setup; native input deliberately not evaluated | Additional camera/entity/material setup; detached/zero-size lifecycle guard needed during switching |
| Touch-input feasibility | Emulated touch-pointer drag passed; no pinch or real-device test | Same shared-adapter touch test passed; same limitations |

### Reproduction and evidence

The disposable experiment lives in `apps/engine-spike/`, separate from the future production workspace. From that directory:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
pnpm dev --port 43871 --strictPort
```

Stop the development server before browser tests; Playwright starts and stops its own production-preview server on that port. Open `http://127.0.0.1:43871/` for manual inspection after starting `dev`.

Tested environment: macOS, Node 22.22.0, pnpm 10.32.1, TypeScript 5.9.3, React 19.2.8, Vite 6.4.3, Phaser **3.90.0**, PlayCanvas **2.22.0**, Playwright 1.63.0, Vitest 4.1.11. The committed lockfile is the reproducibility source. Phaser 4 was not evaluated; this is a version-specific comparison, not a claim about every engine release.

Verification: four shared-fixture unit tests; five browser cases covering both engines' selection/drag/pan/zoom, invalid/duplicate/cleared connections, overload, resize, reset, switching, rapid pending-load switching, and emulated touch drag. Console exceptions/errors and HTTP failures are checked in the main interaction cases. Captured baseline/overload PNGs and JSON observations are generated under ignored `test-results/`. Images were inspected; the screenshot is a renderer prototype, not the final game art direction.

The tests launch headless Chromium with ANGLE/SwiftShader software WebGL, at 1440×1000 then 1000×850. This validates functionality, not 60 FPS on typical laptop GPUs. The UI's recent FPS samples are not used to choose a winner. Real-device mobile, pinch zoom, long-duration GPU memory behavior, WebGL context-loss recovery, and low-end hardware remain untested.

Both candidates use the same world coordinates and DOM Pointer Events adapter to hold interaction behavior constant. Therefore these results **do not compare native engine input ergonomics**. Overload and traffic are synthetic fixtures; no simulation, game balance, persistence, backend, authentication, external assets, telemetry, or Azure deployment is implemented. The orthographic presentation is an equivalent fixed view, not an evaluation of a finished isometric asset pipeline.

Observed production chunks (minified / gzip, decimal kB): shared shell approximately 207.95 / 66.05; Phaser 1482.20 / 338.07; PlayCanvas 2494.70 / 642.46. Engines are dynamically imported, but both are included in this comparison build. Vite warns about large chunks. These are this prototype's outputs, not irreducible engine sizes; production must ship only the chosen adapter and reassess loading/performance.

Dependency audit found a moderate advisory in the initial Vitest 3 toolchain; updating to Vitest 4.1.11 removed the known findings. `pnpm audit` subsequently reported none. This is not a guarantee against unknown vulnerabilities. Dependency install scripts were not broadly enabled.

## Decision

**Decision: Phaser 3.90.0 for the initial 2D MVP, accepted by the project owner.** Both tested versions met the limited scene requirements. Phaser required fewer engine-specific entities/materials and produced the smaller observed engine chunk; the experiment did not demonstrate a game requirement that needs PlayCanvas's 3D machinery. This is a simplicity/scope decision, not a performance ranking.

PlayCanvas remains a future alternative if true 3D depth becomes a justified requirement. Production uses only Phaser; keep the comparative experiment isolated from production dependencies.

Prefer Phaser if sprite-based 2D / isometric rendering meets the needs with lower implementation effort. Prefer PlayCanvas if depth and 3D transforms provide a demonstrated benefit that justifies additional complexity. These are selection criteria, not test results.

Change the status to **Accepted** only after recording the chosen engine, evidence, and trade-offs. Do not maintain two production renderers.

## Consequences

- The simulation engine remains independent from the selected engine.
- React owns the surrounding HUD and menus; the renderer owns presentation of the world, not gameplay truth.
- Only the selected adapter advances into the MVP.
- Native applications and full 3D gameplay remain outside the Hackathon scope.
