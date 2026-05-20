import { expect, test } from '@playwright/test';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { TeamsPage, TeamDetailPage } from '../pages/settings/teams.page';
import { loginAsOwner, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'community' as const;

test.describe.serial('Settings: Teams', () => {
	const ids = {
		teamId: '',
		teamName: '',
		personId: '',
		personGivenName: '',
		personFamilyName: ''
	};

	test('owner can create a team', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const suffix = `${Date.now()}`;
		ids.teamName = `E2E Team ${suffix}`;

		await loginAsOwner(page, PROJECT);
		await teamsPage.goto();

		await teamsPage.createTeam(ids.teamName);

		const row = teamsPage.teamRowByName(ids.teamName);
		await expect(row).toBeVisible({ timeout: 15_000 });

		ids.teamId = (await row.getAttribute('data-team-id')) ?? '';
		expect(ids.teamId).not.toBe('');
	});

	test('new team appears in the teams list', async ({ page }) => {
		const teamsPage = new TeamsPage(page);

		await loginAsOwner(page, PROJECT);
		await teamsPage.goto();

		await expect(teamsPage.teamRow(ids.teamId)).toBeVisible({ timeout: 15_000 });
	});

	test('owner can rename a team', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const newName = `${ids.teamName} Renamed`;

		await loginAsOwner(page, PROJECT);
		await teamsPage.goto();

		await teamsPage.editTeam(ids.teamId, newName);

		const row = teamsPage.teamRow(ids.teamId);
		await expect(row.getByTestId('team-row-name')).toHaveText(newName, { timeout: 15_000 });

		ids.teamName = newName;
	});

	test('owner can navigate to the team detail page', async ({ page }) => {
		const teamsPage = new TeamsPage(page);

		await loginAsOwner(page, PROJECT);
		await teamsPage.goto();

		await teamsPage.teamRow(ids.teamId).getByTestId('team-row-name').click();
		await expect(page).toHaveURL(`/settings/teams/${ids.teamId}`);
	});

	test('owner can add a person to the team', async ({ page }) => {
		const personCreate = new PersonCreatePage(page);
		const teamDetail = new TeamDetailPage(page);
		const suffix = `${Date.now()}`;
		ids.personGivenName = 'E2ETeam';
		ids.personFamilyName = `Member ${suffix}`;
		const email = `e2e-team-member-${suffix}@belcoda.test`;

		await loginAsOwner(page, PROJECT);

		await personCreate.goto();
		await personCreate.fillRequiredFields(ids.personGivenName, ids.personFamilyName, email);
		await personCreate.submit();
		await expect(page).toHaveURL(
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i
		);
		ids.personId = new URL(page.url()).pathname.split('/')[2] ?? '';
		expect(ids.personId).not.toBe('');

		await teamDetail.goto(ids.teamId);
		await teamDetail.addPersonTrigger.click();

		const searchInput = page.getByPlaceholder(/search/i).first();
		await searchInput.fill(`${ids.personGivenName} ${ids.personFamilyName}`);

		const personCheckbox = page.locator(`label[for="person-${ids.personId}"]`);
		await expect(personCheckbox).toBeVisible({ timeout: 15_000 });
		await personCheckbox.click();

		const confirmButton = page.getByRole('button', { name: /add to team/i });
		await confirmButton.click();

		await expect(teamDetail.personRow(ids.personId)).toBeVisible({ timeout: 15_000 });
	});

	test('person is listed on the team detail page', async ({ page }) => {
		const teamDetail = new TeamDetailPage(page);

		await loginAsOwner(page, PROJECT);
		await teamDetail.goto(ids.teamId);

		await expect(teamDetail.personRow(ids.personId)).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot access team management', async ({ page }) => {
		const teamsPage = new TeamsPage(page);

		await loginAsMember(page, PROJECT);
		await teamsPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(teamsPage.newTeamTrigger).toHaveCount(0);
		await expect(teamsPage.teamRow(ids.teamId)).toHaveCount(0);
	});

	test('member cannot access team detail management', async ({ page }) => {
		const teamDetail = new TeamDetailPage(page);

		await loginAsMember(page, PROJECT);
		await teamDetail.goto(ids.teamId);

		await expectMemberCannotAccessSettings(page);
		await expect(teamDetail.addPersonTrigger).toHaveCount(0);
		await expect(teamDetail.removePersonButton(ids.personId)).toHaveCount(0);
	});

	test('owner can remove a person from the team', async ({ page }) => {
		const teamDetail = new TeamDetailPage(page);

		await loginAsOwner(page, PROJECT);
		await teamDetail.goto(ids.teamId);

		await teamDetail.removePersonButton(ids.personId).click();

		await expect(teamDetail.personRow(ids.personId)).toHaveCount(0, { timeout: 15_000 });
	});
});
