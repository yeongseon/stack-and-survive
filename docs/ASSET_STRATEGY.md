# Asset strategy

Version: 1.0. Policy for Epic #142. Current originals and Azure files are documented in [ATTRIBUTION](../apps/web/public/assets/ATTRIBUTION.md). Automated manifest/import validation is #143, not yet implemented by this documentation.

## Sourcing policy

1. Prefer original/custom core App/SQL/Cache/Edge art and simple procedural environment/effects.
2. Prefer verified CC0 for useful external props/audio; CC0 is not a trademark/privacy warranty.
3. Consider CC-BY only where genuinely useful and compatible, with author/source/license/version/modification notices preserved.
4. No paid dependency. Free download does not imply permission to redistribute/modify. Reject unknown, incompatible or unverified rights; do not silently include NC/ND/SA obligations under an assumed CC0 policy.
5. Keep Microsoft Azure identifiers separate and under their own terms. Do not call them CC0 or cover them with a blanket future code license.

No competitor logos, screenshots, copied UI, characters, sounds or extracted assets. Named text references are comparative discussion, not an asset source. Public visibility does not establish downstream licensing rights; #164 owns human review.

## Build versus reuse

| Asset | Current basis | Next-pass target / owner |
|---|---|---|
| App and modules | Original SVG/PNG + physical bay projection | Larger original bay anatomy / #145 |
| SQL | Original data core + separate read/write cues | Original banks/core materials / #145 |
| Cache | Original compact facility | Memory-bank identity and actual hit state / #145, #148 |
| Edge | Original gateway | Pass-through/scanning state clarity / #145, #148 |
| Props | Procedural indoor equipment | Selected coherent free variants / #146 |
| Light/shadow | Procedural overlays | Reusable low-cost pools/shadows / #147 |
| Audio | None | Original synthesis or reviewed free cues / #149 |
| UI/title | Original React/CSS/SVG | Consistent materials and accessible controls |

Reuse only if perspective, pixels-per-unit, palette, contrast and lighting direction fit. Do not fill the floor randomly. No roads/cars/forklifts/trees/warehouse pallets. Background props frame the working aisle, not compete with interactive services.

## Required manifest record (#143)

Proposed record fields: stable asset ID; local source/output paths; origin (original/external); author/source URL; license identifier/version and local license-text path; download SHA-256; modification description; export tool/command/version; alpha bounds/anchor if applicable; intended role; attribution text/location; review status and known restrictions.

The implementation must distinguish nonredistributable candidates from approved runtime files. Preserve raw sources and terms; record every output derivation. No invented author/date/license fields. Missing source or unclear terms blocks import, not just a warning buried in a README.

Current layout: `art/buildings/` editable originals/bounds, `apps/web/public/assets/buildings/` PNGs, `azure-icons/` original badges/terms, and `ATTRIBUTION.md`. Future environment/audio directories are added only when real reviewed files exist. Generated scripts must not require secret tokens in source.

## Import and visual validation

Review original source/license and compare downloaded hash; confirm permitted use context. Convert copies reproducibly, never mutate official badges. Validate file types, dimensions, transparent padding, anchors, sprite bounds and file-size budget. Preserve procedural/missing-asset fallback and rerun badge hash tests.

Capture reachable normal/pending/active/pressure fixtures at five supported widths. Scale-out must show exact active server count; absent Cache/Edge cannot coexist with active art. Record memory/texture footprint and actual GPU behavior; use pooled textures rather than per-frame complex geometry.

## Audio / accessibility

Future audio starts only after an explicit user gesture, offers mute/volume and bounded cues, and cleans up on reset/pause/dispose as specified. Haptics are optional and feature-detected, never required to understand state. All audio/motion effects need visual/static equivalents. No event per simulated request or repetitive critical alarm spam.
