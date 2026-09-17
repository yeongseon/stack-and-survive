import { build } from 'esbuild';

await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  external: [],
});
console.log('Build complete: dist/server.js');
