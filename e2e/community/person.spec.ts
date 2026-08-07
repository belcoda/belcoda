import { expect, test } from '@playwright/test';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { TagsPage } from '../pages/settings/tags.page';
import { TeamsPage } from '../pages/settings/teams.page';
import { loginAsOwner } from '../helpers/login';
import { CommunityPage } from '../pages/community/community.page';
import { BASE_URL } from '../helpers/config';

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
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 30_000 }
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

		const personLink = communityPage.personListLink(ids.personId);
		await expect(async () => {
			await communityPage.searchCommunityList(ids.familyName);
			await expect(personLink).toBeVisible();
		}).toPass({ timeout: 30_000 });

		await expect(personLink).toContainText(ids.givenName);
		await expect(personLink).toContainText(ids.familyName);
	});

	test('owner can use the person context panel on desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1400, height: 900 });
		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);

		const panel = page.getByTestId('person-context-panel');
		await expect(panel).toBeVisible();
		await expect(panel.getByTestId('person-context-panel-name')).toHaveText(
			`${ids.givenName} ${ids.familyName}`
		);
		await expect(panel.getByTestId('person-context-details')).toBeVisible();
		await expect(panel.getByTestId('person-context-email-status')).toBeVisible();

		const noteText = `Context panel note ${Date.now()}`;
		await panel.getByTestId('person-context-add-note').click();
		await panel.getByTestId('note-form-textarea').fill(noteText);
		await panel.getByTestId('note-form-submit').click();
		await expect(panel.getByTestId('person-context-note')).toHaveText(noteText);

		await panel.getByRole('button', { name: 'Hide person profile' }).click();
		const collapsedPanel = page.getByTestId('person-context-panel-collapsed');
		await expect(collapsedPanel).toBeVisible();

		await collapsedPanel.getByRole('button', { name: 'Show person profile' }).click();
		await expect(panel).toBeVisible();

		await panel.getByTestId('person-context-panel-full-profile').click();
		await expect(page).toHaveURL(`${ids.personPath}/profile`);
	});

	test('owner can open and close the person context drawer on a small screen', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(ids.personPath);

		const drawerTrigger = page.getByTestId('person-context-drawer-trigger');
		await expect(drawerTrigger).toBeVisible();
		await expect(page.locator('[data-testid="person-context-panel"]:visible')).toHaveCount(0);

		await drawerTrigger.click();
		const drawerPanel = page.locator('[data-testid="person-context-panel"]:visible');
		await expect(drawerPanel).toBeVisible();
		await expect(drawerPanel.getByTestId('person-context-panel-name')).toHaveText(
			`${ids.givenName} ${ids.familyName}`
		);
		await expect(drawerPanel.getByTestId('person-context-details')).toBeVisible();

		await drawerPanel.getByRole('button', { name: 'Close person profile' }).click();
		await expect(drawerPanel).toHaveCount(0);
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
		await expect(async () => {
			await profilePage.editName(newGivenName, newFamilyName);
		}).toPass({ timeout: 30_000 });

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

		await expect(async () => {
			await profilePage.editEmail(newEmail);
		}).toPass({ timeout: 30_000 });

		await expect(page.getByTestId('person-profile-email-display')).toHaveText(newEmail, {
			timeout: 15_000
		});
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

	test('owner can load more notes in the notes drawer', async ({ page, request }) => {
		const seedResponse = await request.post(`${BASE_URL}/api/e2e/seed-person-notes`, {
			data: { personId: ids.personId, count: 30 }
		});
		expect(seedResponse.ok()).toBeTruthy();

		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		await page.getByTestId('notes-action-notes-btn').click();
		await page.getByTestId('person-notes-list').waitFor({ state: 'visible', timeout: 10_000 });
		await expect(page.getByTestId('person-note-item')).toHaveCount(25, { timeout: 15_000 });

		const notesList = page.getByTestId('person-notes-list');
		await notesList.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});

		await expect(page.getByTestId('person-note-item')).toHaveCount(30, { timeout: 15_000 });
	});

	test('owner can add a note from the conversation composer on the timeline', async ({ page }) => {
		const noteText = `E2E test note ${Date.now()}`;

		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		const composer = page.getByTestId('conversation-composer');
		await expect(composer).toHaveAttribute('data-mode', 'message');
		await composer.getByTestId('composer-mode-note').click();
		await expect(composer).toHaveAttribute('data-mode', 'note');

		const textarea = composer.getByTestId('note-form-textarea');
		await expect(textarea).toBeVisible({ timeout: 10_000 });
		await textarea.fill(noteText);
		await composer.getByTestId('note-form-submit').click();

		// The note lands in the timeline itself, not only in the drawer.
		await expect(page.getByTestId('inline-note').last()).toContainText(noteText, {
			timeout: 10_000
		});

		// The drawer lists it too.
		await page.getByTestId('notes-action-notes-btn').click();
		await expect(page.getByTestId('person-note-item').first()).toBeVisible({ timeout: 10_000 });
		await expect(page.getByTestId('person-note-content').first()).toHaveText(noteText);

		await page.keyboard.press('Escape');
		const contextPanel = page.getByTestId('person-context-panel');
		await expect(contextPanel).toBeVisible();
		await expect(contextPanel.getByTestId('person-context-note')).toHaveText(noteText);
	});

	test('owner can add a note from the notes drawer on the timeline', async ({ page }) => {
		const noteText = `E2E drawer note ${Date.now()}`;

		await loginAsOwner(page, PROJECT);
		await page.goto(ids.personPath);
		await expect(page.getByTestId('person-timeline-display-name')).toBeVisible();

		await page.getByTestId('notes-action-notes-btn').click();

		// Scoped to the drawer: the conversation composer uses the same testids.
		const drawer = page.getByTestId('person-notes-drawer');
		const textarea = drawer.getByTestId('note-form-textarea');
		await expect(textarea).toBeVisible({ timeout: 10_000 });
		await textarea.fill(noteText);
		await drawer.getByTestId('note-form-submit').click();

		await expect(drawer.getByTestId('person-note-item').first()).toBeVisible({ timeout: 10_000 });
		await expect(drawer.getByTestId('person-note-content').first()).toHaveText(noteText);

		await page.keyboard.press('Escape');
		await expect(page.getByTestId('inline-note').last()).toContainText(noteText, {
			timeout: 10_000
		});
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
