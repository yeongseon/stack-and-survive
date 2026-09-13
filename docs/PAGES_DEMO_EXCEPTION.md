# Owner-directed GitHub Pages demo exception

The owner explicitly requested GitHub Pages hosting and selected **“데모 배포 예외 승인”** after being informed that asset release checks fail because rights review is unresolved. This decision authorizes this project's existing-asset Pages demo only; it is **not** Microsoft permission, a project license grant, employer/brand-policy clearance or a general asset-release approval.

- Repository: `yeongseon/stack-and-survive`
- Scope: ordinary production browser demo for this repository's GitHub Pages project path. GitHub reports the existing account-domain URL `https://yeongseon.dev/stack-and-survive/`; the default `https://yeongseon.github.io/stack-and-survive/` may redirect there. No account domain configuration is changed by this work.
- Approved existing inventory: `art/asset-manifest.json`, SHA-256 `890384dc95525752b9d61d9ecc176746ca3e1d892b0862681308a1be4815c3b1`
- Rights records stay `rights-pending`. `pnpm check:assets:release` must continue to fail until appropriate review resolves them.
- `pnpm check:assets:demo` requires the exact inventory hash and validates every existing source/output hash and path. Asset changes require a newly reviewed exception, not automatic expansion of this decision.
- Deploy only `dist-pages` built in production mode, never `dist-qa`, private data, credentials or raw runtime diagnostics.
- Human/rights issue #164 stays open. Future assets, commercial marketing or other distribution contexts are outside this narrow exception.

Deployment runs after successful Quality workflow on the current main commit. It rechecks demo inventory, builds with the project base path and uses the GitHub Pages deployment environment. Untrusted pull requests cannot deploy. The website field/README identify the demo URL, not a claim of legal approval.
