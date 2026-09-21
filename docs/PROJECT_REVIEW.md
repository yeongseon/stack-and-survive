# Whole-project review — 2026-09-21

This review separates **shipped runtime**, **implemented draft work**, **verification**, and **external acceptance**. It does not close human, rights, actual-model or deployment gates merely because code tests pass.

## Delivery summary

| Area | Evidence / state |
|---|---|
| Player game | Main runtime `c68ec0c`: rules 0.4 App/SQL scaling, compact SQL, world-local construction, mission HUD, service guide, bounded inspector, pause/camera, local results/history. No new blocker found in this read-only review. |
| Latest main docs | `faf5444`, PR #321 merged. Actual Pages 35551003162 ran build and deploy. Runtime behavior is unchanged from `c68ec0c`. |
| Presentation | English seven-slide deck/PDF, historical two-minute `24ca388` recording, current-feature 53.4-second `ff93cd6` local clip, participant worksheet and blank cohort summary delivered. No actual participant results fabricated. |
| Export / Learn | Draft #316 implemented: strict server-only AI request, copy/download/retry, curated links, 718 tests at earlier green `5ed4b9e`. This review adds fixes and integrates latest main; previous CI is not proof for the new head. |
| Agent | Stacked draft #323 implemented: model-selected bounded tools, actual local compile/property checks, repair limits, artifact hash and truthful traces. Earlier green `079be28` had 760 tests; new review corrections require new checks. |
| Cloud | Existing leaderboard App Service is in MCAPS. Current 0.4 API compatibility is blocked (#306); actual model accounts/settings were absent at the last read-only check. No new Azure resources or configuration changes performed. |

## Confirmed findings and dispositions

| Finding | Disposition / evidence |
|---|---|
| Export accepted action timeline could be sent unsorted and rejected by the server | Sort a filtered copy by `(time, sequence)` **before** truncating to 40; regression proves ordering, truncation and no mutation. |
| Parameter JSON lacked the intended UTF-8 byte budget | Enforce 12,000 bytes on server and client, independently of JS character length; multibyte regression added. |
| Browser fixture imported Vite types through a physical `node_modules` path | Re-export `createServer` from a helper inside the web package, using its declared `vite` dependency. No new dependency. |
| Suggested logging arbitrary unexpected AI errors | Not applied: existing hard boundary forbids new player telemetry, and error text can contain upstream/source/path data. Retain sanitized errors and request count; operational error taxonomy requires separate approval. |
| Agent property checker did not verify App `kind` or SQL child linkage | Follow-up #323 checks Linux plan/site kinds, current-tenant Entra administrators and child-resource parent names/dependencies; wrong-parent/platform counterexamples are added to actual compiler smoke. |
| Draft branches were behind current main documentation and inspector fixes | Integrate main into Export, then synchronize Agent with Export; preserve current docs and explicitly label branch-only AI behavior. No forced history rewrite. |

## Existing boundaries, not newly authorized redesigns

- File storage supports **one process/instance**. Cross-process locking/database migration is not implemented; scaling it out would violate the current documented deployment constraint.
- `TRUST_PROXY=true` depends on a trusted ingress sanitizing forwarded headers. It is not a universal anti-spoof guarantee. Per-IP limits do not stop rotated-IP quota abuse.
- Local pending leaderboard retry stores one latest submission. It is not a durable multi-run/multi-tab queue; local run history remains independent. Changing that storage contract is separate from read-only AI export.
- Browser CORS does not authenticate callers or replace network policy. A cached-origin response issue should be handled as a separate API hardening change, not silently mixed into a no-leaderboard-behavior-change feature.
- Agent's rejection of multiple calls in one response is **intentional**: `parallel_tool_calls:false`, one serial tool per turn and bounded execution are explicit contracts. A model response that ignores them fails closed.
- Compilation/property checking is not complete ARM semantic evaluation, production security, regional deployability or identity/network authorization. Compiler execution still requires operator-approved isolation before public enablement.

## Validation interpretation

Local/CI suites use mocked upstream model responses; hand-authored minimal and four-service fixtures compile with the real local Bicep CLI. The agent smoke uses real compile failure, then a **mocked** corrected candidate, then real compile/property success. These prove code/tool behavior, not that a live Azure model can produce or repair the template within the configured budget.

Run the following after integration and record exact-head outcomes in the PR rather than changing old test counts:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build:pages
pnpm --filter @stack-and-survive/leaderboard-api build
pnpm exec playwright test tests/e2e/export-azure.spec.ts
pnpm test:release
pnpm test:pages
git diff --check
```

## Merge / release gates

1. Resolve new code-review findings and integration conflicts; rerun checks at the exact updated head.
2. Preserve stacking order #316 → #323 and reconcile doc status when either merges. No automatic main merge from an older green check.
3. Actual finished-run → Azure model → generated Bicep compilation and operator compiler-isolation review are still outstanding. Missing credentials are a **blocker**, not a waiver.
4. #25/#195/#159 require real consented participant observations; #149 actual listening/device checks; #164 explicit rights decisions. #7/#152/#186 track these gates. Event rules, approval and submission confirmation remain external.

No award outcome, learning effectiveness, human approval, live AI service or cloud deployment is claimed by this review.
