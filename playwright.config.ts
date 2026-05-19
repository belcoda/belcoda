import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './e2e/setup/global-setup';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

const BASE_URL = process.env.E2E_BASE_URL || process.env.PUBLIC_HOST || 'http://localhost:5173';
const useLocalServer = !process.env.E2E_BASE_URL;

/** Playwright project names — each maps to a dedicated org in e2e/setup/global-setup.ts */
export const E2E_PLAYWRIGHT_PROJECTS = [
	'auth',
	'community',
	'events',
	'petitions',
	'communications',
	'settings',
	'whatsapp-accounts'
] as const;

// CI: global setup runs once in the setup job (npm run test:e2e:setup); matrix jobs set
// SKIP_E2E_GLOBAL_SETUP=1 and E2E_PROJECT with workers=1 so specs sharing an org never overlap.
// Full-suite local runs may use multiple workers; files in the same project share one org.
const workers = process.env.E2E_PROJECT ? 1 : process.env.CI ? 6 : 3;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers,
	reporter: process.env.CI
		? [
				['html'],
				[
					'playwright-ctrf-json-reporter',
					{
						outputFile: 'ctrf-report.json',
						outputDir: process.env.E2E_PROJECT ? `ctrf/${process.env.E2E_PROJECT}` : 'ctrf'
					}
				]
			]
		: 'html',
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
	globalSetup:
		process.env.SKIP_E2E_GLOBAL_SETUP === '1' ? undefined : './e2e/setup/global-setup.ts',
	projects: [
		{
			name: 'auth',
			testMatch: ['**/auth/**/*.spec.ts'],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'community',
			testMatch: [
				'**/community/**/*.spec.ts',
				'**/settings/tags.spec.ts',
				'**/settings/teams.spec.ts',
				'**/settings/community-settings.spec.ts'
			],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'events',
			testMatch: ['**/events/**/*.spec.ts'],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'petitions',
			testMatch: ['**/petitions/**/*.spec.ts'],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'communications',
			testMatch: ['**/communications/**/*.spec.ts'],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'settings',
			testMatch: [
				'**/settings/api-keys.spec.ts',
				'**/settings/webhooks.spec.ts',
				'**/settings/send-signatures.spec.ts',
				'**/settings/whatsapp-templates.spec.ts',
				'**/settings/users.spec.ts',
				'**/settings/organization-settings.spec.ts',
				'**/settings/imports.spec.ts',
				'**/settings/exports.spec.ts',
				'**/preferences/**/*.spec.ts'
			],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'whatsapp-accounts',
			testMatch: ['**/settings/whatsapp-accounts.spec.ts'],
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
