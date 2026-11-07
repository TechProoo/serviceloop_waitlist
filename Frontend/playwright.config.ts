import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 60000, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5182', browserName: 'chromium', channel: process.platform === 'win32' ? 'msedge' : undefined, viewport: { width: 1440, height: 1000 }, headless: true, trace: 'retain-on-failure' },
  webServer: [
    { command: 'node ../backend/test/browser-server.cjs', url: 'http://127.0.0.1:3017/api/health', reuseExistingServer: false, timeout: 60000 },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5182 --strictPort', url: 'http://127.0.0.1:5182', env: { API_PROXY_TARGET: 'http://127.0.0.1:3017' }, reuseExistingServer: false },
    { command: 'npm --prefix ../Waitlist run dev -- --host 127.0.0.1 --port 5183 --strictPort', url: 'http://127.0.0.1:5183', env: { API_PROXY_TARGET: 'http://127.0.0.1:3017' }, reuseExistingServer: false },
    { command: 'npm --prefix .. run dev -- --host 127.0.0.1 --port 5184 --strictPort', url: 'http://127.0.0.1:5184', env: { API_PROXY_TARGET: 'http://127.0.0.1:3017' }, reuseExistingServer: false },
  ],
});
