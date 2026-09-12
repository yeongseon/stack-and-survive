import { readFileSync } from 'node:fs';
import { validateBody } from './work-item-format.mjs';

const [kind, file] = process.argv.slice(2);
let body;
if (process.env.GITHUB_EVENT_PATH && !file) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  body = (event.pull_request ?? event.issue)?.body ?? '';
} else if (file) body = readFileSync(file, 'utf8');
else throw new Error('Usage: node scripts/check-work-item.mjs issue|pr body.md');

const errors = validateBody(kind, body);
if (errors.length) { errors.forEach(error => { console.error(error); }); process.exitCode = 1; }
else console.log(`${kind} body follows template v1 (format only; factual review still required).`);
