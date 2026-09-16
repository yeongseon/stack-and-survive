# External asset art spike — Stage 1

**Decision: NO — current custom art is more coherent than this proposal. Do not integrate.**
This is a real, reproducible negative experiment, not a concept image or production art release.

## Scope and baseline

Branch `art/external-asset-spike`, isolated worktree, baseline main
`7e2f145a5458ea1de77e2cf5b0b09550cce9dee4` fetched 2026-09-16 UTC.
V3 heroes (#210), baked hall (#214), balance 0.3 (#217), menus (#219), input
safety (#222), and leaderboard work through #236 were already merged.
The older V3-as-future wording in VISUAL_DIRECTION/PRODUCT_ROADMAP is not
evidence that those facilities still need replacing. RESOURCE_VISUAL_STATES,
actual code and merged history take precedence for shipped behavior.

At initial inspection PR #237 was the only open PR, editing
`apps/web/src/GameResult.tsx` and `tests/e2e/game-hud-result.spec.ts`.
Issues #7, #25, #149, #159, #164, #186, #195 were open; software implementation
does not close their participant, listening/device, or owner-rights gates.
No participant evidence was created. Final accepted visuals must precede final
human validation. This experiment does not reopen completed production-art issues.

| Classification | Paths |
|---|---|
| SAFE TO MODIFY | `art/candidates/external/**`, `art/experiments/external-art-spike/**`, `docs/art-spike/**` |
| CAUTION; untouched here | `art/asset-manifest.json`, `art/v3/**`, `apps/web/public/assets/**`, rendering source |
| DO NOT TOUCH | active PR #237 files; simulation, scenarios, cloud-domain, leaderboard, economy, balance, camera, geography |

The required policy documents, `art/`, V3 provenance/inventory, runtime assets,
web rendering and tests were inspected. No production bytes, approval fields,
canonical coordinates or runtime inventory changed. Existing custom Intake,
Edge, App/bays, Cache, SQL, traffic and state overlays remain independent.

## What actually ran

- Three official Kenney ZIPs downloaded successfully. Fifteen GLBs selected;
  five other models evaluated from upstream previews and rejected.
- Unmodified license files, member hashes and limited source models retained.
  ZIPs and Blender binaries are outside Git. Optional Sci-Fi UI was deferred;
  no UI pack was downloaded or used.
- Blender 4.5.14 LTS, Cycles CPU, 16 samples, shared ortho camera, fixed
  lighting, transparent PNG: **executed**, not just prepared.
- One additive environment study: 15 model types, 18 placements around the
  unchanged 2400×1350 hall. Existing racks/cooling/floor/walls are retained.
  This is **not a replacement hall** or proof of a fully authored environment.
- Eighteen current/proposal pairs: 1440×900, 1920×1080, 844×390, each with
  normal, Fit, close, construction, Cache+Edge active, App pressure.
- Actual Phaser screenshots, not pasted hero art. Each current frame is taken
  first, then the same browser's background canvas receives the Blender layer.
  Simulation tick, resource state, camera, target geometry and flows are asserted
  identical within each pair. `comparison/captures.json` records hashes and state.
- Captures use **local QA manual stepping with the production V3 inventory forced
  in memory**, reduced motion and the current balance 0.3. They are not screenshots
  of the deployed Pages build. Cross-resolution ticks can differ; each pair is
  matched, not the entire matrix. Existing onboarding UI is visible in captures.
- Side-by-sides are labelled joins of the actual screenshots. The upstream
  evaluation sheet is explicitly upstream preview imagery, not Blender output.

## Reproduce

From repository root, use Node 22.22.0, pnpm 10.32.1 and Blender 4.5.14 LTS:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
# Download each source/packs.json URL to an external directory using its archive name.
uv run art/experiments/external-art-spike/source/acquire.py /tmp/opencode
blender --background --factory-startup --python art/experiments/external-art-spike/source/blender/render.py
node art/experiments/external-art-spike/source/capture.mjs
uv run art/experiments/external-art-spike/source/evidence.py
node --test art/experiments/external-art-spike/source/verify.mjs
ART_ARCHIVE_DIR=/tmp/opencode node --test art/experiments/external-art-spike/source/regression.test.mjs
```

Capture takes several minutes on software WebGL; allow at least ten minutes.
The regression suite needs the three pinned ZIPs in `ART_ARCHIVE_DIR` and `uv`;
it mutates only unique temporary copies, never the recorded evidence.
Acquisition writes `source/acquisition.json` with the actual UTC local archive
verification time and `source/textures.json` with the three colormap member hashes.
The original official source/license check was 2026-09-16; rerunning acquisition
does not imply another website/license check. Original capture dates stay unchanged.
It starts an ephemeral localhost Vite server and closes server/browser in `finally`.
Its two explicit experiment-only transforms expose the scene and select the
existing approved V3 inventory; no source files are rewritten. Do not deploy this
capture harness. The Blender script rebuilds the scene, so a large `.blend` file
is unnecessary. Source selection is checksum-pinned; renderer pixel identity can
vary across Blender/platform versions.

Portable Blender used here:
<https://download.blender.org/release/Blender4.5/blender-4.5.14-linux-x64.tar.xz>,
SHA-256 `9ba871ff2ecd36526b77432745980b7e6664ecd0c7ca11c48849073dcfe06da3`,
verified against the official `.sha256`. It is a tool, not a redistributed asset.

## Read the evidence

- [Asset mapping](reports/ASSET_MAPPING.md)
- [License review](reports/LICENSE_REVIEW.md)
- [Visual review / decision](reports/VISUAL_REVIEW.md)
- [Performance notes](reports/PERFORMANCE_NOTES.md)
- [1440 active side-by-side](comparison/side-by-side/1440-cache-edge-active.png)
- [Mobile Fit side-by-side](comparison/side-by-side/844-fit.png)
- [Upstream selection/rejection sheet](renders/props/upstream-evaluation-sheet.png)

## Limits and remaining manual work

No exact external server-rack or HVAC models were found in the selected kits;
console and machine surrogates are an acknowledged failed fit, not relabelled
assets. Wall/floor templates include geometry that is poorly visible from this
camera, and the current generic per-object normalization is not a production
scale standard. No human playtest, hardware FPS/GPU trace, bot-filter-specific
capture, hover/selection audit, non-reduced-motion review, or final release rights
approval occurred. An accepted future proposal needs all those checks.

**Stage 2 is closed.** No integration plan is authored as an executable change,
and no runtime integration is performed. A narrower pipe/rail study or a verified
data-center-specific pack would be a new experiment, not implied approval here.
