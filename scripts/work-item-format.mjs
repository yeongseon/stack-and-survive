export const headings = {
  issue: ['Purpose', 'Scope', 'Acceptance Criteria', 'Dependencies', 'Verification', 'Risks and Boundaries'],
  pr: ['Summary', 'Linked Issues', 'Changes', 'Verification', 'Risks and Boundaries', 'Review and Approval'],
};
export const marker = kind => `<!-- stack-survive:${kind}:v1 -->`;

export function sections(body) {
  const result = []; let current = { heading: '', lines: [] }; let fence = null;
  for (const line of body.split('\n')) {
    const token = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (token) {
      if (!fence) fence = token[1];
      else if (token[1][0] === fence[0] && token[1].length >= fence.length) fence = null;
    }
    const heading = !fence && line.match(/^## (.+?)\s*$/);
    if (heading) { result.push(current); current = { heading: heading[1], lines: [] }; }
    else current.lines.push(line);
  }
  result.push(current);
  return result.map(section => ({ heading: section.heading, content: section.lines.join('\n').trim() }));
}

export function validateBody(kind, body) {
  if (!headings[kind]) throw new Error('Unsupported work-item kind');
  const errors = [];
  if (!body.includes(marker(kind))) errors.push('Missing template version marker');
  const found = sections(body);
  for (const heading of headings[kind]) {
    const matches = found.filter(section => section.heading === heading);
    if (matches.length !== 1) { errors.push(`Expected one section: ${heading}`); continue; }
    const content = matches[0].content.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!content || /^(TBD|TODO|N\/A|None|Define the observable result and how it is checked\.)[.!]?$/i.test(content.replace(/^- \[ \]\s*/, ''))) {
      errors.push(`Provide meaningful content or an explained exception: ${heading}`);
    }
  }
  return errors;
}

const aliases = {
  issue: {
    Purpose: /^(purpose|goal|context|problem|summary)$/i,
    Scope: /^(scope|changes|acceptance of this tracking issue|coverage|current direction)$/i,
    'Acceptance Criteria': /^(acceptance|acceptance criteria|success criteria|definition of done)$/i,
    Dependencies: /dependenc|execution|prerequisite|order|current gate/i,
    Verification: /verif|testing|test plan|evidence/i,
    'Risks and Boundaries': /risk|boundar|exclusion|constraint|limit|remaining gate|non.goal/i,
  },
  pr: {
    Summary: /^(summary|changes|reproduced problem)$/i,
    Changes: /^(changes|fix|audit fixes|summary)$/i,
    Verification: /verif|performance|evidence/i,
    'Risks and Boundaries': /risk|boundar|limit|scope|next|priority|rights/i,
    'Review and Approval': /review/i,
  },
};

export function originalArchive(body) {
  let fence = '~~~~';
  while (body.includes(fence)) fence += '~';
  return `<details>\n<summary>Original description preserved verbatim (before template alignment)</summary>\n\n${fence}text\n${body}\n${fence}\n\n</details>`;
}

export function migrateBody(kind, item) {
  const body = item.body ?? '';
  if (body.includes(marker(kind))) {
    const errors = validateBody(kind, body);
    if (errors.length) throw new Error(`#${item.number}: existing template invalid: ${errors.join('; ')}`);
    return body;
  }
  const parsed = sections(body);
  const quote = value => value.split('\n').map(line => `> ${line}`).join('\n');
  const note = 'Retrospective format alignment only. Original wording is preserved below; historical verification, approval and completion are not newly asserted. Current status and later evidence remain in the GitHub timeline.';
  const chunks = headings[kind].map(heading => {
    let content;
    if (kind === 'pr' && heading === 'Linked Issues') {
      const linked = parsed.filter(s => /^(linked issues|related issues)$/i.test(s.heading) && s.content);
      content = linked.length ? linked.map(s => `Original section “${s.heading}”:\n\n${quote(s.content)}`).join('\n\n')
        : 'Not separately recorded as a linked-issue section. Consult the preserved original description and GitHub timeline for any existing relationships; none is inferred here.';
    } else {
      const pattern = aliases[kind][heading];
      content = pattern ? parsed.filter(s => s.heading && pattern.test(s.heading) && s.content).map(s => `Original section “${s.heading}”:\n\n${quote(s.content)}`).join('\n\n') : '';
      if (!content && heading === (kind === 'issue' ? 'Scope' : 'Changes') && parsed[0]?.content) {
        content = `Original unsectioned description (not newly verified):\n\n${quote(parsed[0].content)}`;
      }
      if (!content && heading === (kind === 'issue' ? 'Purpose' : 'Summary')) content = `Existing work item: ${item.title}. See the verbatim original description for the recorded rationale.`;
      if (!content) content = 'Not separately recorded in the original description. See the preserved original and timeline; no requirement, test result or approval is inferred by this format-only update.';
    }
    return `## ${heading}\n\n${content}`;
  });
  const migrated = `${marker(kind)}\n\n${note}\n\n${chunks.join('\n\n')}\n\n## Original Record\n\n${originalArchive(body)}\n`;
  if (Buffer.byteLength(migrated, 'utf8') > 60000) throw new Error(`#${item.number}: migrated body too large for safe publication`);
  const errors = validateBody(kind, migrated);
  if (errors.length) throw new Error(`#${item.number}: ${errors.join('; ')}`);
  return migrated;
}
