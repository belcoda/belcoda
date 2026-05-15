import { expect, test } from '@playwright/test';
import { TeamsPage } from '../pages/settings/teams.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type TeamApi = {
	id: string;
	name: string;
	parentTeamId: string | null;
};

test.describe.serial('API v1 Team', () => {
	let apiKey: string;
	const ids = {
		teamId: '',
		teamName: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('POST /api/v1/teams creates a team visible in the teams list', async ({ page, request }) => {
		const client = makeClient(request);
		ids.teamName = `API Team ${Date.now()}`;

		const response = await client.post<TeamApi>('/api/v1/teams', {
			name: ids.teamName,
			parentTeamId: null
		});
		expect(response.status).toBe(200);
		expect(response.body.name).toBe(ids.teamName);
		ids.teamId = response.body.id;
		expect(ids.teamId).not.toBe('');

		const teamsPage = new TeamsPage(page);
		await loginAsOwner(page);
		await teamsPage.goto();

		const row = teamsPage.teamRow(ids.teamId);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await expect(row.getByTestId('team-row-name')).toHaveText(ids.teamName);
	});

	test('GET /api/v1/teams/:teamId matches the name shown in the list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const teamsPage = new TeamsPage(page);
		await loginAsOwner(page);
		await teamsPage.goto();
		const row = teamsPage.teamRow(ids.teamId);
		await expect(row).toBeVisible({ timeout: 15_000 });
		const uiName = (await row.getByTestId('team-row-name').textContent())?.trim();

		const response = await client.get<TeamApi>(`/api/v1/teams/${ids.teamId}`);
		expect(response.status).toBe(200);
		expect(response.body.name).toBe(uiName);
		expect(response.body.id).toBe(ids.teamId);
	});

	test('GET /api/v1/teams lists the team', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: TeamApi[] }>(
			'/api/v1/teams'
		);
		expect(response.status).toBe(200);
		expect(response.body.data.some((t) => t.id === ids.teamId)).toBe(true);
	});

	test('PUT /api/v1/teams/:teamId renames the team visible in the UI', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const newName = `${ids.teamName} (api-edited)`;

		const response = await client.put<TeamApi>(`/api/v1/teams/${ids.teamId}`, { name: newName });
		expect(response.status).toBe(200);
		expect(response.body.name).toBe(newName);
		ids.teamName = newName;

		const teamsPage = new TeamsPage(page);
		await loginAsOwner(page);
		await teamsPage.goto();
		await expect(teamsPage.teamRow(ids.teamId).getByTestId('team-row-name')).toHaveText(newName, {
			timeout: 15_000
		});
	});

	test('DELETE /api/v1/teams/:teamId (soft delete) removes the team from the list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/teams/${ids.teamId}`);
		expect(response.status).toBe(204);

		const teamsPage = new TeamsPage(page);
		await loginAsOwner(page);
		await teamsPage.goto();
		await expect(teamsPage.teamRow(ids.teamId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/teams with missing name returns a validation error', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/teams', {});
		expectValidationError(response);
	});

	test('POST /api/v1/teams with non-uuid parentTeamId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/teams', {
			name: `Bad Parent Team ${Date.now()}`,
			parentTeamId: 'not-a-uuid'
		});
		expectValidationError(response);
	});

	test('PUT /api/v1/teams/:teamId with empty name returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		// Use a fresh team since the prior one was deleted.
		const created = await client.post<TeamApi>('/api/v1/teams', {
			name: `Team ${Date.now()}`,
			parentTeamId: null
		});
		expect(created.status).toBe(200);

		const response = await client.put<{ error: string }>(`/api/v1/teams/${created.body.id}`, {
			name: ''
		});
		expectValidationError(response);
	});

	test('POST /api/v1/teams with invalid JSON returns 400', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.postRaw<{ message?: string; error?: string }>(
			'/api/v1/teams',
			'{nope'
		);
		expect(response.status).toBe(400);
	});
});
