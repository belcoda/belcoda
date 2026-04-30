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

async function loginAsMember(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.member.email, TEST_USERS.member.password);
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
		await expect(apiKeysPage.keyDisplay).toBeVisible();
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

	test('member cannot create an API key', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);
		const keyName = `E2E Member API Key ${Date.now()}`;

		await loginAsMember(page);
		await apiKeysPage.goto();
		await apiKeysPage.createApiKey(keyName);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(apiKeysPage.apiKeyRow(keyName)).toHaveCount(0, { timeout: 15_000 });
	});

	test('member cannot delete an API key', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);

		await loginAsMember(page);
		await apiKeysPage.goto();
		await apiKeysPage.deleteApiKey(state.name);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(apiKeysPage.apiKeyRow(state.name)).toHaveCount(1, { timeout: 15_000 });
	});
});
