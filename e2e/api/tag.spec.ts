import { expect, test } from '@playwright/test';
import { TagsPage } from '../pages/settings/tags.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type TagApi = {
	id: string;
	name: string;
	active: boolean;
};

test.describe.serial('API v1 Tag', () => {
	let apiKey: string;
	const ids = {
		tagId: '',
		tagName: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('POST /api/v1/tags creates an active tag visible in the tags list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		ids.tagName = `API Tag ${Date.now()}`;

		const response = await client.post<TagApi>('/api/v1/tags', { name: ids.tagName });
		expect(response.status).toBe(200);
		expect(response.body.name).toBe(ids.tagName);
		expect(response.body.active).toBe(true);
		ids.tagId = response.body.id;
		expect(ids.tagId).not.toBe('');

		const tagsPage = new TagsPage(page);
		await loginAsOwner(page);
		await tagsPage.goto();

		const row = tagsPage.tagRow(ids.tagId);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await expect(row.getByTestId('tag-row-name')).toHaveText(ids.tagName);
		await expect(row.getByTestId('tag-row-status')).toHaveText('Active');
	});

	test('GET /api/v1/tags/:tagId matches the name shown in the tags list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const tagsPage = new TagsPage(page);
		await loginAsOwner(page);
		await tagsPage.goto();
		const row = tagsPage.tagRow(ids.tagId);
		await expect(row).toBeVisible({ timeout: 15_000 });
		const uiName = (await row.getByTestId('tag-row-name').textContent())?.trim();

		const response = await client.get<TagApi>(`/api/v1/tags/${ids.tagId}`);
		expect(response.status).toBe(200);
		expect(response.body.name).toBe(uiName);
		expect(response.body.id).toBe(ids.tagId);
	});

	test('GET /api/v1/tags lists the tag', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: TagApi[] }>(
			'/api/v1/tags'
		);
		expect(response.status).toBe(200);
		expect(response.body.data.some((t) => t.id === ids.tagId)).toBe(true);
	});

	test('PUT /api/v1/tags/:tagId renames the tag visible in the UI', async ({ page, request }) => {
		const client = makeClient(request);
		const newName = `${ids.tagName} (api-edited)`;

		const response = await client.put<TagApi>(`/api/v1/tags/${ids.tagId}`, { name: newName });
		expect(response.status).toBe(200);
		expect(response.body.name).toBe(newName);
		ids.tagName = newName;

		const tagsPage = new TagsPage(page);
		await loginAsOwner(page);
		await tagsPage.goto();
		await expect(tagsPage.tagRow(ids.tagId).getByTestId('tag-row-name')).toHaveText(newName, {
			timeout: 15_000
		});
	});

	test('PUT /api/v1/tags/:tagId can deactivate the tag visible in the UI', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const response = await client.put<TagApi>(`/api/v1/tags/${ids.tagId}`, { active: false });
		expect(response.status).toBe(200);
		expect(response.body.active).toBe(false);

		const tagsPage = new TagsPage(page);
		await loginAsOwner(page);
		await tagsPage.goto();
		await expect(tagsPage.tagRow(ids.tagId).getByTestId('tag-row-status')).toHaveText('Inactive', {
			timeout: 15_000
		});
	});

	test('DELETE /api/v1/tags/:tagId removes the tag from the UI list', async ({ page, request }) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/tags/${ids.tagId}`);
		expect(response.status).toBe(204);

		const tagsPage = new TagsPage(page);
		await loginAsOwner(page);
		await tagsPage.goto();
		await expect(tagsPage.tagRow(ids.tagId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/tags with missing name returns a validation error', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/tags', {});
		expectValidationError(response);
	});

	test('POST /api/v1/tags with empty name returns a validation error', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/tags', { name: '' });
		expectValidationError(response);
	});

	test('POST /api/v1/tags with invalid JSON returns 400', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.postRaw<{ message?: string; error?: string }>(
			'/api/v1/tags',
			'{not json'
		);
		expect(response.status).toBe(400);
	});

	test('PUT /api/v1/tags/:tagId with wrong type returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		// Create a fresh tag since the prior was deleted.
		const created = await client.post<TagApi>('/api/v1/tags', { name: `Tag ${Date.now()}` });
		expect(created.status).toBe(200);

		const response = await client.put<{ error: string }>(`/api/v1/tags/${created.body.id}`, {
			active: 'not-a-boolean'
		});
		expectValidationError(response);
	});
});
