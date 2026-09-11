import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:43871', viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'pnpm exec vite preview --host 127.0.0.1 --port 43871 --strictPort', url: 'http://127.0.0.1:43871', reuseExistingServer: false },
});
