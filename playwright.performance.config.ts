import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance', workers: 1, timeout: 120000,
  reporter: [['list'], ['json', { outputFile: 'test-results/performance.json' }]],
  use: { baseURL: 'http://127.0.0.1:43873', viewport: { width: 1440, height: 900 },
    channel: 'chromium', launchOptions: { args: ['--use-gl=angle', '--use-angle=metal'] } },
  webServer: { command: 'pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1 --port 43873 --strictPort', url: 'http://127.0.0.1:43873', reuseExistingServer: false },
});
