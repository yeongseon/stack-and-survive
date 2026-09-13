# Asset strategy

Version: 1.1. Policy for Epic #142. Current originals and Azure files are documented in [ATTRIBUTION](../apps/web/public/assets/ATTRIBUTION.md). The inventory/validation implementation for #143 uses [art/asset-manifest.json](../art/asset-manifest.json) and [scripts/asset-manifest.mjs](../scripts/asset-manifest.mjs).

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

Manifest version 1 separates reusable provenance records from individual output files. Fields include stable asset ID; source/output paths and SHA-256; origin (original/external); author/source URL; license identifier/version and local evidence path; archive URL/SHA-256 and member path for imports; modification description; export command/toolchain; bounds-key reference when applicable; intended role; attribution/evidence location; review status and restrictions. Commands are documentation strings and are never executed by validation. No network fetch occurs during checks.

New external runtime files require an approved CC0-1.0 or CC-BY-4.0 declaration with local license/review evidence; CC-BY additionally requires explicit attribution text. Unreviewed candidates stay outside public runtime assets and outside the approved inventory. Approval fields document a human decision; the checker cannot decide legal applicability or verify the truth of a license declaration.

Existing owner-directed Azure V24 files have a narrow exception in integrity mode: only the five exact IDs, local paths, archive member paths and hashes from the pinned V24 archive may retain their current `rights-pending` declaration. This is **not** an import permission or clearance. Original buildings have `LicenseRef-Project-Unselected`, also pending. `pnpm check:assets:release` currently fails intentionally for all ten files until #164 resolves rights and the policy/manifest is explicitly reviewed. Do not change pending to approved just to make the command green.

Current layout: `art/buildings/` editable originals/bounds, `apps/web/public/assets/buildings/` PNGs, `azure-icons/` original badges/terms, and `ATTRIBUTION.md`. Future environment/audio directories are added only when real reviewed files exist. Generated scripts must not require secret tokens in source.

## Import and visual validation

Review original source/license and compare downloaded hash; confirm permitted use context. Convert copies reproducibly, never mutate official badges. Validate file types, dimensions, transparent padding, anchors, sprite bounds and file-size budget. Preserve procedural/missing-asset fallback and rerun badge hash tests.

Implemented commands:

- `pnpm test:assets`: isolated fixture tests for schema, rights declarations, hashes, local path/symlink safety, inventory completeness and PNG metadata.
- `pnpm check:assets`: complete runtime asset-file inventory plus declared output/source hash checks; pending-rights warnings are expected for retained assets. CI runs this check.
- `pnpm check:assets:release`: same integrity checks plus rejection of every unresolved rights record. This is a separate explicit gate, not the ordinary CI command and not an automatic release/deployment step.

General release/deployment must run `check:assets:release` as a required pre-publication gate and enforce the human rights decision in #164. The owner separately approved one [GitHub Pages demo exception](PAGES_DEMO_EXCEPTION.md) for the exact existing manifest; that workflow instead requires `check:assets:demo`, which pins the approved inventory and validates every source/output. It does not approve rights or future assets, and general release checks remain failing. Ordinary quality CI must not be mislabeled as release approval.

PNG checks validate header dimensions and metadata consistency, not complete decoding, actual alpha measurement or legal safety of arbitrary content. Existing browser sprite tests own rendered alpha/bounds and corrupted-file fallback. SHA-256 makes changes detectable, not trustworthy: review both changed files and manifest. Local evidence paths must remain regular, nonsymlink files inside the repository. Runtime inventory allows only its explicit manifest entries plus `ATTRIBUTION.md`.

Export maintenance: regenerate original SVG/PNG with the existing script, inspect results, then intentionally update source/output hashes in this manifest and the generated bounds metadata. Automatic rebaselining of hashes is intentionally absent. Keep license/review records and immutable sources; never download unknown art into public assets to evaluate it.

## Candidate selection before the baseline

No external pack is selected, downloaded or approved by #143. The current shortlist is original building-source reuse (consistent perspective, existing measured bounds and five reused 512×512 textures) and procedural indoor-prop variants (no additional texture download or rights dependency). #145/#146 may propose external alternatives only when they improve a specific silhouette/material/prop need after #25 baseline findings. Each proposal must record expected file/texture budget and why the existing originals cannot serve that need. A source website being popular or advertising free assets is not an approval.

Owner-directed gameplay visual continuation used the original/procedural option for #146 rather than importing another pack. `playerFacilityLayout` deterministically selects rack, cooling and electrical-cabinet variants around the aisle and excludes their complete body/roof/shadow envelopes from all potential facility, badge and control zones. Small viewports use compact wall equipment. The environment adds no downloaded textures or runtime asset files and remains cached by viewport; the existing manifest and Pages demo exception are unchanged. This is an implementation choice, not a claim of external asset licensing or completion of human baseline #25.

Capture reachable normal/pending/active/pressure fixtures at five supported widths. Scale-out must show exact active server count; absent Cache/Edge cannot coexist with active art. Record memory/texture footprint and actual GPU behavior; use pooled textures rather than per-frame complex geometry.

## Audio / accessibility

Future audio starts only after an explicit user gesture, offers mute/volume and bounded cues, and cleans up on reset/pause/dispose as specified. Haptics are optional and feature-detected, never required to understand state. All audio/motion effects need visual/static equivalents. No event per simulated request or repetitive critical alarm spam.
