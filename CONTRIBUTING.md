# Contributing to Stack & Survive

Thanks for helping make the game clearer, more reliable and easier to develop. Start with the [README](README.md), [illustrated player guide](docs/PLAYER_GUIDE.md) and [development guide](docs/DEVELOPMENT.md).

## Important: rights and scope first

This repository is public source, but **no project-wide open-source license has been selected**. This guide explains the proposed contribution workflow; it does not grant a new reuse/distribution license or settle ownership of contributed work. Before submitting substantive code/art, discuss permission and contribution terms with the maintainer in an issue, particularly if employer or third-party material is involved. See [licensing status](docs/LICENSING_STATUS.md) and [#164](https://github.com/yeongseon/stack-and-survive/issues/164).

Do not add secrets, private telemetry, confidential employer material, paid/unverified game assets, or a blanket license over Microsoft assets. Keep attribution and original-source notices intact. No contributor should claim Microsoft endorsement or that game values are actual Azure prices.

## 1. Choose and discuss a focused change

- [Report a bug or propose a task](https://github.com/yeongseon/stack-and-survive/issues/new/choose) using the repository templates. Blank issues are disabled.
- Check [open PRs](https://github.com/yeongseon/stack-and-survive/pulls) and [the current tracker](https://github.com/yeongseon/stack-and-survive/issues/7) first. Do not duplicate finished work or overlap an actively owned world/UI/backend file without coordination.
- For a bug: include exact steps, expected/actual behavior, challenge/build if known, browser/device/viewport and a safe screenshot or console excerpt.
- For a change: define a small observable acceptance condition and what is explicitly out of scope. Discuss gameplay/balance, persistence, API, asset or deployment changes before implementing them.

A small documentation correction, reproducible bug report or focused regression test is more useful than an unrelated rewrite. Historical plans in `docs/archive/` are not queued implementation work.

## 2. Set up an isolated branch

After confirming permission/terms for your contribution, use a branch in a repository you are authorized to modify. Do not push directly to `main`.

```bash
git fetch origin
git switch -c fix/describe-the-change origin/main
pnpm install --frozen-lockfile
```

Use Node 22 and pnpm 10.32.1. [Development modes](docs/DEVELOPMENT.md#choose-the-right-application-mode) distinguish the player from the QA/editor; use the correct one for your change.

## 3. Implement within the right boundary

| Change | Required discipline |
|---|---|
| Player UI / accessibility | Preserve authoritative values, keyboard/focus, ARIA and action guards; verify relevant sizes and actual screenshots. |
| Simulation / balance | Start with failing numerical/replay tests; update the authoritative simulation contract and explicit version/compatibility decisions. Never silently retune expected results. |
| World / camera | Preserve state invariance and coordinate visual ownership; renderer effects cannot grant capacity or change time. |
| Leaderboard | Preserve qualification, nickname/API contracts and local fallback; never trust a client-supplied score. Use mock/local endpoints. |
| Assets | Provenance before import; retain unchanged third-party sources/terms and reviewed exact inventory. Integrity is not rights clearance. |
| Documentation | Describe implemented behavior, verify commands/links, cite the source revision for screenshots; label historical evidence. |

Follow [Engineering Rules](docs/ENGINEERING_RULES.md). Avoid broad refactors, new dependencies or generated media unrelated to your change. A screenshot/video should illustrate actual state, not fabricated metrics. The [capture workflow](docs/DEVELOPMENT.md#screenshots-and-demo-evidence) is available for UI evidence.

## 4. Verify the change

Run the fast baseline and the tests affected by your change:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
git status --short
```

Use the [test matrix](docs/DEVELOPMENT.md#tests-build-the-artifact-that-the-test-consumes) for production-player, QA, API/identity, Pages and asset checks. Build the matching artifact before browser tests. Real-time gameplay suites take minutes; do not disable assertions, skip tests or widen tolerances simply to get green CI.

For UI changes, actually use the feature: click, tab, pause/resume, inspect results and test the relevant desktop/landscape sizes. Include screenshots when they clarify the result. Record tests **not run** and why. Automated/AI review is not human participant, listening, device or legal acceptance.

Before committing, exclude `.env`, credentials, local configuration, test artifacts, videos and unnecessary generated assets. Keep implementation and its direct tests together; split independent changes into reviewable commits. Do not force-push shared branches, rewrite others' history or skip hooks.

## 5. Open a pull request

Use [the PR template](.github/pull_request_template.md) and preserve its `<!-- stack-survive:pr:v1 -->` marker. Required sections are:

1. **Summary** — why and intended outcome.
2. **Linked Issues** — related acceptance unit; use `Closes #N` only if every criterion is actually met.
3. **Changes** — what changed, including documentation/compatibility effects.
4. **Verification** — commands, actual results, screenshots and known untested areas.
5. **Risks and Boundaries** — persistence, rollback, assets and external-service implications.
6. **Review and Approval** — distinguish self-review, automated review and actual human approval.

See the [work-item guide](.github/WORK_ITEM_GUIDE.md) for issue/PR format checks. Those checks run trusted base-branch code; do not introduce untrusted PR execution into privileged workflows.

Respond to review feedback with focused changes and rerun affected checks. Maintainers decide whether to merge. Passing CI does not itself authorize deployment, domain changes, Azure operations or new asset distribution. For a released change, verify the exact merged SHA's Quality and actual Pages deploy job—not only the PR build.

## Help with acceptance without inventing it

Real unfamiliar-player feedback, voluntary replay and listening/device checks are useful contributions when consent and observations are recorded accurately. Use [the human worksheet](docs/submission/HUMAN_TEST_SCRIPT.md) and [audio guide](docs/AUDIO_FEEDBACK.md). Do not prompt someone to replay and then describe the choice as voluntary, or post identifying/private participant data.

When uncertain about scope or rights, ask in the relevant issue before uploading content. Maintainer coordination is preferable to an irreversible final-day change.
