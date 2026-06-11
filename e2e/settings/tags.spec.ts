import { expect, test } from '@playwright/test';
import { TagsPage } from '../pages/settings/tags.page';
import { BASE_URL } from '../helpers/config';
import { loginAsOwner, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'community' as const;

test('owner can load more tags', async ({ page, request }) => {
	const tagsPage = new TagsPage(page);
	await loginAsOwner(page, PROJECT);

	const seedResponse = await request.post(`${BASE_URL}/api/e2e/seed-tags`, {
		data: { count: 30 }
	});
	expect(seedResponse.ok()).toBeTruthy();
	const seedBody = (await seedResponse.json()) as { runId: string };
	expect(seedBody.runId).toBeTruthy();

	await tagsPage.goto();
	const seededRows = tagsPage.tagRowsForSeedRun(seedBody.runId);

	await expect(seededRows.first()).toBeVisible({ timeout: 15_000 });
	await expect(tagsPage.loadMoreButton).toBeVisible({ timeout: 15_000 });
	expect(await seededRows.count()).toBeLessThan(30);

	await tagsPage.loadMoreButton.click();
	await expect(seededRows).toHaveCount(30, { timeout: 15_000 });
});

test.describe.serial('Settings: Tags', () => {
	const ids = {
		tagId: '',
		tagName: ''
	};

	test('owner can create a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const suffix = `${Date.now()}`;
		ids.tagName = `E2E Tag ${suffix}`;

		await loginAsOwner(page, PROJECT);
		await tagsPage.goto();

		await tagsPage.createTag(ids.tagName);

		const row = tagsPage.tagRowByName(ids.tagName);
		await expect(row).toBeVisible({ timeout: 15_000 });

		ids.tagId = (await row.getAttribute('data-tag-id')) ?? '';
		expect(ids.tagId).not.toBe('');
	});

	test('new tag is active by default', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page, PROJECT);
		await tagsPage.goto();

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await expect(row.getByTestId('tag-row-status')).toHaveText('Active');
	});

	test('owner can rename a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);
		const newName = `${ids.tagName} Renamed`;

		await loginAsOwner(page, PROJECT);
		await tagsPage.goto();

		await tagsPage.editTag(ids.tagId, newName);

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row.getByTestId('tag-row-name')).toHaveText(newName, { timeout: 15_000 });

		ids.tagName = newName;
	});

	test('owner can deactivate a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page, PROJECT);
		await tagsPage.goto();

		await tagsPage.deactivateTag(ids.tagId);

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row.getByTestId('tag-row-status')).toHaveText('Inactive', { timeout: 15_000 });
	});

	test('owner can reactivate a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page, PROJECT);
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

	test('member cannot access tag management', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsMember(page, PROJECT);
		await tagsPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(tagsPage.newTagTrigger).toHaveCount(0);
		await expect(tagsPage.tagRow(ids.tagId)).toHaveCount(0);
	});

	test('owner can delete a tag', async ({ page }) => {
		const tagsPage = new TagsPage(page);

		await loginAsOwner(page, PROJECT);
		await tagsPage.goto();

		await tagsPage.deleteTag(ids.tagId);

		await expect(tagsPage.tagRow(ids.tagId)).toHaveCount(0, { timeout: 15_000 });
	});
});
