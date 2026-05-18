import { expect, test } from '@playwright/test';
import { CommunityPage } from '../pages/community/community.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type PersonApi = {
	id: string;
	givenName: string | null;
	familyName: string | null;
	emailAddress: string | null;
	country: string;
	preferredLanguage: string;
};

test.describe.serial('API v1 Person', () => {
	let apiKey: string;
	const ids = {
		seedPersonId: '',
		seedPersonPath: '',
		seedGivenName: '',
		seedFamilyName: '',
		seedEmail: '',
		apiCreatedId: '',
		apiCreatedGivenName: '',
		apiCreatedFamilyName: '',
		apiCreatedEmail: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('owner creates a seed person via the UI', async ({ page }) => {
		const suffix = Date.now();
		ids.seedGivenName = 'ApiSeed';
		ids.seedFamilyName = `Person ${suffix}`;
		ids.seedEmail = `api-seed-${suffix}@belcoda.test`;

		const personCreate = new PersonCreatePage(page);
		await loginAsOwner(page);
		await personCreate.goto();
		await personCreate.fillRequiredFields(ids.seedGivenName, ids.seedFamilyName, ids.seedEmail);
		await personCreate.submit();

		await expect(page).toHaveURL(
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i
		);
		ids.seedPersonPath = new URL(page.url()).pathname;
		ids.seedPersonId = ids.seedPersonPath.split('/')[2] ?? '';
		expect(ids.seedPersonId).not.toBe('');
	});

	test('GET /api/v1/person/:personId returns the same name and email as the UI', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const profile = new PersonProfilePage(page);
		await loginAsOwner(page);
		await profile.goto(ids.seedPersonPath);
		await profile.waitForLoaded();

		const uiName = (await profile.nameDisplay.textContent())?.replace(/\s+/g, ' ').trim();
		const uiEmail = (await page.getByTestId('person-profile-email-display').textContent())?.trim();

		const response = await client.get<PersonApi>(`/api/v1/person/${ids.seedPersonId}`);
		expect(response.status).toBe(200);
		expect(response.body.id).toBe(ids.seedPersonId);

		const apiName = `${response.body.givenName ?? ''} ${response.body.familyName ?? ''}`
			.replace(/\s+/g, ' ')
			.trim();
		expect(apiName).toBe(uiName);
		expect(response.body.emailAddress).toBe(uiEmail);
	});

	test('GET /api/v1/person returns a list including the seed person', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: PersonApi[] }>(
			'/api/v1/person'
		);

		expect(response.status).toBe(200);
		expect(response.body.metadata.count).toBeGreaterThan(0);
		expect(response.body.data.some((p) => p.id === ids.seedPersonId)).toBe(true);
	});

	test('POST /api/v1/person creates a person visible in the community list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const suffix = Date.now();
		ids.apiCreatedGivenName = 'ApiCreated';
		ids.apiCreatedFamilyName = `Person ${suffix}`;
		ids.apiCreatedEmail = `api-created-${suffix}@belcoda.test`;

		const response = await client.post<PersonApi>('/api/v1/person', {
			givenName: ids.apiCreatedGivenName,
			familyName: ids.apiCreatedFamilyName,
			emailAddress: ids.apiCreatedEmail,
			country: 'US',
			preferredLanguage: 'en'
		});

		expect(response.status).toBe(200);
		expect(response.body.givenName).toBe(ids.apiCreatedGivenName);
		expect(response.body.familyName).toBe(ids.apiCreatedFamilyName);
		expect(response.body.emailAddress).toBe(ids.apiCreatedEmail.toLowerCase());
		ids.apiCreatedId = response.body.id;
		expect(ids.apiCreatedId).not.toBe('');

		const community = new CommunityPage(page);
		await loginAsOwner(page);
		await community.goto();
		await community.searchCommunityList(ids.apiCreatedFamilyName);

		await expect(community.personListLink(ids.apiCreatedId)).toBeVisible({ timeout: 15_000 });
		await expect(community.personListLink(ids.apiCreatedId)).toContainText(ids.apiCreatedGivenName);
	});

	test('PUT /api/v1/person/:personId updates fields visible on the profile', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const suffix = Date.now();
		const newGivenName = 'ApiUpdated';
		const newFamilyName = `Person ${suffix}`;

		const response = await client.put<PersonApi>(`/api/v1/person/${ids.apiCreatedId}`, {
			givenName: newGivenName,
			familyName: newFamilyName
		});
		expect(response.status).toBe(200);
		expect(response.body.givenName).toBe(newGivenName);
		expect(response.body.familyName).toBe(newFamilyName);

		ids.apiCreatedGivenName = newGivenName;
		ids.apiCreatedFamilyName = newFamilyName;

		const profile = new PersonProfilePage(page);
		await loginAsOwner(page);
		await profile.goto(`/community/${ids.apiCreatedId}`);
		await profile.waitForLoaded();
		await expect(profile.nameDisplay).toContainText(newGivenName, { timeout: 15_000 });
		await expect(profile.nameDisplay).toContainText(newFamilyName, { timeout: 15_000 });
	});

	test('DELETE /api/v1/person/:personId removes the person from the community list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const response = await client.delete(`/api/v1/person/${ids.apiCreatedId}`);
		expect(response.status).toBe(204);

		const community = new CommunityPage(page);
		await loginAsOwner(page);
		await community.goto();
		await community.searchCommunityList(ids.apiCreatedFamilyName);
		await expect(community.personListLink(ids.apiCreatedId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/person with a body missing required fields returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/person', {
			// `country` and `preferredLanguage` are required, plus the schema requires
			// at least one of givenName/familyName and one of email/phone.
			givenName: 'NoEmailOrPhone'
		});

		expectValidationError(response);
	});

	test('POST /api/v1/person with invalid JSON returns 400', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.postRaw<{ message?: string; error?: string }>(
			'/api/v1/person',
			'{not valid json'
		);
		expect(response.status).toBe(400);
	});

	test('PUT /api/v1/person/:personId with an invalid country code returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.put<{ error: string }>(`/api/v1/person/${ids.seedPersonId}`, {
			country: 'NOT_A_COUNTRY'
		});
		expectValidationError(response);
	});
});
