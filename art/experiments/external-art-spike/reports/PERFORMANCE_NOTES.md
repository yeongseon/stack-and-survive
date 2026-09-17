# Performance and storage — estimates, not hardware measurements

| Item | Actual / estimate |
|---|---|
| New production runtime textures | **0** |
| Production texture dimensions/bytes/sprite count/draw calls | Unchanged |
| Selected GLBs | 15 files, 271,636 bytes total |
| Candidate folder including licenses/previews | About 371 KB; exact recomputed count in comparison/metrics.json |
| Blender instances | 18 placements; repeated models reused semantically |
| Render PNG | 2400×1350 RGBA, 1,563,595 bytes in this run |
| Raw RGBA8 GPU estimate | 12,960,000 bytes = 12.36 MiB, no mipmaps |
| Full mip-chain estimate | Approximately 16.48 MiB, allocator/driver overhead excluded |
| Export | Cycles CPU, 16 samples, denoise; roughly 47 seconds on this host |

The experiment composites the transparent render into the **existing** background
canvas in browser memory and uploads that existing texture. It does not create
18 Phaser sprites. The two original 2400×1350 background/foreground textures are
already present. A future combined background would have the same base dimensions
and likely texture/draw count, with different encoded PNG bytes and loading cost.
An additional separately drawn layer instead would add about12.36MiB GPU storage,
an image object and potentially a batch/draw boundary. Do not assume one image
always equals one draw call; actual batching requires a renderer trace.

Browser decoded PNG, `ImageData` backup and existing canvas each cost approximately
12.36MiB during capture; temporary JS memory can exceed the incremental runtime
cost. This is experiment overhead, not a production architecture recommendation.

No GPU allocation measurement, draw-call trace, hardware FPS, mobile-device test
or texture-atlas benchmark was performed. Software WebGL screenshots establish
rendered appearance only. Keep one baked environment and existing independent
heroes/traffic/overlays if a future spike earns PASS. Do not ship individual large
PNG files for every prop, do not add runtime GLB loaders, and do not rewrite Phaser.

ZIP archives total roughly13MB and remain outside Git. Portable Blender is about
378MB compressed and is also excluded. Source scripts rebuild the Blender scene;
no large binary `.blend` is required. Comparison PNGs are intentionally review
evidence and are not loaded by the app or included in Pages' public asset inventory.
