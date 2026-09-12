import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/player', workers: 1, timeout: 120000, expect: { timeout: 20000 },
  use: { baseURL: 'http://127.0.0.1:43874', viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1 --port 43874 --strictPort', url: 'http://127.0.0.1:43874', reuseExistingServer: false },
});
