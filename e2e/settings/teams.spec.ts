import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { TeamsPage, TeamDetailPage } from '../pages/settings/teams.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function loginAsMember(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.member.email, TEST_USERS.member.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

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

		await loginAsOwner(page);
		await teamsPage.goto();

		await teamsPage.createTeam(ids.teamName);

		const row = teamsPage.teamRowByName(ids.teamName);
		await expect(row).toBeVisible({ timeout: 15_000 });

		ids.teamId = (await row.getAttribute('data-team-id')) ?? '';
		expect(ids.teamId).not.toBe('');
	});

	test('new team appears in the teams list', async ({ page }) => {
		const teamsPage = new TeamsPage(page);

		await loginAsOwner(page);
		await teamsPage.goto();

		await expect(teamsPage.teamRow(ids.teamId)).toBeVisible({ timeout: 15_000 });
	});

	test('owner can rename a team', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const newName = `${ids.teamName} Renamed`;

		await loginAsOwner(page);
		await teamsPage.goto();

		await teamsPage.editTeam(ids.teamId, newName);

		const row = teamsPage.teamRow(ids.teamId);
		await expect(row.getByTestId('team-row-name')).toHaveText(newName, { timeout: 15_000 });

		ids.teamName = newName;
	});

	test('owner can navigate to the team detail page', async ({ page }) => {
		const teamsPage = new TeamsPage(page);

		await loginAsOwner(page);
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

		await loginAsOwner(page);

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

		await loginAsOwner(page);
		await teamDetail.goto(ids.teamId);

		await expect(teamDetail.personRow(ids.personId)).toBeVisible({ timeout: 15_000 });
	});

	test('owner can remove a person from the team', async ({ page }) => {
		const teamDetail = new TeamDetailPage(page);

		await loginAsOwner(page);
		await teamDetail.goto(ids.teamId);

		await teamDetail.removePersonButton(ids.personId).click();

		await expect(teamDetail.personRow(ids.personId)).toHaveCount(0, { timeout: 15_000 });
	});

	test('member cannot create a team', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const suffix = `${Date.now()}`;
		const teamName = `E2E Member Team ${suffix}`;

		await loginAsMember(page);
		await teamsPage.goto();

		await teamsPage.createTeam(teamName);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(teamsPage.teamRowByName(teamName)).toHaveCount(0, { timeout: 15_000 });
	});

	test('member cannot edit a team', async ({ page }) => {
		const teamsPage = new TeamsPage(page);
		const newName = `${ids.teamName} Member Edit`;

		await loginAsMember(page);
		await teamsPage.goto();

		await teamsPage.editTeam(ids.teamId, newName);

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot add person to team', async ({ page }) => {
		const teamDetail = new TeamDetailPage(page);

		await loginAsMember(page);
		await teamDetail.goto(ids.teamId);

		await teamDetail.addPersonTrigger.click();

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
	});

	test('member cannot remove person from team', async ({ page }) => {
		const teamDetail = new TeamDetailPage(page);

		await loginAsMember(page);
		await teamDetail.goto(ids.teamId);

		await teamDetail.removePersonButton(ids.personId).click();

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
	});
});
