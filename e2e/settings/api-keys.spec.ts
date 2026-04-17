import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { ApiKeysPage } from '../pages/settings/api-keys.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Settings: API Keys', () => {
	const state = {
		name: ''
	};

	test('owner can create an API key', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);
		state.name = `E2E API Key ${Date.now()}`;

		await loginAsOwner(page);
		await apiKeysPage.goto();
		await apiKeysPage.createApiKey(state.name);

		await expect(page.getByText('API Key Created')).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('#api-key-display')).toBeVisible();
		await apiKeysPage.closeCreateModalButton.click();
		await expect(apiKeysPage.apiKeyRow(state.name)).toBeVisible({ timeout: 15_000 });
	});

	test('owner can delete an API key', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);

		await loginAsOwner(page);
		await apiKeysPage.goto();
		await apiKeysPage.deleteApiKey(state.name);

		await expect(apiKeysPage.apiKeyRow(state.name)).toHaveCount(0, { timeout: 15_000 });
	});
});
