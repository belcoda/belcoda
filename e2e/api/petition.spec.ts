import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { PetitionListPage } from '../pages/petitions/petition-list.page';
import { PetitionDetailPage } from '../pages/petitions/petition-detail.page';
import { PetitionEditPage } from '../pages/petitions/petition-edit.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type PetitionApi = {
	id: string;
	title: string;
	slug: string;
	shortDescription: string;
	published: boolean;
};

function buildPetitionBody(overrides: Record<string, unknown> = {}) {
	const now = Date.now();
	return {
		title: `API Petition ${now}`,
		slug: `api-petition-${now}`,
		shortDescription: 'Created via REST API for e2e testing.',
		description: null,
		published: false,
		petitionTarget: null,
		petitionText: null,
		featureImage: null,
		settings: {
			survey: {
				schemaVersion: '1.0.0',
				collections: [
					{
						id: randomUUID(),
						title: 'Petition information',
						description: null,
						questions: [],
						nextCollectionId: null,
						previousCollectionId: null
					}
				]
			},
			tags: [],
			whatsappFlowId: null,
			whatsappFlowYCloudId: null,
			whatsappFlowCreatedAt: null
		},
		teamId: null,
		pointPersonId: null,
		...overrides
	};
}

test.describe.serial('API v1 Petition', () => {
	let apiKey: string;
	const ids = {
		petitionId: '',
		title: '',
		slug: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('POST /api/v1/petitions creates a petition visible in the petitions list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const body = buildPetitionBody();
		ids.title = body.title as string;
		ids.slug = body.slug as string;

		const response = await client.post<PetitionApi>('/api/v1/petitions', body);
		expect(response.status).toBe(200);
		expect(response.body.title).toBe(ids.title);
		expect(response.body.slug).toBe(ids.slug);
		ids.petitionId = response.body.id;
		expect(ids.petitionId).not.toBe('');

		const petitionList = new PetitionListPage(page);
		await loginAsOwner(page);
		await petitionList.goto();
		await expect(page.getByText(ids.title)).toBeVisible({ timeout: 15_000 });
	});

	test('GET /api/v1/petitions/:petitionId matches the title shown on the detail page', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const detailPage = new PetitionDetailPage(page);
		await loginAsOwner(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();
		await expect(detailPage.titleDisplay).toBeVisible({ timeout: 15_000 });
		const uiTitle = (await detailPage.titleDisplay.textContent())?.trim();

		const response = await client.get<PetitionApi>(`/api/v1/petitions/${ids.petitionId}`);
		expect(response.status).toBe(200);
		expect(response.body.title).toBe(uiTitle);
		expect(response.body.id).toBe(ids.petitionId);
	});

	test('GET /api/v1/petitions lists the petition', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: PetitionApi[] }>(
			'/api/v1/petitions'
		);
		expect(response.status).toBe(200);
		expect(response.body.data.some((p) => p.id === ids.petitionId)).toBe(true);
	});

	test('PUT /api/v1/petitions/:petitionId updates the title visible in the UI', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const newTitle = `${ids.title} (api-edited)`;

		const response = await client.put<PetitionApi>(`/api/v1/petitions/${ids.petitionId}`, {
			title: newTitle
		});
		expect(response.status).toBe(200);
		expect(response.body.title).toBe(newTitle);
		ids.title = newTitle;

		const editPage = new PetitionEditPage(page);
		await loginAsOwner(page);
		await page.goto(`/petitions/${ids.petitionId}/edit`);
		await editPage.waitForForm();
		await expect(editPage.titleInput).toHaveValue(newTitle, { timeout: 15_000 });
	});

	test('DELETE /api/v1/petitions/:petitionId removes the petition from the list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/petitions/${ids.petitionId}`);
		expect(response.status).toBe(204);

		const petitionList = new PetitionListPage(page);
		await loginAsOwner(page);
		await petitionList.goto();
		await expect(page.getByText(ids.title)).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/petitions with missing required fields returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/petitions', {
			// Missing title, slug, shortDescription, published, settings.
			description: null
		});
		expectValidationError(response);
	});

	test('POST /api/v1/petitions with malformed slug returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(
			'/api/v1/petitions',
			buildPetitionBody({ slug: 'Has Spaces And Caps!' })
		);
		expectValidationError(response);
	});

	test('POST /api/v1/petitions with invalid JSON returns 400', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.postRaw<{ message?: string; error?: string }>(
			'/api/v1/petitions',
			'{still not valid'
		);
		expect(response.status).toBe(400);
	});
});
