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
	const ids = {
		tagId: '',
		tagName: '',
		teamId: '',
		teamName: ''
	};

	test('owner can create a tag from Community Settings', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		ids.tagName = `E2E Community Tag ${Date.now()}`;

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/tags"]').first().click();
		await expect(page).toHaveURL('/settings/tags');

		await tagsPage.createTag(ids.tagName);
		const row = tagsPage.tagRowByName(ids.tagName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		ids.tagId = (await row.getAttribute('data-tag-id')) ?? '';
		expect(ids.tagId).not.toBe('');
	});

	test('owner can edit a tag from Community Settings', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const updatedTagName = `${ids.tagName} Edited`;

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/tags"]').first().click();
		await expect(page).toHaveURL('/settings/tags');

		await tagsPage.editTag(ids.tagId, updatedTagName);
		await expect(tagsPage.tagRow(ids.tagId).getByTestId('tag-row-name')).toHaveText(
			updatedTagName,
			{
				timeout: 15_000
			}
		);

		ids.tagName = updatedTagName;
	});

	test('owner can delete a tag from Community Settings', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/tags"]').first().click();
		await expect(page).toHaveURL('/settings/tags');

		await tagsPage.deleteTag(ids.tagId);
		await expect(tagsPage.tagRow(ids.tagId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('owner can create a team from Community Settings', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		ids.teamName = `E2E Community Team ${Date.now()}`;

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/teams"]').first().click();
		await expect(page).toHaveURL('/settings/teams');

		await teamsPage.createTeam(ids.teamName);
		const row = teamsPage.teamRowByName(ids.teamName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		ids.teamId = (await row.getAttribute('data-team-id')) ?? '';
		expect(ids.teamId).not.toBe('');
	});

	test('owner can edit a team from Community Settings', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const updatedTeamName = `${ids.teamName} Edited`;

		await loginToCommunitySettings(page);
		await page.locator('a[href="/settings/teams"]').first().click();
		await expect(page).toHaveURL('/settings/teams');

		await teamsPage.editTeam(ids.teamId, updatedTeamName);
		await expect(teamsPage.teamRow(ids.teamId).getByTestId('team-row-name')).toHaveText(
			updatedTeamName,
			{
				timeout: 15_000
			}
		);

		ids.teamName = updatedTeamName;
	});

	test.fixme('owner can delete a team from Community Settings', async () => {
		// Team delete action is not currently exposed in settings UI.
	});
});
