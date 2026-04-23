import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { PetitionCreatePage } from '../pages/petitions/petition-create.page';
import { PetitionDetailPage } from '../pages/petitions/petition-detail.page';
import { PetitionEditPage } from '../pages/petitions/petition-edit.page';
import { PetitionPublicPage } from '../pages/petitions/petition-public-page.page';
import { PetitionSignaturesPage } from '../pages/petitions/petition-signatures.page';
import { PetitionSurveyPage } from '../pages/petitions/petition-survey.page';
import { TEST_USERS } from '../helpers/auth';
import { E2E_ORG_SLUG, slugifyTitle } from '../helpers/config';
import {
	buildWhatsAppInboundFlowReplyWebhook,
	getE2EDefaultWhatsAppNumber,
	postWhatsAppInboundWebhook
} from '../helpers/whatsapp-webhook';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

const ids = {
	petitionId: '',
	petitionSlug: '',
	petitionTitle: ''
};

test.describe.serial('Petitions: create, edit, publish, admin', () => {
	test('owner can add a petition and it is saved as draft', async ({ page }) => {
		const suffix = Date.now();
		ids.petitionTitle = `E2E Petition ${suffix}`;

		await loginAsOwner(page);

		const createPage = new PetitionCreatePage(page);
		await createPage.goto();
		await expect(createPage.form).toBeVisible();

		await createPage.fillTitle(ids.petitionTitle);
		await createPage.fillDescription('E2E petition short description');
		await createPage.fillTarget('E2E petition target');
		await createPage.fillPetitionText('E2E petition full text for signers.');
		await createPage.submit();

		await createPage.waitForModal();
		await expect(createPage.createdModal).toBeVisible();

		const publishToggle = page.getByTestId('petition-publish-toggle');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		const isPublished = await publishToggle.isChecked().catch(() => false);
		// unpublish so we can edit it in the subsequent test
		if (isPublished) {
			await publishToggle.click();
			await page.waitForTimeout(400);
		}

		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/petitions\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);

		ids.petitionId = new URL(page.url()).pathname.split('/')[2] ?? '';
		ids.petitionSlug = slugifyTitle(ids.petitionTitle);
		expect(ids.petitionId).not.toBe('');
		expect(ids.petitionSlug).not.toBe('');
	});

	test('owner can edit a petition', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		await detailPage.clickEditPetition();

		await expect(page).toHaveURL(`/petitions/${ids.petitionId}/edit`);

		const editPage = new PetitionEditPage(page);
		await editPage.waitForForm();

		ids.petitionTitle = `${ids.petitionTitle} (edited)`;
		await editPage.clearAndFillTitle(ids.petitionTitle);
		await editPage.submit();
		await page.waitForTimeout(400);

		// save the changed slug
		ids.petitionSlug = slugifyTitle(ids.petitionTitle);

		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();
		await expect(detailPage.titleDisplay).toContainText(ids.petitionTitle);
	});

	test('owner can publish a petition from the action menu', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		const publishSwitch = page.getByTestId('petition-action-publish-switch');
		await publishSwitch.waitFor({ state: 'visible', timeout: 5_000 });
		const isChecked = await publishSwitch.isChecked().catch(() => false);
		if (!isChecked) {
			await publishSwitch.click();
			await page.waitForTimeout(800);
		}
	});

	test('owner sees a preview link to the public petition page', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		const previewLink = page.getByTestId('petition-action-preview');
		const href = await previewLink.getAttribute('href');
		expect(href).toBeTruthy();
		expect(href).toContain('/preview');
		expect(ids.petitionSlug).not.toBe('');
	});
});

test.describe.serial('Petitions: public page', () => {
	test('owner publishes the previously created petition for public tests', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();
		await detailPage.openActionDropdown();

		const publishSwitch = page.getByTestId('petition-action-publish-switch');
		await publishSwitch.waitFor({ state: 'visible', timeout: 5_000 });
		const isChecked = await publishSwitch.isChecked().catch(() => false);
		if (!isChecked) {
			await publishSwitch.click();
			await page.waitForTimeout(800);
		}
		expect(ids.petitionSlug).not.toBe('');
	});

	test('logged-in owner sees the edit navbar on the public petition page', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();
		await detailPage.openActionDropdown();

		const previewLink = page.getByTestId('petition-action-preview');
		const href = await previewLink.getAttribute('href');
		expect(href).toBeTruthy();
		await page.goto(href!);
		await expect(page).toHaveURL(new RegExp(`https?:\\/\\/${E2E_ORG_SLUG}\\.`), {
			timeout: 15_000
		});
		await expect(page).toHaveURL(new RegExp(`\\/petitions\\/${ids.petitionSlug}(\\?|$)`), {
			timeout: 15_000
		});

		await expect(page.getByTestId('public-page-navbar')).toBeVisible({ timeout: 10_000 });
		const editLink = page.getByTestId('public-page-edit-link');
		await expect(editLink).toBeVisible();
		await expect(editLink).toContainText('Edit Petition');
	});

	test('anonymous visitor does not see the edit navbar on the public petition page', async ({
		page
	}) => {
		const publicPage = new PetitionPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.petitionSlug);

		await expect(page.getByTestId('public-page-navbar')).toHaveCount(0);
		await expect(publicPage.petitionTitle).toBeVisible({ timeout: 10_000 });
		await expect(publicPage.submitButton).toBeVisible();
	});

	test('public petition page shows WhatsApp signup when configured', async ({ page }) => {
		const publicPage = new PetitionPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.petitionSlug);

		await expect(publicPage.submitButton).toBeVisible({ timeout: 10_000 });
		await expect(publicPage.whatsappSignupBtn).toBeVisible({ timeout: 10_000 });
	});

	test('visitor can sign the petition from the public page', async ({ page }) => {
		const suffix = Date.now();

		const publicPage = new PetitionPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.petitionSlug);

		await publicPage.fillSignupForm({
			givenName: 'E2E',
			familyName: `Signer ${suffix}`,
			email: `e2e-petition-${suffix}@belcoda.test`
		});
		await publicPage.submitSignup();

		await expect(page).toHaveURL(
			new RegExp(`${E2E_ORG_SLUG}.*\\/petitions\\/${ids.petitionSlug}\\/signed`),
			{ timeout: 15_000 }
		);
	});

	test('owner can view signatures on the petition admin page', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();

		const signaturesPage = new PetitionSignaturesPage(page);
		await expect(signaturesPage.summaryTable).toBeVisible({ timeout: 15_000 });
		await expect(signaturesPage.summaryTable).toContainText('E2E', { timeout: 15_000 });
	});

	test('owner can open the detailed signatures table after there is a signature', async ({
		page
	}) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		await detailPage.clickDetailedSignatures();

		await expect(page).toHaveURL(`/petitions/${ids.petitionId}/signatures`, { timeout: 10_000 });

		const signaturesPage = new PetitionSignaturesPage(page);
		await expect(signaturesPage.detailedTable).toBeVisible({ timeout: 15_000 });
	});

	test('WhatsApp flow response creates a petition signature', async ({ page, request }) => {
		await loginAsOwner(page);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();

		const signaturesPage = new PetitionSignaturesPage(page);
		await signaturesPage.summaryTable.waitFor({ state: 'visible', timeout: 15_000 });

		const flowPhone = '+61400000002';
		const suffix = Date.now();
		const flowGivenName = `WA Petition ${suffix}`;

		const webhookBody = buildWhatsAppInboundFlowReplyWebhook({
			from: flowPhone,
			to: getE2EDefaultWhatsAppNumber(),
			responseJson: {
				givenName: flowGivenName,
				emailAddress: `wa-petition-${suffix}@belcoda.test`,
				phoneNumber: flowPhone,
				flow_token: 'unused',
				resource_type: 'petition',
				resource_id: ids.petitionId
			}
		});

		const { status } = await postWhatsAppInboundWebhook(request, webhookBody);
		expect(status).toBe(200);

		await detailPage.goto(ids.petitionId);
		await detailPage.waitForLoaded();
		await signaturesPage.summaryTable.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(signaturesPage.summaryTable).toContainText(flowGivenName, { timeout: 15_000 });
	});
});

test.describe.serial('Petitions: signup fields', () => {
	const CUSTOM_QUESTION_LABEL = 'What is your biggest concern?';
	let petitionSlug = '';

	test('owner creates petition with standard and custom signup fields', async ({ page }) => {
		const suffix = Date.now();
		const title = `E2E Fields Petition ${suffix}`;

		await loginAsOwner(page);

		const createPage = new PetitionCreatePage(page);
		await createPage.goto();
		await expect(createPage.form).toBeVisible();

		await createPage.fillTitle(title);
		await createPage.fillDescription('Testing petition extra signup fields');
		await createPage.fillTarget('Petition target for signup field tests');
		await createPage.fillPetitionText('Petition text for signup field tests.');

		const surveyPage = new PetitionSurveyPage(page);
		await surveyPage.checkStandardField('address');
		await surveyPage.addShortTextQuestion(CUSTOM_QUESTION_LABEL);

		await createPage.submit();
		await createPage.waitForModal();
		await expect(createPage.createdModal).toBeVisible();

		const publishToggle = page.getByTestId('petition-publish-toggle');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		const isPublished = await publishToggle.isChecked().catch(() => false);
		if (!isPublished) {
			await publishToggle.click();
			await page.waitForTimeout(800);
		}

		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/petitions\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);

		petitionSlug = slugifyTitle(title);
		expect(petitionSlug).not.toBe('');
	});

	test('public petition page shows standard address fields', async ({ page }) => {
		const publicPage = new PetitionPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, petitionSlug);

		await expect(publicPage.petitionTitle).toBeVisible({ timeout: 10_000 });
		await expect(publicPage.addressLine1Input).toBeVisible();
		await expect(publicPage.addressLocalityInput).toBeVisible();
		await expect(publicPage.addressRegionInput).toBeVisible();
		await expect(publicPage.addressPostcodeInput).toBeVisible();
	});

	test('public petition page shows the custom question field', async ({ page }) => {
		const publicPage = new PetitionPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, petitionSlug);

		await expect(publicPage.petitionTitle).toBeVisible({ timeout: 10_000 });
		await expect(page.getByLabel(CUSTOM_QUESTION_LABEL)).toBeVisible();
	});

	test('visitor can submit petition signature with all extra fields', async ({ page }) => {
		const suffix = Date.now();
		const publicPage = new PetitionPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, petitionSlug);

		await publicPage.fillSignupForm({
			givenName: 'Fields',
			familyName: `Petitioner ${suffix}`,
			email: `petition-fields-${suffix}@belcoda.test`
		});

		await publicPage.addressLine1Input.fill('789 Petition Street');
		await publicPage.addressLocalityInput.fill('Petition City');
		await publicPage.addressRegionInput.fill('Petition State');
		await publicPage.addressPostcodeInput.fill('77777');

		await page.getByLabel(CUSTOM_QUESTION_LABEL).fill('Housing affordability');

		await publicPage.submitSignup();

		await expect(page).toHaveURL(
			new RegExp(`${E2E_ORG_SLUG}.*\\/petitions\\/${petitionSlug}\\/signed`),
			{
				timeout: 15_000
			}
		);
	});
});

test.describe.serial('Petitions: archive', () => {
	test('owner can archive a published petition', async ({ page }) => {
		await loginAsOwner(page);

		const createPage = new PetitionCreatePage(page);
		await createPage.goto();
		await createPage.fillTitle(`E2E Archive Petition ${Date.now()}`);
		await createPage.fillDescription('To be archived');
		await createPage.fillTarget('Archive target');
		await createPage.submit();
		await createPage.waitForModal();

		const publishToggle = page.getByTestId('petition-publish-toggle');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		const isChecked = await publishToggle.isChecked().catch(() => false);
		if (!isChecked) {
			await publishToggle.click();
			await page.waitForTimeout(500);
		}
		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/petitions\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);
		const archivePetitionId = new URL(page.url()).pathname.split('/')[2] ?? '';

		const detailPage = new PetitionDetailPage(page);
		await detailPage.waitForLoaded();
		await detailPage.openActionDropdown();
		await detailPage.clickEditPetition();

		const editPage = new PetitionEditPage(page);
		await editPage.waitForForm();
		await editPage.archivePetition();

		await expect(page).toHaveURL('/petitions', { timeout: 10_000 });
		expect(archivePetitionId).not.toBe('');
	});
});

test.describe.serial('Petitions: delete draft', () => {
	test('owner can delete an unpublished petition', async ({ page }) => {
		await loginAsOwner(page);

		const createPage = new PetitionCreatePage(page);
		await createPage.goto();
		await createPage.fillTitle(`E2E Delete Petition ${Date.now()}`);
		await createPage.fillDescription('To be deleted');
		await createPage.fillTarget('Delete target');
		await createPage.submit();
		await createPage.waitForModal();

		const publishToggle = page.getByTestId('petition-publish-toggle');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		const isPublished = await publishToggle.isChecked().catch(() => false);
		if (isPublished) {
			await publishToggle.click();
			await page.waitForTimeout(400);
		}
		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/petitions\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);

		const detailPage = new PetitionDetailPage(page);
		await detailPage.waitForLoaded();
		await detailPage.openActionDropdown();
		await detailPage.clickEditPetition();

		const editPage = new PetitionEditPage(page);
		await editPage.waitForForm();
		await editPage.deletePetition();

		await expect(page).toHaveURL('/petitions', { timeout: 10_000 });
	});
});
