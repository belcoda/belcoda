import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || process.env.PUBLIC_HOST || 'http://localhost:5173';
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI
		? [
				['html'],
				['playwright-ctrf-json-reporter', { outputFile: 'ctrf-report.json', outputDir: 'ctrf' }]
			]
		: 'html',
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry'
	},
	webServer: useLocalServer
		? {
				command: 'npm run dev',
				url: BASE_URL,
				reuseExistingServer: !process.env.CI
			}
		: undefined,
	globalSetup: './e2e/setup/global-setup.ts',
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
