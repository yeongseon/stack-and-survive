import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headings, marker, migrateBody, originalArchive, sections, validateBody } from './work-item-format.mjs';

test('new bodies require real sections, not placeholders or headings inside code', () => {
  assert.ok(validateBody('issue', `${marker('issue')}\n\`\`\`\n## Purpose\npretend\n\`\`\``).length);
  const valid = `${marker('pr')}\n${headings.pr.map(h => `## ${h}\nExplicitly described content for ${h}.`).join('\n')}`;
  assert.deepEqual(validateBody('pr', valid), []);
  assert.ok(validateBody('pr', valid.replace('Explicitly described content for Verification.', '<!-- add evidence -->')).length);
  assert.ok(validateBody('pr', `${valid}\n## Summary\nDuplicate.`).length);
});
for (const kind of ['issue', 'pr']) {
  test(`${kind} migration preserves original exactly, adds no completion and is idempotent`, () => {
    const item = { number: 12, title: 'Existing work', body: 'Closes #8.\n\n## Verification\nNot run.\n\n## Acceptance\n- [ ] Still pending\n\n```md\n## Scope\nExample only\n```\n~~~~\n한글 원문\n' };
    const migrated = migrateBody(kind, item);
    assert.ok(migrated.includes(originalArchive(item.body)));
    assert.deepEqual(validateBody(kind, migrated), []);
    assert.equal(migrateBody(kind, { ...item, body: migrated }), migrated);
    assert.ok(!migrated.includes('- [x]'));
    assert.ok(migrated.includes('Not run.'));
  });
}
test('heading parser respects fenced examples', () => {
  assert.deepEqual(sections('## Real\n~~~~text\n## Fake\n~~~~').filter(s => s.heading).map(s => s.heading), ['Real']);
});
test('missing historical evidence is explicit rather than invented', () => {
  const migrated = migrateBody('pr', { number: 3, title: 'Example', body: '' });
  assert.ok(migrated.includes('Not separately recorded as a linked-issue section'));
  assert.ok(migrated.includes('Not separately recorded'));
});
test('arbitrary issue mentions are not synthesized into linked relationships', () => {
  const migrated = migrateBody('pr', { number: 4, title: 'Existing PR', body: 'Do not close #12. Example #99 is unrelated.' });
  const linked = sections(migrated).find(s => s.heading === 'Linked Issues').content;
  assert.ok(!linked.includes('#12')); assert.ok(!linked.includes('#99'));
});
