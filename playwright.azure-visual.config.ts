import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/azure-visual', workers: 1, timeout: 90_000, expect: { timeout: 15_000 },
  reporter: [['list']], use: { baseURL: 'http://127.0.0.1:43890', viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }, trace: 'retain-on-failure' },
  webServer: { command: 'pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1 --port 43890 --strictPort', url: 'http://127.0.0.1:43890', reuseExistingServer: false },
});
