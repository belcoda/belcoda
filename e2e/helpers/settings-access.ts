import { expect, type Page } from '@playwright/test';

export async function expectMemberCannotAccessSettings(page: Page) {
	await expect(page.getByTestId('settings-unauthorized')).toBeVisible({ timeout: 15_000 });
}
