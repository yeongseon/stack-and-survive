# Original V3 facilities and environment

Original AI-assisted project artwork, authored in `core-facilities.mjs` and `environment-kit.mjs`. No third-party game artwork, Microsoft icon paths or external fonts/textures are embedded. The earlier industrial source sheet is a draft; the integrated hero pass uses processing pods/chassis, a SQL vault/crown and ingress portal, with separate state layers.

## Approved demo inventory, not general rights clearance

The owner explicitly selected **“V3 데모 예외 승인 (Recommended)”** after reviewing the original V3 art and unresolved rights boundaries. Production/Pages use 61 registered PNGs in `apps/web/public/assets/v3/`, paired with editable/exported SVG sources in `art/v3/sources/` and geometry in `runtime-inventory.json`. The exact expanded manifest hash is pinned in `docs/PAGES_DEMO_EXCEPTION.md`. Older building PNGs and Microsoft badges/terms remain unchanged.

License: **unselected**. This authorizes this project's Pages demo only, not a general art license, Microsoft permission or employer/IP clearance. #164 and actual-human acceptance remain open. Future asset byte changes require reviewed inventory scope; `register-runtime.mjs` deliberately does not change the approval pin. Microsoft materials are not covered by project art licensing.

## Reproduction and validation

- `pnpm test:art`: original source and geometry contracts.
- `node art/v3/export-review.mjs`: 61 transparent 640x640 review PNGs with hashes/bounds in ignored `art/v3/dist/`.
- `node art/v3/register-runtime.mjs`: register explicitly reviewed output/source bytes and runtime geometry before import; does not approve future changes.
- `pnpm check:assets:v3`: verify generator/source/PNG/manifest/geometry identity.
- `node art/v3/verify-review.mjs`: static sheet, label-free rendering and 48 scene-state combinations at1440/390/1920; ignored screenshots under `dist/evidence/`.
- `node art/v3/verify-playable.mjs`: actual local Phaser builds, App overload, SQL read-only pressure, Edge filtering, paused landscape and Fit; ignored screenshots under `dist/playable-evidence/`.
- `pnpm --filter @stack-and-survive/web exec vite --mode art-preview --host 127.0.0.1`: optional local source-export review in the real game. Normal production uses registered assets; QA/editor retains existing art. Never treat a tunnel as extra distribution permission.

Chromium rasterization can vary by toolchain. Inspect changed bytes before registration. Base/overlay images share a640-unit origin; `coreGeometry` records footprints, bay centers and standalone module offsets. Tests check offset arithmetic; actual player evidence checks installed module counts and physical clicks. The standalone sheet is not gameplay or proof of human identification.

## Truthful layer integration

Available/locked/queued/construction overlays contain no active modules. Only authoritative active instances create App modules. Six inactive Cache/Edge deployment studies distinguish foundation/frame/boot. SQL read/write warnings use separate measured states; the combined critical texture requires both sides over capacity. Fans require actual accepted App work, filtering requires actual filtered bots, Cache pulses require real hits. Reduced motion preserves static meaning and Pause stops live work effects.

The original20-piece environment kit is decorative; the refined hall has 72 instances in distinct fixed cooling/rack/power sectors outside protected facility envelopes. Placement changes do not modify approved asset bytes. Representative packet pooling and existing routing/endpoints remain authoritative. No new capacities, queues, economic metrics, score changes or gameplay mechanics are introduced. Successful tests and owner demo authorization do not certify aesthetic completion or unfamiliar-player game feel.
