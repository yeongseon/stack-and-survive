import { defineConfig } from '@playwright/test';
export default defineConfig({
  expect: { timeout: 20000 },
  testDir: './tests/e2e', workers: 1, timeout: 120000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:43872', viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1 --port 43872 --strictPort', url: 'http://127.0.0.1:43872', reuseExistingServer: false },
});
