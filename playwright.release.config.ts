import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/release', outputDir: './test-results/release', workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:43876', screenshot: 'only-on-failure',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: {
    command: 'pnpm --filter @stack-and-survive/web exec vite --host 127.0.0.1 --port 43876 --strictPort',
    env: { VITE_LEADERBOARD_API: 'https://release-api.invalid' },
    url: 'http://127.0.0.1:43876', reuseExistingServer: false,
  },
});
