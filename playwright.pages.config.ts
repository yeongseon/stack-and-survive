import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pages', outputDir: './test-results-pages', fullyParallel: false, workers: 1,
  timeout: 120000, expect: { timeout: 20000 },
  use: { baseURL: 'http://127.0.0.1:43875/stack-and-survive/', viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--enable-unsafe-swiftshader'] }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'pnpm --filter @stack-and-survive/web exec vite preview --outDir dist-pages --base /stack-and-survive/ --host 127.0.0.1 --port 43875 --strictPort', url: 'http://127.0.0.1:43875/stack-and-survive/', reuseExistingServer: false },
});
