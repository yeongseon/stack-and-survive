import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export default defineConfig(async ({ mode, command }) => {
  const enabled = mode === 'art-preview' && command === 'serve';
  const root = fileURLToPath(new URL('../../art/v3/dist/', import.meta.url));
  let inventory = null;
  const files = new Map<string, Buffer>();
  if (enabled) {
    inventory = JSON.parse(await readFile(`${root}review-inventory.json`, 'utf8'));
    const required = ['intake','protected-edge','app-service','app-module','redis-cache','azure-sql','app-4',
      'sql-read-warning','sql-write-warning','sql-critical','edge-filter','cache-activity',
      ...['app-available','app-locked','app-queued','app-construction','app-overload'].flatMap(name => [0,1,2,3].map(bay => `${name}-${bay}`)),
      ...['cache','edge'].flatMap(name => ['foundation','frame','boot'].map(stage => `${name}-${stage}`)),
      ...['rack-b','rack-c','cooling-a','cooling-b','electrical-cabinet','wall-section','service-door','cable-tray','floor-vent','maintenance-light'].map(name=>`env-${name}`)];
    if (!Array.isArray(inventory.records)) throw new Error('V3 review inventory records missing');
    const names = new Set(inventory.records.map((record: { name: string }) => record.name));
    if (names.size !== inventory.records.length || required.some(name => !names.has(name))) throw new Error('V3 review inventory is incomplete or duplicated. Re-export the complete art package.');
    const geometry = inventory.geometry;
    if (geometry?.canvas?.width !== 640 || geometry?.canvas?.height !== 640 || geometry?.origin?.x !== 320 || geometry?.origin?.y !== 398
      || !Array.isArray(geometry.appBays) || geometry.appBays.length !== 4) throw new Error('V3 review geometry does not match the source canvas');
    for (const [index, bay] of geometry.appBays.entries()) {
      if (bay.index !== index || !Array.isArray(bay.center) || bay.center.length !== 2
        || ![...bay.center, bay.moduleOffset?.x, bay.moduleOffset?.y].every(Number.isFinite)) throw new Error('V3 review App bay geometry is invalid');
    }
    for (const record of inventory.records) {
      if (!/^[a-z0-9-]+$/.test(record.name)) throw new Error('Invalid V3 review asset name');
      const bounds = record.bounds;
      if (!bounds || ![bounds.x,bounds.y,bounds.width,bounds.height].every(Number.isFinite)
        || bounds.width <= 0 || bounds.height <= 0 || bounds.x < 0 || bounds.y < 0 || bounds.x+bounds.width > 640 || bounds.y+bounds.height > 640) throw new Error(`Invalid V3 bounds: ${record.name}`);
      const bytes = await readFile(`${root}${record.name}.png`);
      if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error(`V3 review hash mismatch: ${record.name}`);
      files.set(`/__art-v3/${record.name}.png`, bytes);
    }
  }
  return { define: { __V3_REVIEW__: JSON.stringify(inventory) }, plugins: [{
    name: 'local-art-review',
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use((request, response, next) => {
        const bytes = files.get((request.url ?? '').split('?')[0]);
        if (!bytes) return next();
        response.setHeader('Content-Type', 'image/png'); response.setHeader('Cache-Control', 'no-store'); response.end(bytes);
      });
    },
  }] };
});
