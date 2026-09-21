# Current implementation and release status

## Latest merge and media checkpoint — 2026-09-21

Narration/palette refinement (#330): the same personal eight-slide story now uses the earlier dark navy/teal/warm-yellow colors and stock `en-US-GuyNeural` at default rate/pitch. This replaces the rejected basic macOS voice; public narration text is sent through the separately opted-in Edge TTS tool, not a provisioned Azure service. [Listening sample](media/narration-sample.mp3) and voice/text/file hashes accompany the video. This records the actual generated provider voice, not a human naturalness or usage-rights approval. No game/runtime/cloud configuration changes.

**Source `a6f6956` includes merged #316 Export/Learn and #323 Agent.** Owner approved code-first merge with separate activation; implementation #315/#322 is closed and actual AI model/configuration/isolation acceptance lives in #325. The older unmerged/draft statements below describe the pre-merge review and are superseded by this checkpoint. AI Coach remains separate. No live model or cloud provisioning was performed.

Latest confirmed hosted deployment at capture time was docs-only `faf5444`, actual Pages 35551003162 (gameplay baseline `c68ec0c`). Do not infer a later deployment from a merge. Export reviewed head `db34045` passed 721 tests/Quality 35560038290; Agent `c31298b` passed 764 tests/Quality 35560038523 and rerun 35560038214. The initial timing race remains #324, not erased by rerun success.

**Latest presentation media (#328):** an [eight-slide personal story and matching two-minute video](DEMO_VIDEO.md#two-minute-project-introduction--current-source), using unchanged [19 actual `a6f6956` screenshots](images/README.md). The story credits Microsoft Learn, asks what to change and ends with a modest first-step goal; Agent is Q&A only. Audience frames contain no internal production labels. A synthetic draft voice is provided, with presenter-recorded WAV support. Source evidence stays in sidecar files; this is not a live game/model demonstration or human validation.

Snapshot: **2026-09-21**, audited against merged runtime **`c68ec0cb7a894f6ffd909d7ab7804a425a456dd5`**. This is a dated checkpoint, not a promise that a remote service will remain healthy. Numerical rules belong to [Simulation](SIMULATION_SPEC.md) and [Infrastructure scaling](INFRASTRUCTURE_SCALING.md); this page owns the current release/branch distinction.

Review update: docs-only main `faf5444` also completed actual Pages build/deploy 35551003162; gameplay remains the `c68ec0c` baseline. This working branch contains unmerged Export #316 with later review fixes. Its previously green head `5ed4b9e` below is historical check evidence, not proof of validation for newer commits. Stacked Agent #323/#322 is also unmerged and requires actual model/operator acceptance. See `docs/PROJECT_REVIEW.md` for the whole-project review findings and new verification results.

## Implemented and deployed

- Ordinary game: rules **0.4**, version-2 challenges; three objectives on the same deterministic 180-second Black Friday workload. Legacy 0.2/0.3 fixtures and storage identities remain separate.
- App: 1–4 instances, scale-out/in, three tiers. SQL: three tiers and 0–2 read replicas. Cache and Protected Edge: one installation each. Activation delays, not clicks or animation, change capacity and cost.
- Always-visible **App scaling / SQL scaling** buttons, facility inspection and direct construction. Disabled actions explain limits; queued requests and construction are distinct. SQL visual size is 58% / 78% / 100% by active tier. Inspector width and height stay bounded.
- Unified mission HUD, measured wave/activation/risk feedback, camera zoom/pan/Fit, landscape gate, optional guide/tutorial, Settings/Pause, default-muted optional synthesis/haptics. **Azure service guide** is a multi-service reference/inspection catalog, not an App-only control.
- Local history, objective progress, profiles, comparisons, rankings and explicit player-name/Join flow. The optional global API is independent of local gameplay.
- Original V3 runtime art remains; #245 is merged archived experiment evidence, not adopted replacement art. Source visibility does not resolve rights.

Release evidence: [exact-main Quality 35517501080](https://github.com/yeongseon/stack-and-survive/actions/runs/35517501080) passed, including 672 unit tests and full browser suites. [Pages 35522927900](https://github.com/yeongseon/stack-and-survive/actions/runs/35522927900) actually ran **build and deploy** for this SHA; duplicate run 35522924305 skipped deployment and is not deployment proof. Public smoke confirmed guide wording, panel bounds and focus return, with zero page errors/public score POSTs.

## Optional API: source support is not deployed compatibility

- Configured public origin: `https://stack-survive-mcaps-ychoe.azurewebsites.net` (GitHub `LEADERBOARD_API_URL`). MCAPS resource group `rg-stack-survive` contains `plan-stack-survive` and `stack-survive-mcaps-ychoe`.
- Merged API code supports the 0.4 ladder and distinct legacy 0.3 ladder. Latest read-only check: current hash `fnv1a64:429acdb090861edf` returns **400 Unsupported challenge**; earlier 0.3 reads worked. Thus **#306 remains blocked** on authorized backend rollout, not missing frontend code.
- Existing single-worker Node 22 App Service uses file storage `/home/data/leaderboard.json`. Deployment metadata access returned 403. No access controls were weakened and no restart/data reset/public test score was performed.
- Recorded continuous retention is not actual restart-event durability evidence. Historical backend evidence must retain its date/source and limitations.

## Implemented only in an unmerged draft: Export to Azure and Learn links

[PR #316](https://github.com/yeongseon/stack-and-survive/pull/316), head `5ed4b9e`, is **draft, not merged or deployed**. It implements post-run Bicep/rationale generation through a server-only Azure OpenAI Responses proxy, optional result copy/download/retry, and curated official Microsoft Learn links. It never deploys resources or changes simulation/scoring/replay. It is independent of the unmerged AI Coach branch.

That branch passed 718 unit tests, strict web/API types, builds, targeted browser checks and [full Quality 35507321158](https://github.com/yeongseon/stack-and-survive/actions/runs/35507321158). Hand-authored minimal and four-service Bicep fixtures compile; **real played-run → Azure OpenAI → generated Bicep compilation is unverified**. MCAPS AI account inventory and App Service `AZURE_OPENAI_*` settings were empty at the check. No resources/settings were created. These branch-only checks/features are not main's test count or live feature set. See #315 for remaining configuration/real-model/human-review gates.

## Presentation evidence

| Material | Source and limits |
|---|---|
| [53.4-second tradeoff clip](DEMO_VIDEO.md#current-rules-04-the-bottleneck-tradeoff) | `ff93cd6`, rules 0.4, continuous automated local gameplay; last inspection paused, not a completed run. Code incorporated through #319. Uploaded and anonymously accessible; hash in manifest. |
| [120-second overview](DEMO_VIDEO.md#historical-two-minute-overview--rules-03) | `24ca388`, rules 0.3, edited from two runs; historical, not current-interface proof. |
| [README/player-guide images](images/README.md) and [seven-slide deck](../showcase/README.md) | Historical `24ca388` captures, with separately documented captions/provenance. |
| [Participant worksheet](submission/HUMAN_TEST_SCRIPT.md) / [cohort summary](submission/HUMAN_TEST_SUMMARY.md) | Blank preparation, no participant results. Keep completed records private and consent-scoped. |

## Remaining open work

| Issue | What is actually missing |
|---|---|
| #306 | Authorized compatible API deployment and fresh verification; restart durability remains separate. |
| #315 / draft #316 | AI resource/model/settings, real model smoke/compiler evidence and human review; no provisioning authorization inferred. |
| #25 / #195 / #159 | Actual consented unfamiliar-player comprehension, game-feel/navigation and voluntary replay observations. |
| #186 / #152 | Parent acceptance for #195 / #159, not additional unimplemented software. |
| #149 | Actual listening and supported physical-device vibration checks. |
| #164 | Explicit code/art license, Azure terms and employer/event/public-distribution decisions. |
| #7 | Master gate plus official event requirements, final approval and submission confirmation. |

Issues #313/#314/#317 are delivered via #319/#318. Public media availability, software tests and owner feedback do not substitute for participant evidence, legal approval or event submission. [Documentation audit](DOCUMENTATION_AUDIT.md) records coverage and retained historical material.
