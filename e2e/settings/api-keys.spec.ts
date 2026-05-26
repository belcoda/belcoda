import { expect, test } from '@playwright/test';
import { ApiKeysPage } from '../pages/settings/api-keys.page';
import { loginAsOwner, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'settings' as const;

test.describe.serial('Settings: API Keys', () => {
	const state = {
		name: ''
	};

	test('owner can create an API key', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);
		state.name = `E2E API Key ${Date.now()}`;

		await loginAsOwner(page, PROJECT);
		await apiKeysPage.goto();
		await apiKeysPage.createApiKey(state.name);

		await expect(page.getByText('API Key Created')).toBeVisible({ timeout: 15_000 });
		await expect(apiKeysPage.keyDisplay).toBeVisible();
		await apiKeysPage.closeCreateModalButton.click();
		await expect(apiKeysPage.apiKeyRow(state.name)).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot access API key management', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);

		await loginAsMember(page, PROJECT);
		await apiKeysPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(apiKeysPage.newApiKeyTrigger).toHaveCount(0);
		await expect(apiKeysPage.apiKeyRow(state.name)).toHaveCount(0);
	});

	test('owner can delete an API key', async ({ page }) => {
		const apiKeysPage = new ApiKeysPage(page);

		await loginAsOwner(page, PROJECT);
		await apiKeysPage.goto();
		await apiKeysPage.deleteApiKey(state.name);

		await expect(apiKeysPage.apiKeyRow(state.name)).toHaveCount(0, { timeout: 15_000 });
	});
});
