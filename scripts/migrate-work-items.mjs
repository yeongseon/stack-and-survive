import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { migrateBody, validateBody } from './work-item-format.mjs';

const repository = 'yeongseon/stack-and-survive';
const [command, filename] = process.argv.slice(2);
const hash = value => createHash('sha256').update(value).digest('hex');
function gh(args, input) {
  const result = spawnSync('gh', args, { encoding: 'utf8', input, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || `gh failed: ${result.status}`);
  return JSON.parse(result.stdout);
}
function metadata(item) {
  return { title: item.title, state: item.state, state_reason: item.state_reason,
    labels: item.labels.map(label => label.name).sort(), assignees: item.assignees.map(user => user.login).sort(),
    milestone: item.milestone?.number ?? null };
}
const current = number => gh(['api', `repos/${repository}/issues/${number}`]);
const inventory = () => gh(['api', `repos/${repository}/issues?state=all&per_page=100`, '--paginate', '--slurp']).flat();

if (command === '--plan') {
  const items = inventory().map(item => {
    const kind = item.pull_request ? 'pr' : 'issue';
    const before = item.body ?? ''; const after = migrateBody(kind, item);
    return { number: item.number, kind, metadata: metadata(item), before, after, beforeSha256: hash(before), afterSha256: hash(after) };
  });
  const directory = resolve('.work-item-backups'); mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, `plan-${Date.now()}.json`);
  writeFileSync(path, JSON.stringify({ repository, created: new Date().toISOString(), items }, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ plan: path, issues: items.filter(i => i.kind === 'issue').length, prs: items.filter(i => i.kind === 'pr').length,
    changes: items.filter(i => i.before !== i.after).map(i => ({ number: i.number, kind: i.kind, oldBytes: Buffer.byteLength(i.before), newBytes: Buffer.byteLength(i.after) })) }, null, 2));
} else if (command === '--apply' && filename) {
  const plan = JSON.parse(readFileSync(filename, 'utf8'));
  if (plan.repository !== repository || !Array.isArray(plan.items)) throw new Error('Unexpected migration plan');
  for (const item of plan.items) {
    if (!Number.isSafeInteger(item.number) || item.number < 1 || !['issue', 'pr'].includes(item.kind)) throw new Error('Invalid plan record');
    if (hash(item.before) !== item.beforeSha256 || hash(item.after) !== item.afterSha256) throw new Error('Plan checksum mismatch');
    if (item.after !== migrateBody(item.kind, { number: item.number, title: item.metadata.title, body: item.before })) throw new Error('Plan no longer matches formatter');
    if (validateBody(item.kind, item.after).length) throw new Error('Plan contains an invalid formatted body');
  }
  for (const item of plan.items) {
    const before = current(item.number);
    if (JSON.stringify(metadata(before)) !== JSON.stringify(item.metadata)) throw new Error(`#${item.number}: metadata changed; re-plan before continuing`);
    const body = before.body ?? '';
    if (body !== item.after) {
      if (hash(body) !== item.beforeSha256) throw new Error(`#${item.number}: body changed concurrently; refusing overwrite`);
      gh(['api', '--method', 'PATCH', `repos/${repository}/issues/${item.number}`, '--input', '-'], JSON.stringify({ body: item.after }));
    }
    const after = current(item.number);
    if (after.body !== item.after || JSON.stringify(metadata(after)) !== JSON.stringify(item.metadata)) throw new Error(`#${item.number}: readback mismatch`);
    console.log(`Verified ${item.kind} #${item.number}; original and metadata preserved.`);
  }
} else if (command === '--verify') {
  const items = inventory();
  const failures = items.flatMap(item => validateBody(item.pull_request ? 'pr' : 'issue', item.body ?? '').map(error => ({ number: item.number, error })));
  console.log(JSON.stringify({ issues: items.filter(i => !i.pull_request).length, prs: items.filter(i => i.pull_request).length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
} else throw new Error('Usage: node scripts/migrate-work-items.mjs --plan | --apply <plan.json> | --verify');
