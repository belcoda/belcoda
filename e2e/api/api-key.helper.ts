import type { Browser } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { ApiKeysPage } from '../pages/settings/api-keys.page';
import { TEST_USERS } from '../helpers/auth';

let cachedApiKey: string | null = null;
let cachedOwnerUserId: string | null = null;

/**
 * Logs in as the e2e owner via the UI and creates a fresh API key on
 * `/settings/api-keys`, returning the raw key value displayed only once after
 * creation.
 *
 * Also captures the owner's `userId` (via `/api/utils/auth/permissions`)
 * because some `/api/v1` endpoints (e.g. POST person notes) require a
 * concrete `userId` in the body.
 *
 * Module-scoped so it is reused across every spec in the file (Playwright is
 * configured with `workers: 1`, so this cache is safe).
 */
export async function ensureOwnerApiKey(
	browser: Browser
): Promise<{ apiKey: string; ownerUserId: string }> {
	if (cachedApiKey && cachedOwnerUserId) {
		return { apiKey: cachedApiKey, ownerUserId: cachedOwnerUserId };
	}

	const context = await browser.newContext();
	const page = await context.newPage();
	try {
		const loginPage = new LoginPage(page);
		const communityPage = new CommunityPage(page);
		await loginPage.goto();
		await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
		await page.waitForURL('/community', { timeout: 30_000 });
		await communityPage.expectLoaded();

		const permissionsResp = await page.request.get('/api/utils/auth/permissions');
		if (!permissionsResp.ok()) {
			throw new Error(
				`Failed to load owner permissions context: ${permissionsResp.status()} ${await permissionsResp.text()}`
			);
		}
		const permissions = (await permissionsResp.json()) as { userId?: string };
		if (!permissions.userId) {
			throw new Error('Owner permissions response missing userId');
		}
		cachedOwnerUserId = permissions.userId;

		const apiKeysPage = new ApiKeysPage(page);
		const keyName = `e2e-api-${Date.now()}`;

		await apiKeysPage.goto();
		await apiKeysPage.createApiKey(keyName);
		await apiKeysPage.keyDisplay.waitFor({ state: 'visible', timeout: 15_000 });

		const key = await apiKeysPage.keyDisplay.inputValue();
		if (!key) {
			throw new Error('Failed to read API key from the create-key modal');
		}
		await apiKeysPage.closeCreateModalButton.click();
		cachedApiKey = key;
		return { apiKey: key, ownerUserId: cachedOwnerUserId };
	} finally {
		await context.close();
	}
}

/**
 * Forgets any previously cached API key. Useful when a test deletes the
 * cached key and subsequent tests should provision a new one.
 */
export function clearCachedApiKey() {
	cachedApiKey = null;
	cachedOwnerUserId = null;
}
