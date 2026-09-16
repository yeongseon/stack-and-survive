# Exact asset mapping

All members are `Models/GLB format/<name>.glb`. Selected source bytes and hashes
are in `../source/selection.json`; originals are unchanged. Each pack's colormap
and unmodified upstream previews are retained. No output is a runtime asset.

| Game need | Exact member name | Pack | Transformation / intended use | Finding |
|---|---|---|---|---|
| Rear wall | wall | Space Station 1.0 | Desaturate, ortho render, two rear placements | Visible but isolated blocks, not a coherent rear wall |
| Utility access floor | floor-panel | Space Station 1.0 | Render a peripheral access tile | Useful detail, not a main floor replacement |
| Rack variant candidate A | computer-system | Space Station 1.0 | Two background equipment consoles | **Not a server rack**; poor substitute |
| Rack variant candidate B | computer-wide | Space Station 1.0 | Two wide monitoring consoles | **Not a server rack**; silhouette competes |
| Utility pipe | pipe | Space Station 1.0 | Foreground service element | Default axis appears vertical; requires oriented assembly |
| Utility elbow | pipe-bend | Space Station 1.0 | Foreground service element | Potentially reusable, unconnected here |
| Foreground structure | rail | Space Station 1.0 | Low guardrail | Good bounded silhouette, too peripheral at close zoom |
| Environmental display | display-wall | Space Station 1.0 | Desaturated, emission removed | Rear face can read opaque; not used as gameplay signal |
| Floor section | template-floor | Modular Space 1.0 | Peripheral floor template | Single-face/orientation visibility needs manual inspection |
| Structural wall | template-wall-half | Modular Space 1.0 | Short rear wall template | Weak visibility in selected orientation |
| Cable infrastructure | cables | Modular Space 1.0 | Low foreground cable bundle | Looks loose rather than installed; reject present placement |
| Cooling candidate A | machine-connection-pipe | Factory 3.0 | Desaturate, left utility area | Generic machine enclosure, **not verified HVAC** |
| Cooling candidate B | machine-window | Factory 3.0 | Desaturate, left utility area | Open shell, weak cooling semantics |
| Power cabinet candidate | machine | Factory 3.0 | Right peripheral utility | Generic machine shell, not an electrical cabinet asset |
| Utility valve | pipe-large-valve | Factory 3.0 | Low foreground utility | Most concrete utility role; oversized relative to existing racks |

Shared export: `source/blender/render.py`, `source/layouts/environment.json` →
`renders/environment/external-overlay.png`. All fifteen models are imported;
eighteen placements reuse three types. The layout retains the playable midground
and every canonical hero point. Source pack scale is normalized by longest bound
to the per-role size in the layout, then all objects use the same 100px/unit rig.
This is a reproducible **spike convention**, not proven physically coherent scale.

## All ten selection criteria

| Criterion | Evidence and assessment across the selected set |
|---|---|
| Perspective | Ortho elevation 33.367° gives ground slope .55, matching hall grid. Existing background equipment uses a different apparent side depth; global coherence still fails. |
| Scale | Exact per-role sizes in layout. Consoles/machines remain toy-like or oversized; do not accept automatic bound normalization for production. |
| Material | Roughness .8, metallic .25, texture saturation .12/value .42; rounded low-poly forms still contrast with line-rich V3 heroes. |
| Lighting | One warm key/cool fill, no per-sprite eyeballing; original baked hall lighting still differs. |
| Silhouette | Pipe/valve/rail readable at Fit; consoles do not communicate rack function. |
| Detail | Coarse imported surfaces add less useful close detail than existing racks; cables look disconnected. |
| Palette | Saturation normalization removes stock purple/yellow but yields neutral grey that is not yet the graphite-blue hall palette. |
| Runtime cost | One possible baked layer, not 18 independently loaded runtime sprites; actual Stage1 adds zero runtime bytes. |
| License | Every selected model belongs to the checked official CC0-1.0 archive; project mixed-output rights remain separate. |
| Purpose | Peripheral depth was targeted; the current arrangement adds objects without enough environmental coherence. |

## Five evaluated but rejected models

Upstream previews (not fabricated renders) appear in `renders/props/upstream-evaluation-sheet.png`.

| Exact model | Pack | Rejection |
|---|---|---|
| table-display-planet | Space Station | Planet display pushes spaceship setting |
| container-tall | Space Station | Cargo/storage clutter adds no operational meaning |
| corridor | Modular Space | Enclosed rooms would impose different geography |
| gate-lasers | Modular Space | Military science-fiction language |
| conveyor | Factory | Production-line semantics would conflict with traffic meaning |

Twenty concrete model candidates evaluated, fifteen selected for the experiment;
none approved for runtime. Existing V3 server racks, cooling, core facilities,
state sprites and separate Azure badges are retained, not relicensed as Kenney.
