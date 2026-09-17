# Iteration 04 owner-requested environment quality pass

## Status and authority

**Refined 04C: independent aesthetic and technical/visual-integrity reviews PASS;
owner review PENDING. No production integration and no PR merge.**

Iteration03's previous PASS established improvement over baseline only. The owner
rejected it as final-quality art. A fresh review re-opened all18 original boards
and found the stronger aesthetic gate unmet in all18. That verdict is not hidden
or retroactively replaced by the previous approval.

## Three candidates before selection

Actual1200×675 Blender renders, same2400×1350 world projection, no heroes baked:

| Candidate | Authored direction | Comparison result |
|---|---|---|
| 04A | Clean enterprise: separated 3/2/3 rack groups, cooling bank, utility clearances | Second: clean, but too sparse; floating tray and imported template issues |
| 04B | Restrained industrial: heavier columns/service overhead, power-heavy edge zones | Third: overbright floor and service structures dominated |
| 04C | High-capacity room: 4/3/4 rack clusters with cooling/power interruptions and open hero floor | Selected: strongest room massing without filling the playable center |

See `iterations/04/candidates-board.png` and individual candidates/04A/B/C PNGs.
These initial candidates were rendered before refinement. Their JSON receipts pin
the actual output hashes. Current source recreates the refined family, not the
historical initial candidates byte-for-byte. The final source hashes are separately
recorded in `iterations/04/source-manifest.json`.

Selection did not blend the three styles. 04C was refined twice: first remove two
bad single-face imported templates, reduce seams/brightness and support trays;
then reduce rear cabinets to68% and other peripheral cabinets to78%, darken shared
materials and lower exposure by0.65 stops. The first full render still received
REVISE for oversized bright rear racks; all18 captures were regenerated after the
second refinement. `refinement/04C.png` preserves the intermediate small render.

## Explicit 03 versus 04 answers

1. **What was wrong with03?** Repeating185/225/200px rack rows, global diagonal
   lines, flat rear bands, road-like dashed strips, and PNG props without shared
   physically computed contacts made a technical board rather than a room.
2. **Structural change?** One Blender scene now contains floor slabs, wall depth,
   return wall, footing/columns/beams, inset ventilation louvres, supported overhead
   trays, authored rack/cooling/power groups and local utility details. Cycles
   computes contact shadows and light falloff across all objects together.
3. **Actual external assets?** Eight unchanged GLB sources are imported as geometry:
   Space Station `wall`, `floor-panel`, `rail`, `pipe`, `pipe-bend`; Modular Space
   `cables`; Factory `pipe-large-valve`, `machine-connection-pipe`. All were already
   downloaded from the verified CC0 packs; no new fictitious pack is claimed.
4. **What was removed?** Pillow-built primary hall, global drawn diagonal grid,
   dashed service strips, equally spaced PNG rack rows, flat painted wall,
   loose full-width pipe decoration. `template-floor` and `template-wall-half`
   were re-evaluated in the first three renders but rejected for black/poorly
   oriented single-face artifacts; their source files are retained as candidates.
5. **Repetition reduced?** Yes: listed asymmetric clusters, gaps and equipment
   interruptions replace full-width numeric wallpaper rows. Same cabinet family
   remains detectable, recorded as a residual caveat rather than denied.
6. **Floor still a grid/map?** No screen-space grid is drawn. Real raised panels
   have near-flush seams and restrained bevels; faint physical seams remain at
   close zoom. Dark rough micro-bump material and actual lighting supply the surface.
7. **Road cues?** Both dashed strips are gone, not recolored. Only short dark
   service channel and support geometry remain. Existing gameplay flow paths are
   unchanged by explicit constraint; they are not environment roads.
8. **Rear wall believable?** Continuous volume, floor junction, beam, columns,
   recessed dark service bays/louvres and supported trays create scale hierarchy
   and shared contact shadows instead of separate wall PNGs.
9. **Lighting hierarchical?** Cool ambient, broad center soft illumination,
   subdued rear wash, small warm maintenance lights and SQL-side fill. No red or
   amber decorative state signals. Background exposure is lowered, heroes unchanged.
10. **Heroes dominant?** Final review found the rear scale/brightness correction
    restores hero and traffic priority at all three sizes. No facility art changes.
11. **Mobile cleaner?** Fit retains four depth planes with much quieter floor and
    no dashed bands; original HUD/control occupancy remains, not claimed fixed.
12. **Strong enough for production art?** Independent reviewers accepted the
    refined environment under this stricter gate. **Owner approval is still pending**;
    this is not permission to deploy or evidence of participant game feel.

## New aesthetic gate, evaluated from zero

| Criterion | Final independent review |
|---|---|
| One intentionally designed room | PASS: continuous architecture and local grouped infrastructure |
| Not procedural wallpaper | PASS: explicit clusters, not evenly repeated sprite rows |
| Not road/map | PASS: no dashed strips/global drawn grid |
| Environment not an infrastructure diagram | PASS: physical room under the deliberately unchanged gameplay layer |
| No obvious cross-pack stock look | PASS: all imported geometry uses shared graphite material |
| Physical floor material | PASS: subtle physical seams, roughness, light falloff |
| Rear architectural depth | PASS: wall volume, recesses, beam, columns and trays |
| Rack repetition not immediate primary read | PASS with caveat: same family visible, subdued and clustered |
| Heroes dominate | PASS after rear scale and exposure refinement |
| Environment attractive without UI | PASS on background-only comparison |
| Meaningful close detail | PASS: louvres, handles, service slots, bevel/contact detail |
| Fit clean | PASS across three six-state review boards |
| Immediate indoor data-center reading | PASS |

Review coverage: direct image review of the three summary boards, each containing
all six requested states, plus background-only board and representative full-size
game screenshot. An earlier attempt to send all18 large boards exceeded provider
image limits and produced **no verdict**; it was not counted as approval. Full-size
18-pair artifacts remain available for owner inspection.

## Sources, transforms and rights

`hall_geometry.imported()` reads actual pinned GLBs, normalizes dimensions, places
them at explicit coordinates/rotations and assigns shared graphite painted steel.
The selected8 imports and transforms are in `iterations/04/render.json`, linked to
source hashes in `source-manifest.json` and existing `source/selection.json`.
Pack dates, archive hashes, bundled licenses and colormap hashes remain unchanged.

Rack/cooling/power cabinets are **new original reconstructed 3D equivalents** of
V3 environmental roles, not downloaded Kenney racks and not pasted V3 PNGs. Their
geometry and physical room are generated by the new source scripts. No code/art
license choice or approval is inferred for these original contributions. Existing
hero sprites and Azure badges appear only in live game captures; they are never
baked in the room image and their existing restrictions remain separate.

## Reproduce final selected scene

```sh
HALL_CANDIDATE=C HALL_FULL=1 blender --background --factory-startup --python art/experiments/external-art-spike/source/blender/hall_scene.py
ART_ITERATION=04 node art/experiments/external-art-spike/source/capture.mjs
uv run art/experiments/external-art-spike/source/iteration_evidence.py 04
uv run art/experiments/external-art-spike/source/hall_boards.py
node --test art/experiments/external-art-spike/source/hall_verify.test.mjs
```

Blender4.5.14LTS,48samplesCPU,AgX,one fixed orthographic camera with ground
slope.55 and scale24. Set `HALL_CANDIDATE=A/B/C` without `HALL_FULL` for small
current-source variants; those commands overwrite the same candidate filename,
so use `HALL_PREVIEW_DIR=<new-local-folder>` when preserving historical candidates.
Pillow is used only to assemble labelled comparisons, never primary04 art.

## Verification and limits

Final18pairs at1440×900,1920×1080,844×390 contain normal/Fit/close/construction/
Cache+Edge active/App pressure; each pair has equal tick/resource state/camera/
world nodes/targets/flows and pinned output hashes. Capture baseline remains
starting main7e2f145; latestmain was checked for parallel-work safety, not silently
used to relabel older gameplay captures. OpenPR253 release metadata untouched.

Static reduced-motion pairs establish appearance and state correspondence, not
full-motion performance or human gameplay acceptance. Bot-filter, Cache hit/miss
motion and hover/focus are not separately captured in this18-state matrix; no
claim that all dynamic flow cases are newly validated. Stage2 requires those and
current-main production captures after owner review. No runtime textures added;
one proposed2400×1350RGBA8 image would use12.36MiB before driver overhead/mipmaps.
Disk bytes and output hash are recorded in comparison/metrics.json. No hardware
FPS/GPU measurement, Pages exception expansion or license approval occurred.
