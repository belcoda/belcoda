import { expect, test } from '@playwright/test';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { TagsPage } from '../pages/settings/tags.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type TagApi = {
	id: string;
	name: string;
	active: boolean;
};

test.describe.serial('API v1 Person Tags', () => {
	let apiKey: string;
	const ids = {
		personId: '',
		personPath: '',
		tagId: '',
		tagName: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('owner creates a person and a tag to associate', async ({ page }) => {
		const suffix = Date.now();
		const personCreate = new PersonCreatePage(page);
		const tagsPage = new TagsPage(page);
		ids.tagName = `E2E API Tag ${suffix}`;

		await loginAsOwner(page);
		await personCreate.goto();
		await personCreate.fillRequiredFields(
			'TagsApi',
			`Subject ${suffix}`,
			`tags-api-${suffix}@belcoda.test`
		);
		await personCreate.submit();
		await expect(page).toHaveURL(
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i
		);
		ids.personPath = new URL(page.url()).pathname;
		ids.personId = ids.personPath.split('/')[2] ?? '';
		expect(ids.personId).not.toBe('');

		await tagsPage.goto();
		await tagsPage.createTag(ids.tagName);
		const row = tagsPage.tagRowByName(ids.tagName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		ids.tagId = (await row.getAttribute('data-tag-id')) ?? '';
		expect(ids.tagId).not.toBe('');
	});

	test('GET /api/v1/person/:personId/tags returns an empty list initially', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: TagApi[] }>(
			`/api/v1/person/${ids.personId}/tags`
		);
		expect(response.status).toBe(200);
		expect(response.body.data).toEqual([]);
	});

	test('POST /api/v1/person/:personId/tags adds a tag visible on the profile', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const response = await client.post<TagApi>(`/api/v1/person/${ids.personId}/tags`, {
			tagId: ids.tagId
		});
		expect(response.status).toBe(200);
		expect(response.body.id).toBe(ids.tagId);
		expect(response.body.name).toBe(ids.tagName);

		const profile = new PersonProfilePage(page);
		await loginAsOwner(page);
		await profile.goto(`/community/${ids.personId}/profile`);
		await profile.waitForLoaded();

		const chip = page.locator(
			`[data-testid="person-profile-tag-chip"][data-tag-id="${ids.tagId}"]`
		);
		await expect(chip).toBeVisible({ timeout: 15_000 });
		await expect(chip).toContainText(ids.tagName);
	});

	test('GET /api/v1/person/:personId/tags lists the assigned tag', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: TagApi[] }>(
			`/api/v1/person/${ids.personId}/tags`
		);
		expect(response.status).toBe(200);
		expect(response.body.data.some((t) => t.id === ids.tagId)).toBe(true);
	});

	test('DELETE /api/v1/person/:personId/tags/:tagId removes the chip from the profile', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/person/${ids.personId}/tags/${ids.tagId}`);
		expect(response.status).toBe(204);

		const profile = new PersonProfilePage(page);
		await loginAsOwner(page);
		await profile.goto(`/community/${ids.personId}/profile`);
		await profile.waitForLoaded();
		await expect(
			page.locator(`[data-testid="person-profile-tag-chip"][data-tag-id="${ids.tagId}"]`)
		).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/person/:personId/tags with missing tagId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(
			`/api/v1/person/${ids.personId}/tags`,
			{}
		);
		expectValidationError(response);
	});

	test('POST /api/v1/person/:personId/tags with non-uuid tagId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(`/api/v1/person/${ids.personId}/tags`, {
			tagId: 'not-a-uuid'
		});
		expectValidationError(response);
	});
});
