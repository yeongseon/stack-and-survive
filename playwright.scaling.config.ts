import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/scaling', outputDir: 'test-results-scaling', workers: 1,
  timeout: 360000, expect: { timeout: 15000 }, reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:43892', viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1 --port 43892 --strictPort', url: 'http://127.0.0.1:43892', reuseExistingServer: false },
});
