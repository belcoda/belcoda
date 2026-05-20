import { expect, test } from '@playwright/test';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { TagsPage } from '../pages/settings/tags.page';
import { TeamsPage } from '../pages/settings/teams.page';
import { loginAsOwner } from '../helpers/login';
import { CommunityPage } from '../pages/community/community.page';

const PROJECT = 'community' as const;

test.describe.serial('Community and person pages', () => {
	const ids = {
		personId: '',
		personPath: '',
		givenName: '',
		familyName: '',
		tagId: '',
		tagName: '',
		teamId: '',
		teamName: ''
	};

	test('owner can create a person and land on their timeline', async ({ page }) => {
		const suffix = `${Date.now()}`;
		ids.givenName = 'E2E';
		ids.familyName = `Person ${suffix}`;
		const email = `e2e-person-${suffix}@belcoda.test`;

		const personCreate = new PersonCreatePage(page);

		await loginAsOwner(page, PROJECT);

		await personCreate.goto();
		await expect(page.getByTestId('person-create-heading')).toBeVisible();
		await personCreate.fillRequiredFields(ids.givenName, ids.familyName, email);
		await personCreate.submit();

		await expect(page).toHaveURL(
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i
		);
		ids.personPath = new URL(page.url()).pathname;
		ids.personId = ids.personPath.split('/')[2] ?? '';
		await expect(page.getByTestId('person-timeline-display-name')).toHaveText(
			`${ids.givenName} ${ids.familyName}`
		);
	});

	test('owner can find the person using the community list search', async ({ page }) => {
		const communityPage = new CommunityPage(page);

		await loginAsOwner(page, PROJECT);
		await communityPage.goto();
		await communityPage.searchCommunityList(ids.familyName);

		const personLink = communityPage.personListLink(ids.personId);
		await expect(personLink).toBeVisible();
		await expect(personLink).toContainText(ids.givenName);
		await expect(personLink).toContainText(ids.familyName);
	});

	test('owner can navigate from the timeline to the profile page', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		await page.getByTestId('person-timeline-display-name').click();
		await expect(page).toHaveURL(`${ids.personPath}/profile`);
		await expect(page.getByTestId('person-profile-name-display')).toBeVisible();
	});

	test('owner can edit the name of a person from the profile page', async ({ page }) => {
		const profilePage = new PersonProfilePage(page);
		const suffix = `${Date.now()}`;
		const newGivenName = 'E2EEdited';
		const newFamilyName = `Person ${suffix}`;

		await loginAsOwner(page, PROJECT);
		await profilePage.goto(ids.personPath);

		await expect(profilePage.nameDisplay).toContainText(ids.givenName);
		await profilePage.editName(newGivenName, newFamilyName);

		await expect(profilePage.nameDisplay).toContainText(newGivenName);
		await expect(profilePage.nameDisplay).toContainText(newFamilyName);

		ids.givenName = newGivenName;
		ids.familyName = newFamilyName;
	});

	test('updated name is reflected on the timeline', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);

		await expect(page.getByTestId('person-timeline-display-name')).toHaveText(
			`${ids.givenName} ${ids.familyName}`
		);
	});

	test('owner can edit the email address of a person from the profile page', async ({ page }) => {
		const profilePage = new PersonProfilePage(page);
		const suffix = `${Date.now()}`;
		const newEmail = `e2e-edited-${suffix}@belcoda.test`;

		await loginAsOwner(page, PROJECT);
		await profilePage.goto(ids.personPath);

		await profilePage.editEmail(newEmail);

		await expect(page.getByTestId('person-profile-email-display')).toHaveText(newEmail);
	});

	test('owner can create a tag and add it to a person from the timeline dropdown', async ({
		page
	}) => {
		const tagsPage = new TagsPage(page);
		const suffix = `${Date.now()}`;
		ids.tagName = `E2E Tag ${suffix}`;

		await loginAsOwner(page, PROJECT);

		await tagsPage.goto();
		await tagsPage.createTag(ids.tagName);
		const tagRow = tagsPage.tagRowByName(ids.tagName);
		await expect(tagRow).toBeVisible({ timeout: 15_000 });
		ids.tagId = (await tagRow.getAttribute('data-tag-id')) ?? '';
		expect(ids.tagId).not.toBe('');

		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		await page.getByTestId('notes-action-dropdown-trigger').click();
		await page.getByTestId('notes-action-add-tag').waitFor({ state: 'visible', timeout: 5_000 });
		await page.getByTestId('notes-action-add-tag').click();
		const tagFilter = page.getByPlaceholder('Filter tags...');
		await expect(tagFilter).toBeVisible({ timeout: 5_000 });
		await tagFilter.fill(ids.tagName);
		await page.getByRole('option', { name: ids.tagName }).click();

		await page.goto(`${ids.personPath}/profile`);
		const profileLoaded = page.getByTestId('person-profile-loaded');
		await profileLoaded.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(profileLoaded.getByText(ids.tagName)).toBeVisible({ timeout: 10_000 });
	});

	test('owner can create a team and add the person to it from the timeline dropdown', async ({
		page
	}) => {
		const teamsPage = new TeamsPage(page);
		const suffix = `${Date.now()}`;
		ids.teamName = `E2E Team ${suffix}`;

		await loginAsOwner(page, PROJECT);

		await teamsPage.goto();
		await teamsPage.createTeam(ids.teamName);
		const teamRow = teamsPage.teamRowByName(ids.teamName);
		await expect(teamRow).toBeVisible({ timeout: 15_000 });
		ids.teamId = (await teamRow.getAttribute('data-team-id')) ?? '';
		expect(ids.teamId).not.toBe('');

		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		await page.getByTestId('notes-action-dropdown-trigger').click();
		await page.getByTestId('notes-action-add-team').waitFor({ state: 'visible', timeout: 5_000 });
		await page.getByTestId('notes-action-add-team').click();
		const teamFilter = page.getByPlaceholder('Filter teams...');
		await expect(teamFilter).toBeVisible({ timeout: 5_000 });
		await teamFilter.fill(ids.teamName);
		await page.getByRole('option', { name: ids.teamName }).click();

		await page.goto(`${ids.personPath}/profile`);
		const profileLoaded = page.getByTestId('person-profile-loaded');
		await profileLoaded.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(profileLoaded.getByText(ids.teamName)).toBeVisible({ timeout: 10_000 });
	});

	test('owner can add a note from the notes drawer on the timeline', async ({ page }) => {
		const noteText = `E2E test note ${Date.now()}`;

		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		await page.getByTestId('notes-action-notes-btn').click();

		const textarea = page.getByTestId('note-form-textarea');
		await expect(textarea).toBeVisible({ timeout: 10_000 });
		await textarea.fill(noteText);
		await page.getByTestId('note-form-submit').click();

		await expect(page.getByTestId('person-note-item').first()).toBeVisible({ timeout: 10_000 });
		await expect(page.getByTestId('person-note-content').first()).toHaveText(noteText);
	});

	test('owner can delete the person from the person profile page', async ({ page }) => {
		const communityPage = new CommunityPage(page);
		const profilePage = new PersonProfilePage(page);
		await loginAsOwner(page, PROJECT);
		await profilePage.goto(ids.personPath);
		await profilePage.waitForLoaded();
		await expect(profilePage.deleteButton).toBeVisible({ timeout: 10_000 });
		await profilePage.deletePersonWithConfirm();
		await expect(page).toHaveURL(/\/community\/?$/);
		await communityPage.searchCommunityList(ids.familyName);
		await expect(communityPage.personListLink(ids.personId)).toHaveCount(0, { timeout: 20_000 });
	});
});
