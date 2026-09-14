# V3 core source study

Original AI-assisted project artwork authored as editable geometry in `core-facilities.mjs`. No external game art, Azure SVG paths, fonts or textures are embedded. `preview.html` is an offline review surface, not a shipped runtime feature. SVG source is 640px and can be rasterized into PNG masters; the runtime is not constrained to procedural SVG.

License: **unselected**, like existing original project art; source authorship is not employer/IP/public-distribution clearance. #164 tracks decisions. No blanket license covers Microsoft materials. This source study is outside the existing runtime asset root and manifest; no existing PNG/SVG/hash or Pages exception was changed. Before importing any exported files into runtime, record source/output hashes, bounds, provenance and reviewed distribution scope in the asset manifest.

This is the first source iteration for #203, not completed Production Art V3. Human labels-hidden silhouette identification remains unperformed. App previews populate only 1–4 actual module positions; no fake production capacity/state is claimed.

Review: `pnpm exec vite art/v3 --host 127.0.0.1 --port 43876` then open `/preview.html`. Validate source with `node --test art/v3/core-facilities.test.mjs`. Export review PNGs with `node art/v3/export-review.mjs`; the ten 640x640 transparent rasters and source/hash/bounds inventory go only to ignored `art/v3/dist/`, never the runtime asset root. This inventory is a review artifact, not a substitute for the runtime manifest or distribution approval. Browser raster bytes may vary with the export toolchain; re-review before import.
