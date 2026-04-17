import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { TagsPage } from '../pages/settings/tags.page';
import { TeamsPage } from '../pages/settings/teams.page';
import { TEST_USERS } from '../helpers/auth';

async function loginToCommunitySettings(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);

	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
	await communityPage.openOrgMenu();
	await communityPage.clickSettings();
	await expect(page).toHaveURL('/settings');
}

test.describe.serial('Community Settings: Tags and Teams', () => {
	test('owner can create a tag from Community Settings', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const tagName = `E2E Community Tag ${Date.now()}`;

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/tags"]').first().click();
		await expect(page).toHaveURL('/settings/tags');

		await tagsPage.createTag(tagName);
		await expect(tagsPage.tagRowByName(tagName)).toBeVisible({ timeout: 15_000 });
	});

	test('owner can create a team from Community Settings', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const teamName = `E2E Community Team ${Date.now()}`;

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/teams"]').first().click();
		await expect(page).toHaveURL('/settings/teams');

		await teamsPage.createTeam(teamName);
		await expect(teamsPage.teamRowByName(teamName)).toBeVisible({ timeout: 15_000 });
	});
});
