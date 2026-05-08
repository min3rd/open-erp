import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Không tự start webserver — phải chạy 'ng serve' thủ công trước
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:4200',
  //   reuseExistingServer: true,
  // },
});
