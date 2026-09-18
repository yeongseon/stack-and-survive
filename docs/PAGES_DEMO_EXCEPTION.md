# Owner-directed GitHub Pages demo exception

The owner explicitly requested GitHub Pages hosting and selected **“데모 배포 예외 승인”** after being informed that asset release checks fail because rights review is unresolved. This decision authorizes this project's existing-asset Pages demo only; it is **not** Microsoft permission, a project license grant, employer/brand-policy clearance or a general asset-release approval.

- Repository: `yeongseon/stack-and-survive`
- Scope: ordinary production browser demo for this repository's GitHub Pages project path, linked as `https://yeongseon.github.io/stack-and-survive/`. This project has no CNAME/custom-domain configuration. A previous inherited account-domain redirect was removed in a separate, explicitly owner-approved parent Pages configuration change; the game now serves directly on `github.io`. This document does not authorize further domain changes. Project-relative asset base remains `/stack-and-survive/`.
- Approved inventory: `art/asset-manifest.json`, SHA-256 `0c4b7e818db39b6528223bc6dabc95ab496d1fbc6ac1343cc07879a42ded5d89`
- Explicit V3 extension: after being informed that this does not resolve project/Microsoft/employer rights, the owner selected **“V3 데모 예외 승인 (Recommended)”**. This adds the reviewed 61 original V3 PNGs and their separately recorded sources; five existing building PNGs and unchanged Microsoft badges/terms remain in the inventory. The former inventory hash was `890384dc95525752b9d61d9ecc176746ca3e1d892b0862681308a1be4815c3b1`. This approval is still specific to the project Pages demo, not a blanket license.
- Rights records stay `rights-pending`. `pnpm check:assets:release` must continue to fail until appropriate review resolves them.
- `pnpm check:assets:demo` requires the exact inventory hash and validates every existing source/output hash and path. Asset changes require a newly reviewed exception, not automatic expansion of this decision.
- Deploy only `dist-pages` built in production mode, never `dist-qa`, private data, credentials or raw runtime diagnostics.
- Human/rights issue #164 stays open. Future assets, commercial marketing or other distribution contexts are outside this narrow exception.

Deployment runs after successful Quality workflow on the current main commit. It rechecks demo inventory, builds with the project base path and uses the GitHub Pages deployment environment. Untrusted pull requests cannot deploy. The website field/README identify the demo URL, not a claim of legal approval.
