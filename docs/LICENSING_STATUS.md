# Licensing and Rights Status

Current status of asset rights and code licensing decisions tracked in #164.

## Asset Inventory Summary

| Category | Count | Provenance | Source | Rights Status |
|----------|-------|-----------|--------|---------------|
| Original V3 art | 61 | `original-v3` | `art/v3/core-facilities.mjs`, `environment-kit.mjs` | AI-assisted project original. No third-party game art, Microsoft paths or external textures. **Decision needed: code/art license** |
| Original buildings | 5 | `original-buildings` | `art/buildings/*.svg` | Project original SVG → PNG. **Decision needed: code/art license** |
| Azure service icons | 4 SVGs + 1 PDF | `azure-v24` | Microsoft Azure Architecture Icons | Microsoft terms apply. PDF retained at `assets/azure-icons/Microsoft_Terms_of_Use.pdf`. **Not covered by any project license** |

## Decisions Required (Owner)

### 1. Project code license

**Status:** Unselected

The repository is public source but has no LICENSE file. Common options:
- **MIT** — permissive, allows commercial use/modification with attribution
- **Apache 2.0** — permissive with patent grant
- **No license** — public source, all rights reserved (current default)

This applies to all `.ts`, `.tsx`, `.mjs`, `.json` and other code files authored for this project.

### 2. Original art license

**Status:** Unselected

66 original project artworks (V3 facilities + buildings) generated from project source code via `core-facilities.mjs` and `environment-kit.mjs`. Options:
- Same license as code
- Separate art license (e.g., CC BY 4.0, CC BY-NC 4.0)
- All rights reserved

### 3. Microsoft Azure icon terms

**Status:** Terms PDF retained, usage context to review

4 Azure service icon SVGs are used as UI badges. The Microsoft Terms of Use PDF is bundled. Key considerations:
- Are these icons used within the scope permitted by Microsoft's terms?
- Should they be excluded from any project-wide license grant?
- Is the current attribution sufficient?

**Action:** Review `apps/web/public/assets/azure-icons/Microsoft_Terms_of_Use.pdf` and confirm usage is within permitted scope, or replace with project-original icons.

### 4. Employer/Hackathon/IP obligations

**Status:** Requires human review

- Is this project covered by any employer IP agreement?
- Are there Hackathon-specific terms that affect distribution?
- Does public hosting require additional clearance?

**No AI legal determination is made here.** These require the owner's direct assessment.

## What is already done

- [x] GitHub secret scanning and push protection enabled (0 open alerts)
- [x] README distinguishes public source from licensed open source
- [x] Asset manifest (`art/asset-manifest.json`) tracks all 71 runtime assets with SHA-256 hashes
- [x] V3 art provenance documented in `art/v3/PROVENANCE.md`
- [x] Microsoft Terms PDF retained alongside Azure icons
- [x] `pnpm check:assets:release` intentionally fails until rights resolved
- [x] Pages demo authorized under narrow exception (`docs/PAGES_DEMO_EXCEPTION.md`)

## What blocks closure of #164

1. Owner selects a code license (or explicitly chooses "no license")
2. Owner selects an original art license (or same as code)
3. Owner confirms Azure icon usage context is within Microsoft terms
4. Owner assesses employer/Hackathon obligations (human review only)

Once these four decisions are recorded, #164 can be closed and `check:assets:release` can be updated to pass.
