import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { TagsPage } from '../pages/settings/tags.page';
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

test.describe.serial('Settings: Tags', () => {
	const ids = {
		tagId: '',
		tagName: ''
	};

	test('owner can create a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const suffix = `${Date.now()}`;
		ids.tagName = `E2E Tag ${suffix}`;

		await loginAsOwner(page);
		await tagsPage.goto();

		await tagsPage.createTag(ids.tagName);

		const row = tagsPage.tagRowByName(ids.tagName);
		await expect(row).toBeVisible({ timeout: 15_000 });

		ids.tagId = (await row.getAttribute('data-tag-id')) ?? '';
		expect(ids.tagId).not.toBe('');
	});

	test('new tag is active by default', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page);
		await tagsPage.goto();

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await expect(row.getByTestId('tag-row-status')).toHaveText('Active');
	});

	test('owner can rename a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const newName = `${ids.tagName} Renamed`;

		await loginAsOwner(page);
		await tagsPage.goto();

		await tagsPage.editTag(ids.tagId, newName);

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row.getByTestId('tag-row-name')).toHaveText(newName, { timeout: 15_000 });

		ids.tagName = newName;
	});

	test('owner can deactivate a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page);
		await tagsPage.goto();

		await tagsPage.deactivateTag(ids.tagId);

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row.getByTestId('tag-row-status')).toHaveText('Inactive', { timeout: 15_000 });
	});

	test('owner can reactivate a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page);
		await tagsPage.goto();

		await tagsPage.editTriggerForTag(ids.tagId).click();
		const checkbox = tagsPage.editTagActiveCheckbox;
		const isChecked = await checkbox.isChecked();
		if (!isChecked) {
			await checkbox.click();
		}
		await tagsPage.editTagSubmit.click();

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row.getByTestId('tag-row-status')).toHaveText('Active', { timeout: 15_000 });
	});

	test('owner can delete a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page);
		await tagsPage.goto();

		await tagsPage.deleteTag(ids.tagId);

		await expect(tagsPage.tagRow(ids.tagId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('member cannot create a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const suffix = `${Date.now()}`;
		const tagName = `E2E Member Tag ${suffix}`;

		await loginAsMember(page);
		await tagsPage.goto();

		await tagsPage.createTag(tagName);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(tagsPage.tagRowByName(tagName)).toHaveCount(0, { timeout: 15_000 });
	});

	test('member cannot edit a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const newName = `${ids.tagName} Member Edit`;

		await loginAsMember(page);
		await tagsPage.goto();

		await tagsPage.editTag(ids.tagId, newName);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot delete a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsMember(page);
		await tagsPage.goto();

		await tagsPage.deleteTag(ids.tagId);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(tagsPage.tagRow(ids.tagId)).toHaveCount(1, { timeout: 15_000 });
	});
});
