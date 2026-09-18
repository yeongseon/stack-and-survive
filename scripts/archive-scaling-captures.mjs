import { copyFile, mkdir, readdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../test-results-scaling/', import.meta.url);
const output = new URL('../docs/images/infrastructure-scaling/', import.meta.url);
await mkdir(output, { recursive: true });
const captures = [];
for (const dir of await readdir(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const folder = new URL(`${dir.name}/`, root);
  for (const name of await readdir(folder)) {
    if (!name.endsWith('.png')) continue;
    await copyFile(new URL(name, folder), new URL(name, output));
    const bytes = await readFile(new URL(name, output));
    captures.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
}
await writeFile(new URL('capture-provenance.json', output), JSON.stringify({
  source: 'Local production build, tests/scaling/scaling.spec.ts; real-time UI actions, no injected state or public score submission.',
  command: 'pnpm build && pnpm exec playwright test --config playwright.scaling.config.ts',
  captures,
}, null, 2) + '\n');
console.log(`Archived ${captures.length} unedited scaling captures.`);
