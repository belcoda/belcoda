import { expect, test } from '@playwright/test';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { TeamsPage, TeamDetailPage } from '../pages/settings/teams.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type TeamApi = {
	id: string;
	name: string;
	parentTeamId: string | null;
};

test.describe.serial('API v1 Person Teams', () => {
	let apiKey: string;
	const ids = {
		personId: '',
		personPath: '',
		teamId: '',
		teamName: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('owner creates a person and a team to associate', async ({ page }) => {
		const suffix = Date.now();
		const personCreate = new PersonCreatePage(page);
		const teamsPage = new TeamsPage(page);
		ids.teamName = `E2E API Team ${suffix}`;

		await loginAsOwner(page);
		await personCreate.goto();
		await personCreate.fillRequiredFields(
			'TeamsApi',
			`Subject ${suffix}`,
			`teams-api-${suffix}@belcoda.test`
		);
		await personCreate.submit();
		await expect(page).toHaveURL(
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i
		);
		ids.personPath = new URL(page.url()).pathname;
		ids.personId = ids.personPath.split('/')[2] ?? '';
		expect(ids.personId).not.toBe('');

		await teamsPage.goto();
		await teamsPage.createTeam(ids.teamName);
		const row = teamsPage.teamRowByName(ids.teamName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		ids.teamId = (await row.getAttribute('data-team-id')) ?? '';
		expect(ids.teamId).not.toBe('');
	});

	test('GET /api/v1/person/:personId/teams returns an empty list initially', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: TeamApi[] }>(
			`/api/v1/person/${ids.personId}/teams`
		);
		expect(response.status).toBe(200);
		expect(response.body.data).toEqual([]);
	});

	test('POST /api/v1/person/:personId/teams adds a team visible on profile + team detail', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const response = await client.post<TeamApi>(`/api/v1/person/${ids.personId}/teams`, {
			teamId: ids.teamId
		});
		expect(response.status).toBe(200);
		expect(response.body.id).toBe(ids.teamId);
		expect(response.body.name).toBe(ids.teamName);

		await loginAsOwner(page);

		const profile = new PersonProfilePage(page);
		await profile.goto(`/community/${ids.personId}/profile`);
		await profile.waitForLoaded();
		await expect(
			page.locator(`[data-testid="person-profile-team-chip"][data-team-id="${ids.teamId}"]`)
		).toBeVisible({ timeout: 15_000 });

		const teamDetail = new TeamDetailPage(page);
		await teamDetail.goto(ids.teamId);
		await expect(teamDetail.personRow(ids.personId)).toBeVisible({ timeout: 15_000 });
	});

	test('GET /api/v1/person/:personId/teams lists the assigned team', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: TeamApi[] }>(
			`/api/v1/person/${ids.personId}/teams`
		);
		expect(response.status).toBe(200);
		expect(response.body.data.some((t) => t.id === ids.teamId)).toBe(true);
	});

	test('POST again with same teamId returns 204 (already linked)', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.post<unknown>(`/api/v1/person/${ids.personId}/teams`, {
			teamId: ids.teamId
		});
		expect(response.status).toBe(204);
	});

	test('DELETE /api/v1/person/:personId/teams/:teamId removes the chip and team-detail row', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/person/${ids.personId}/teams/${ids.teamId}`);
		expect(response.status).toBe(204);

		await loginAsOwner(page);

		const profile = new PersonProfilePage(page);
		await profile.goto(`/community/${ids.personId}/profile`);
		await profile.waitForLoaded();
		await expect(
			page.locator(`[data-testid="person-profile-team-chip"][data-team-id="${ids.teamId}"]`)
		).toHaveCount(0, { timeout: 15_000 });

		const teamDetail = new TeamDetailPage(page);
		await teamDetail.goto(ids.teamId);
		await expect(teamDetail.personRow(ids.personId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/person/:personId/teams with missing teamId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(
			`/api/v1/person/${ids.personId}/teams`,
			{}
		);
		expectValidationError(response);
	});

	test('POST /api/v1/person/:personId/teams with non-uuid teamId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(`/api/v1/person/${ids.personId}/teams`, {
			teamId: 'not-a-uuid'
		});
		expectValidationError(response);
	});
});
