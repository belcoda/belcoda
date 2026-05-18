import { expect, test } from '@playwright/test';
import { ApiKeysPage } from '../pages/settings/api-keys.page';
import { createApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { loginAsOwner } from './test-helpers';

test.describe.serial('API v1 authentication', () => {
	let apiKey: string;

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('GET without x-api-key returns 401 with the expected error', async ({ request }) => {
		const client = createApiClient(request, null);
		const response = await client.get<{ error: string }>('/api/v1/person');

		expect(response.status).toBe(401);
		expect(response.body.error).toEqual(expect.stringContaining('Unauthorized'));
	});

	test('GET with garbage x-api-key returns 401 with an error message', async ({ request }) => {
		const client = createApiClient(request, 'belcoda_definitely_not_a_real_key_0123456789');
		const response = await client.get<{ error: string }>('/api/v1/person');

		// `better-auth.verifyApiKey` rejects unknown keys with its own message
		// (e.g. "Invalid API key.") before our hook's "Unauthorized" branch runs.
		expect(response.status).toBe(401);
		expect(typeof response.body.error).toBe('string');
		expect(response.body.error.length).toBeGreaterThan(0);
	});

	test('GET with empty-string x-api-key returns 401', async ({ request }) => {
		const response = await request.get('/api/v1/person', {
			headers: { 'x-api-key': '', 'Content-Type': 'application/json' }
		});
		expect(response.status()).toBe(401);
	});

	test('GET with a valid x-api-key succeeds', async ({ request }) => {
		const client = createApiClient(request, apiKey);
		const response = await client.get<{ metadata: { count: number }; data: unknown[] }>(
			'/api/v1/person'
		);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('metadata');
		expect(response.body).toHaveProperty('data');
		expect(Array.isArray(response.body.data)).toBe(true);
	});

	test('POST without x-api-key returns 401', async ({ request }) => {
		const client = createApiClient(request, null);
		const response = await client.post<{ error: string }>('/api/v1/tags', { name: 'NopeTag' });

		expect(response.status).toBe(401);
		expect(response.body).toMatchObject({
			error: expect.stringContaining('Unauthorized')
		});
	});

	test('a deleted/revoked API key returns 401', async ({ browser, request }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		try {
			await loginAsOwner(page);

			const apiKeysPage = new ApiKeysPage(page);
			const keyName = `e2e-api-revoked-${Date.now()}`;

			await apiKeysPage.goto();
			await apiKeysPage.createApiKey(keyName);
			await apiKeysPage.keyDisplay.waitFor({ state: 'visible', timeout: 15_000 });
			const revokedKey = await apiKeysPage.keyDisplay.inputValue();
			expect(revokedKey).toBeTruthy();
			await apiKeysPage.closeCreateModalButton.click();

			// Sanity: the freshly-created key works.
			const validClient = createApiClient(request, revokedKey);
			const before = await validClient.get('/api/v1/person');
			expect(before.status).toBe(200);

			await expect(apiKeysPage.apiKeyRow(keyName)).toBeVisible({ timeout: 15_000 });
			await apiKeysPage.deleteApiKey(keyName);
			await expect(apiKeysPage.apiKeyRow(keyName)).toHaveCount(0, { timeout: 15_000 });

			const after = await validClient.get<{ error: string }>('/api/v1/person');
			expect(after.status).toBe(401);
		} finally {
			await context.close();
		}
	});
});
