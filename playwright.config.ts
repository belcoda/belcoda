import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './e2e/setup/global-setup';

const BASE_URL = process.env.E2E_BASE_URL || process.env.PUBLIC_HOST || 'http://localhost:5173';
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'html',
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry',
		storageState: STORAGE_STATE_PATH
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
