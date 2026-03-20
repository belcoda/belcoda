import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PUBLIC_HOST ?? 'http://localhost:5173';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'html',
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'npm run dev',
		url: BASE_URL,
		reuseExistingServer: !process.env.CI
	},
	globalSetup: './e2e/setup/global-setup.ts',
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
