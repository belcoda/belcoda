import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { PetitionSignaturesPage } from '../pages/petitions/petition-signatures.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type PetitionApi = { id: string; title: string };
type PersonApi = { id: string; givenName: string; familyName: string };
type PetitionSignatureApi = {
	id: string;
	petitionId: string;
	personId: string;
	details: { channel: { type: string } };
	responses: unknown;
};

function buildPetitionBody() {
	const now = Date.now();
	return {
		title: `API Signature Petition ${now}`,
		slug: `api-sig-petition-${now}`,
		shortDescription: 'Petition for signature API tests.',
		description: null,
		published: true,
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
		pointPersonId: null
	};
}

test.describe.serial('API v1 Petition Signature', () => {
	let apiKey: string;
	const ids = {
		petitionId: '',
		personId: '',
		givenName: '',
		familyName: '',
		signatureId: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('seed: create a petition and a person via API', async ({ request }) => {
		const client = makeClient(request);
		const suffix = Date.now();
		ids.givenName = 'PetitionSigApi';
		ids.familyName = `Signer ${suffix}`;

		const petitionResp = await client.post<PetitionApi>('/api/v1/petitions', buildPetitionBody());
		expect(petitionResp.status).toBe(200);
		ids.petitionId = petitionResp.body.id;
		expect(ids.petitionId).not.toBe('');

		const personResp = await client.post<PersonApi>('/api/v1/person', {
			givenName: ids.givenName,
			familyName: ids.familyName,
			emailAddress: `petition-sig-api-${suffix}@belcoda.test`,
			country: 'US',
			preferredLanguage: 'en'
		});
		expect(personResp.status).toBe(200);
		ids.personId = personResp.body.id;
		expect(ids.personId).not.toBe('');
	});

	test('POST /api/v1/petitions/:petitionId/signatures creates a visible signature row', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<PetitionSignatureApi>(
			`/api/v1/petitions/${ids.petitionId}/signatures`,
			{
				personId: ids.personId,
				details: { channel: { type: 'adminPanel' } }
			}
		);
		expect(response.status).toBe(200);
		expect(response.body.petitionId).toBe(ids.petitionId);
		expect(response.body.personId).toBe(ids.personId);
		ids.signatureId = response.body.id;
		expect(ids.signatureId).not.toBe('');

		await loginAsOwner(page);
		await page.goto(`/petitions/${ids.petitionId}`);
		const sigPage = new PetitionSignaturesPage(page);
		await sigPage.summaryTable.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(sigPage.summaryTable).toContainText(ids.givenName, { timeout: 15_000 });
		await expect(sigPage.summaryTable).toContainText(ids.familyName);
	});

	test('GET /api/v1/petitions/:petitionId/signatures/:signatureId reflects the UI signature', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.get<PetitionSignatureApi>(
			`/api/v1/petitions/${ids.petitionId}/signatures/${ids.signatureId}`
		);
		expect(response.status).toBe(200);
		expect(response.body.id).toBe(ids.signatureId);
		expect(response.body.petitionId).toBe(ids.petitionId);
		expect(response.body.personId).toBe(ids.personId);
	});

	test('GET /api/v1/petitions/:petitionId/signatures lists the new signature', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.get<{
			metadata: { count: number };
			data: PetitionSignatureApi[];
		}>(`/api/v1/petitions/${ids.petitionId}/signatures`);
		expect(response.status).toBe(200);
		expect(response.body.metadata.count).toBeGreaterThan(0);
		expect(response.body.data.some((s) => s.id === ids.signatureId)).toBe(true);
	});

	test('PUT /api/v1/petitions/:petitionId/signatures/:signatureId updates `responses`', async ({
		request
	}) => {
		const client = makeClient(request);
		const newResponses = { question1: 'updated answer' };

		const response = await client.put<PetitionSignatureApi>(
			`/api/v1/petitions/${ids.petitionId}/signatures/${ids.signatureId}`,
			{ responses: newResponses }
		);
		expect(response.status).toBe(200);
		expect(response.body.responses).toEqual(newResponses);

		// Confirm via GET that the change persisted.
		const re = await client.get<PetitionSignatureApi>(
			`/api/v1/petitions/${ids.petitionId}/signatures/${ids.signatureId}`
		);
		expect(re.body.responses).toEqual(newResponses);
	});

	test('DELETE /api/v1/petitions/:petitionId/signatures/:signatureId removes from the list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(
			`/api/v1/petitions/${ids.petitionId}/signatures/${ids.signatureId}`
		);
		expect(response.status).toBe(204);

		await loginAsOwner(page);
		await page.goto(`/petitions/${ids.petitionId}`);
		const sigPage = new PetitionSignaturesPage(page);
		await sigPage.summaryTable.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(sigPage.summaryTable).not.toContainText(ids.familyName, { timeout: 15_000 });
	});

	test('GET /api/v1/petitions/:otherPetitionId/signatures/:signatureId returns 404', async ({
		request
	}) => {
		const client = makeClient(request);
		const otherPetition = await client.post<PetitionApi>('/api/v1/petitions', buildPetitionBody());
		expect(otherPetition.status).toBe(200);

		const fresh = await client.post<PetitionSignatureApi>(
			`/api/v1/petitions/${ids.petitionId}/signatures`,
			{ personId: ids.personId, details: { channel: { type: 'adminPanel' } } }
		);
		expect(fresh.status).toBe(200);

		const response = await client.get<{ message: string }>(
			`/api/v1/petitions/${otherPetition.body.id}/signatures/${fresh.body.id}`
		);
		expect(response.status).toBe(404);
	});

	test('POST /api/v1/petitions/:petitionId/signatures with missing personId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(
			`/api/v1/petitions/${ids.petitionId}/signatures`,
			{ details: { channel: { type: 'adminPanel' } } }
		);
		expectValidationError(response);
	});

	test('POST /api/v1/petitions/:petitionId/signatures with invalid channel type returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(
			`/api/v1/petitions/${ids.petitionId}/signatures`,
			{
				personId: ids.personId,
				details: { channel: { type: 'definitelyNotAChannel' } }
			}
		);
		expectValidationError(response);
	});
});
