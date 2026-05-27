import { defineConfig, devices, type Project } from '@playwright/test';
import { ownerStorageState } from './e2e/helpers/auth-storage';
import type { E2EProject } from './e2e/helpers/config';
import { STORAGE_STATE_PATH } from './e2e/setup/global-setup';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

const BASE_URL = process.env.E2E_BASE_URL || process.env.PUBLIC_HOST || 'http://localhost:5173';
const useLocalServer = !process.env.E2E_BASE_URL;
const isCI = !!process.env.CI;

// One Playwright invocation runs global setup once, then schedules projects across this worker pool.
const workers = isCI ? 6 : 3;

const chrome = { ...devices['Desktop Chrome'] };

/**
 * Each spec file gets its own Playwright project; projects run one-after-another via `dependencies`.
 * Different orgs (community vs settings) can still run in parallel with other top-level projects.
 */
function chainProjects(prefix: E2EProject, testMatches: string[]): Project[] {
	const ownerState = ownerStorageState(prefix);
	return testMatches.map((testMatch, index) => ({
		name: index === 0 ? prefix : `${prefix}-${index}`,
		testMatch: [testMatch],
		dependencies: index === 0 ? [] : [index === 1 ? prefix : `${prefix}-${index - 1}`],
		use: { ...chrome, storageState: ownerState }
	}));
}

const COMMUNITY_SPEC_FILES = [
	'**/community/person.spec.ts',
	'**/settings/tags.spec.ts',
	'**/settings/teams.spec.ts',
	'**/settings/community-settings.spec.ts'
];

const SETTINGS_SPEC_FILES = [
	'**/settings/organization-settings.spec.ts',
	'**/settings/exports.spec.ts',
	'**/settings/imports.spec.ts',
	'**/settings/api-keys.spec.ts',
	'**/settings/webhooks.spec.ts',
	'**/settings/send-signatures.spec.ts',
	'**/settings/users.spec.ts',
	'**/settings/whatsapp-templates.spec.ts',
	'**/preferences/language.spec.ts'
];

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers,
	timeout: isCI ? 60_000 : 30_000,
	reporter: isCI
		? [
				['html'],
				[
					'playwright-ctrf-json-reporter',
					{
						outputFile: 'ctrf-report.json',
						outputDir: 'ctrf'
					}
				]
			]
		: 'html',
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry',
		storageState: STORAGE_STATE_PATH,
		actionTimeout: 15_000,
		navigationTimeout: 30_000
	},
	webServer: useLocalServer
		? {
				command: 'npm run dev',
				url: BASE_URL,
				reuseExistingServer: !isCI
			}
		: undefined,
	globalSetup: './e2e/setup/global-setup.ts',
	projects: [
		...chainProjects('community', COMMUNITY_SPEC_FILES),
		...chainProjects('settings', SETTINGS_SPEC_FILES),
		{
			name: 'auth',
			testMatch: ['**/auth/**/*.spec.ts'],
			use: { ...chrome, storageState: STORAGE_STATE_PATH }
		},
		{
			name: 'events',
			testMatch: ['**/events/**/*.spec.ts'],
			use: { ...chrome, storageState: ownerStorageState('events') }
		},
		{
			name: 'petitions',
			testMatch: ['**/petitions/**/*.spec.ts'],
			use: { ...chrome, storageState: ownerStorageState('petitions') }
		},
		{
			name: 'communications',
			testMatch: ['**/communications/**/*.spec.ts'],
			use: { ...chrome, storageState: ownerStorageState('communications') }
		},
		{
			name: 'whatsapp-accounts',
			testMatch: ['**/settings/whatsapp-accounts.spec.ts'],
			use: { ...chrome, storageState: ownerStorageState('whatsapp-accounts') }
		}
	]
});
