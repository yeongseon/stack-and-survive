# Separate Stage 2 integration plan — gated, not executed

**ON HOLD: owner review of Iteration04 is required first.** Iteration03 was rejected
as final-quality art by the owner. The earlier plan below is historical; any future
integration must use the owner-accepted version and fresh current-main evidence,
not assume iteration03 or an automated04 verdict is owner approval.

Iteration03 passes the visual-direction gate. This document does not approve asset
rights, expand the Pages demo exception or authorize a main merge.

1. Fetch then-current main and active PRs in a **new integration branch/worktree**.
   This experiment uses7e2f145 visual baseline; do not overwrite later changes.
2. Reproduce accepted composition and hashes from the two official CC0 selected
   GLBs, their pinned colormaps, existing V3 environment sprites and scripts.
   Record all input/source hashes, output hash, Blender/Pillow versions and actual
   export time. Preserve independent hero/state/traffic rendering and camera.
3. **Human rights/inventory decision required before public runtime bytes.** The
   composite contains original V3 art with rights-pending status plus CC0 sources.
   Existing original-v3/Pages approvals do not silently extend to this derivative.
   Review `docs/ASSET_STRATEGY.md`, `docs/PAGES_DEMO_EXCEPTION.md`, #164 and the
   manifest's provenance schema. Record correct mixed-source evidence and explicit
   owner approval; do not label the whole composite CC0 or flip pending fields.
4. Replace only the baked background in the rendering seam, keeping one
   2400×1350 background texture. No GLB loader, engine rewrite, new gameplay
   objects, camera edits, topology changes or dynamic decorative sprite system.
   Existing foreground overlays and independent facilities remain.
5. Capture current/integrated pairs from the actual production build at1440×900,
   1920×1080 and844×390; normal, App/SQL pressure, Cache/Edge lifecycle and
   filtering, construction, Fit/close, selection/hover/focus and full traffic
   motion. Assert simulation/camera/target invariants and inspect actual opacity.
6. Run all integrity/V3/demo checks under the properly approved inventory, unit
   tests, typecheck, lint, production/player/browser/Pages tests. No checker
   weakening or automatic inventory approval. Measure hardware GPU/draw-call/FPS
   impact; estimate of12.36MiB is not an allocation measurement.
7. Independent visual and functional review on final production captures, then
   owner review of the separate PR. #25/#195/#159 final human sessions must use
   the final accepted visuals. Manual audio #149 remains separate.

Until step3's explicit human decision, retain the accepted render only in the
experiment. The current PR is evidence and source work, not Stage2 deployment.
