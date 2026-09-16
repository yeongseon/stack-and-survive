# Iterative visual gate

## Result: iteration 03 — PASS for Stage 1 visual direction

**YES, but only selected environment assets.** Two independent read-only reviewers
opened all 18 iteration03 side-by-side boards and judged material improvement over
the current baseline, not merely improvement over the rejected first proposal.
This is not human game-feel validation, release clearance, or runtime integration.

| Iteration | Change | Independent verdict |
|---|---|---|
| 01 | Fifteen unrelated imported model types over existing backdrop | FAIL: mismatched materials, generic consoles and machine shells |
| 02 | V3 rack/cooling hall, real connected pipe runs, no large zone rectangles | REVISE: materially improved, but pipe perimeter reads as a giant picture frame and wall panels are disconnected |
| 03 | Remove pipe perimeter; short dim service runs; continuous rear wall; dimmer V3 rack layers | PASS from both final reviewers: coherent indoor data-center, stronger depth, clearer playable midground |

## What passed and why

1. More game-like: coherent raised-floor hall replaces oversized transparent zone boxes.
2. Architecture: same Intake/Edge/App/Cache/SQL positions and routes, less abstract background clutter.
3. Identity: all original V3 heroes, active modules and service badges retained.
4. Traffic: captured Browse/Order markers and pressure/loss cues remain higher contrast than scenery.
5. Targets: empty footprints, physical App bays, construction and active facilities remain visible.
6. Background competition: rear racks dimmed, unrelated consoles removed; low-priority utility runs.
7. Depth: rear wall/rack aisles, open playable floor, lower utility/rack band are distinct.
8. Setting: racks/cooling/electrical cabinets make the indoor data-center reading explicit.
9. Coherence: existing V3 props share hero material; only restrained real pipe/valve geometry is imported.
10. Cost: one baked replacement background, 2400×1350, 581,978 bytes in the accepted render;
    RGBA8 estimate12,960,000 bytes, same dimensions as existing background. Runtime changes remain zero.

## External contribution, honestly bounded

Most improvement comes from **recomposing existing custom V3 environment assets**,
not from Kenney geometry alone. Only `kenney-space-station/pipe.glb` and
`kenney-factory/pipe-large-valve.glb` support the accepted direction. They were
actually imported and rendered in Blender, aligned between defined endpoints,
rescaled along/cross the pipe axis, assigned shared graphite metal, and dimmed in
composition. Sixteen pipe sections and two valves form local service runs.
This comparison does not isolate their causal contribution from the hall redesign;
do not claim external assets alone produced the improvement. Fifteen original
source candidates stay available as rejected/evaluated provenance, not a runtime list.

Existing V3 rack-b/c, cooling-a/b, electrical-cabinet and maintenance-light PNGs
are cropped to nontransparent bounds, resized and alpha-composited as noninteractive
background art. They retain original rights restrictions. Floor, wall and service
strip graphics are original procedural composition. Heroes are never baked in.

## Evidence

- `iterations/02/`: 18 real same-state comparison pairs plus the intermediate render.
- `iterations/03/`: 18 real same-state comparison pairs plus accepted render.
- Each `comparison/captures.json`: source baseline, actual tick/states/camera/targets,
  capture timestamps and current/proposed/environment hashes.
- Each `comparison/metrics.json`: verified image dimensions/state/hash pairing,
  pixel difference ratios and environment bytes. Numbers do not determine visual PASS.
- Representative: `iterations/03/comparison/side-by-side/1440-cache-edge-active.png`
  and `iterations/03/comparison/side-by-side/844-fit.png`.

Both sides now dismiss the existing guide after operation begins; it is not hidden
only on the proposal. All scenes still use local QA manual stepping and reduced
motion. Baseline renderer remains7e2f145, not latest remote main; compare fresh
against then-current main before integrating. Earlier FAIL evidence is unchanged.

## Remaining limitations

The horizontal dashed strips can read slightly road-like; repetitive background
rows remain visible at Fit. Reviewers treated these as nonblocking for the stated
stylized data-center target, not claims of AAA quality. No new full-motion, hover/
focus, bot-filter-specific, actual hardware FPS or participant acceptance was
performed. Those are explicit subsequent integration/acceptance gates. External
CC0 facts remain recorded; mixed original-art outputs are not automatically CC0.
