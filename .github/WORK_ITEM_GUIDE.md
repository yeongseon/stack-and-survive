# Work-item templates

Use `.github/ISSUE_TEMPLATE/task.md` or `bug.md` for new issues and `.github/pull_request_template.md` for PRs. Web issue creation offers the templates; blank issues are disabled. CLI/API creation does not automatically fill a template: explicitly compose the same sections and marker.

Validate before publishing:

```sh
node scripts/check-work-item.mjs issue /absolute/path/to/issue-body.md
node scripts/check-work-item.mjs pr /absolute/path/to/pr-body.md
gh issue create --repo yeongseon/stack-and-survive --body-file /absolute/path/to/issue-body.md
gh pr create --repo yeongseon/stack-and-survive --body-file /absolute/path/to/pr-body.md
```

Every required section needs meaningful content or an explained exception (for example, “None — this pure documentation task has no predecessor”). A heading or `TBD` does not establish readiness. Review still checks completeness and factual correctness; passing the format check never proves tests ran or approval exists.

Retain the accepted issue labels and sequential workflow. For bugs include reproduction, expected/actual behavior and verification. For PRs link issues, explain changes, list actual checks and unrun checks, risks, and accurately identified review/approval. Do not automatically check acceptance boxes merely because an issue was closed.

## Repository checks

`Work item format` reports malformed bodies on issue and PR creation/edit events. PR validation uses `pull_request_target` **only with trusted base-branch code**, read-only permissions, no dependency installation and no checkout/execution of the PR head. The body is read from JSON, never interpolated into a shell command. Do not change this security boundary to run untrusted PR code.

The workflow reports format errors; it does not block issue creation or rewrite bodies automatically. No branch-protection or required-check setting is configured by adding the workflow. Developers/agents must inspect and fix failed format checks before treating work as ready for review.

## Existing-record alignment

The owner requested retroactive formatting of all existing issues and PRs, including closed/merged records. The migration:

- Copies identifiable original sections into shared fields; absent information is explicitly marked as not recorded.
- Preserves the entire prior body verbatim in a fenced archive, including checkboxes and old verification claims.
- Adds a retrospective notice so readers do not mistake old proposals or pending-check text for current facts.
- Does not change title, state, labels, assignees, milestone, comments, review records, commits or merge status.
- Does not synthesize linked issues or closing relationships from raw `#number` references. Only explicitly titled original linked-issue sections are quoted; other references remain in their original context.
- Creates a local, ignored backup with exact before/after bodies and hashes; keep it until the owner is satisfied.

```sh
node --test scripts/work-item-format.test.mjs
node scripts/migrate-work-items.mjs --plan
# Inspect the generated plan before the explicitly authorized update.
node scripts/migrate-work-items.mjs --apply /absolute/path/to/plan.json
node scripts/migrate-work-items.mjs --verify
```

The migration is repository-specific and opt-in. It checks each body and metadata again before writing and verifies readback afterwards. It aborts on a concurrently changed record rather than overwriting it knowingly; the API offers no atomic body compare-and-swap, so coordinate edits during migration. It can resume an interrupted plan when already-applied bodies match exactly. A second plan should propose zero changes. Backups must never be committed because issue content may be private.
