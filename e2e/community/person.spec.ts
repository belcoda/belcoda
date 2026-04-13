import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Community and person pages', () => {
	const ids = {
		personId: '',
		personPath: '',
		givenName: '',
		familyName: ''
	};

	test('owner can create a person and land on their timeline', async ({ page }) => {
		const suffix = `${Date.now()}`;
		ids.givenName = 'E2E';
		ids.familyName = `Person ${suffix}`;
		const email = `e2e-person-${suffix}@belcoda.test`;

		const personCreate = new PersonCreatePage(page);

		await loginAsOwner(page);

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

		await loginAsOwner(page);
		await communityPage.goto();
		await communityPage.searchCommunityList(ids.familyName);

		const personLink = communityPage.personListLink(ids.personId);
		await expect(personLink).toBeVisible();
		await expect(personLink).toContainText(ids.givenName);
		await expect(personLink).toContainText(ids.familyName);
	});

	test('owner can navigate from the timeline to the profile page', async ({ page }) => {
		await loginAsOwner(page);
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

		await loginAsOwner(page);
		await profilePage.goto(ids.personPath);

		await expect(profilePage.nameDisplay).toContainText(ids.givenName);
		await profilePage.editName(newGivenName, newFamilyName);

		await expect(profilePage.nameDisplay).toContainText(newGivenName);
		await expect(profilePage.nameDisplay).toContainText(newFamilyName);

		ids.givenName = newGivenName;
		ids.familyName = newFamilyName;
	});

	test('updated name is reflected on the timeline', async ({ page }) => {
		await loginAsOwner(page);
		await page.goto(ids.personPath);

		await expect(page.getByTestId('person-timeline-display-name')).toHaveText(
			`${ids.givenName} ${ids.familyName}`
		);
	});

	test('owner can edit the email address of a person from the profile page', async ({ page }) => {
		const profilePage = new PersonProfilePage(page);
		const suffix = `${Date.now()}`;
		const newEmail = `e2e-edited-${suffix}@belcoda.test`;

		await loginAsOwner(page);
		await profilePage.goto(ids.personPath);

		await profilePage.editEmail(newEmail);

		await expect(page.getByTestId('person-profile-email-display')).toHaveText(newEmail);
	});

	test('owner can delete the person from the person profile page', async ({ page }) => {
		const communityPage = new CommunityPage(page);
		const profilePage = new PersonProfilePage(page);

		await loginAsOwner(page);
		await profilePage.goto(ids.personPath);
		await profilePage.waitForLoaded();
		await expect(page.getByTestId('person-profile-danger-zone')).toBeVisible();

		await profilePage.deletePersonWithConfirm();

		await expect(page).toHaveURL(/\/community\/?$/);
		await communityPage.searchCommunityList(ids.familyName);
		await expect(communityPage.personListLink(ids.personId)).toHaveCount(0, {
			timeout: 20_000
		});
	});
});
