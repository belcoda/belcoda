import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { EventCreatePage } from '../pages/events/event-create.page';
import { EventDetailPage } from '../pages/events/event-detail.page';
import { EventEditPage } from '../pages/events/event-edit.page';
import { EventSignupsPage } from '../pages/events/event-signups.page';
import { EventPublicPage } from '../pages/events/event-public-page.page';
import { EventSurveyPage } from '../pages/events/event-survey.page';
import { TEST_USERS } from '../helpers/auth';
import { E2E_ORG_SLUG, slugifyTitle } from '../helpers/config';
import {
	buildWhatsAppInboundFlowReplyWebhook,
	postWhatsAppInboundWebhook,
	getE2EDefaultWhatsAppNumber
} from '../helpers/whatsapp-webhook';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Events', () => {
	const ids = {
		eventId: '',
		eventSlug: '',
		eventTitle: '',
		originalEventSlug: '',
		signupPersonName: ''
	};

	test('owner can create an event', async ({ page }) => {
		const suffix = Date.now();
		ids.eventTitle = `E2E Event ${suffix}`;

		await loginAsOwner(page);

		const createPage = new EventCreatePage(page);
		await createPage.goto();
		await expect(createPage.form).toBeVisible();

		await createPage.fillTitle(ids.eventTitle);
		await createPage.fillDescription('E2E test event description');
		await createPage.submit();

		await createPage.waitForModal();
		await expect(createPage.createdModal).toBeVisible();

		const publishToggle = page.locator('[id="publish-toggle"]');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		const isChecked = await publishToggle.isChecked().catch(() => false);
		if (!isChecked) {
			await publishToggle.click();
			await page.waitForTimeout(800);
		}

		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/events\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);

		ids.eventId = new URL(page.url()).pathname.split('/')[2] ?? '';
		ids.originalEventSlug = slugifyTitle(ids.eventTitle);
		expect(ids.eventId).not.toBe('');
	});

	test('owner can edit an event', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		await detailPage.clickEditEvent();

		await expect(page).toHaveURL(`/events/${ids.eventId}/edit`);

		const editPage = new EventEditPage(page);
		await editPage.waitForForm();

		ids.eventTitle = `${ids.eventTitle} (edited)`;
		ids.originalEventSlug = slugifyTitle(ids.eventTitle);
		await editPage.clearAndFillTitle(ids.eventTitle);
		await editPage.submit();

		await editPage.waitForModal();
		await editPage.closeModal();

		await expect(page).toHaveURL(`/events/${ids.eventId}`, { timeout: 10_000 });
	});

	test('owner can navigate to the event public page via the action menu', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		const previewLink = page.getByTestId('event-action-preview');
		const href = await previewLink.getAttribute('href');
		expect(href).toBeTruthy();

		ids.eventSlug = ids.originalEventSlug;

		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.eventSlug);
		await expect(publicPage.eventTitle).toBeVisible({ timeout: 10_000 });
	});

	test('logged-in owner sees the edit navbar on the public event page', async ({ page }) => {
		await loginAsOwner(page);

		const publicPage = new EventPublicPage(page);
		await publicPage.gotoViaPath(E2E_ORG_SLUG, ids.eventSlug);

		await expect(page.getByTestId('public-page-navbar')).toBeVisible({ timeout: 10_000 });
		const editLink = page.getByTestId('public-page-edit-link');
		await expect(editLink).toBeVisible();
		await expect(editLink).toContainText('Edit Event');
	});

	test('anonymous visitor does not see the edit navbar on the public event page', async ({
		page
	}) => {
		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.eventSlug);

		await expect(page.getByTestId('public-page-navbar')).toHaveCount(0);
		await expect(publicPage.eventTitle).toBeVisible({ timeout: 10_000 });
		await expect(publicPage.submitButton).toBeVisible();
	});

	test('public event page shows WhatsApp signup link', async ({ page }) => {
		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.eventSlug);

		await expect(publicPage.submitButton).toBeVisible({ timeout: 10_000 });
		// The WhatsApp button should be visible (either mobile or desktop version)
		await expect(publicPage.whatsappSignupBtn).toBeVisible({ timeout: 10_000 });
	});

	test('visitor can sign up for an event from the public page', async ({ page }) => {
		const suffix = Date.now();
		ids.signupPersonName = `E2E Signup ${suffix}`;

		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, ids.eventSlug);

		await publicPage.fillSignupForm({
			givenName: 'E2E',
			familyName: `Signup ${suffix}`,
			email: `e2e-signup-${suffix}@belcoda.test`
		});
		await publicPage.submitSignup();

		await expect(page).toHaveURL(
			new RegExp(`${E2E_ORG_SLUG}.*\\/events\\/${ids.eventSlug}\\/signed-up`),
			{ timeout: 15_000 }
		);
	});

	test('owner can view signups on the event admin page', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		const signupsPage = new EventSignupsPage(page);
		await expect(signupsPage.signupTable).toBeVisible({ timeout: 15_000 });
		await expect(signupsPage.signupTable).toContainText('E2E', { timeout: 15_000 });
	});

	test('owner can navigate to the detailed signups table', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		await detailPage.openActionDropdown();
		await detailPage.clickDetailedSignups();

		await expect(page).toHaveURL(`/events/${ids.eventId}/signups`, { timeout: 10_000 });

		const signupsPage = new EventSignupsPage(page);
		await expect(signupsPage.detailedTable).toBeVisible({ timeout: 15_000 });
	});

	test('owner can mark a signup as attended', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		const signupsPage = new EventSignupsPage(page);
		await signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 });

		await signupsPage.markFirstSignupAttended();

		await expect(signupsPage.firstAttendedBadge).toBeVisible({ timeout: 10_000 });
	});

	test('owner can mark a signup as no show', async ({ page }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		const signupsPage = new EventSignupsPage(page);
		await signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 });

		await signupsPage.markFirstSignupNoShow();

		await expect(signupsPage.firstNoShowBadge).toBeVisible({ timeout: 10_000 });
	});

	test('owner can archive a published event', async ({ page }) => {
		await loginAsOwner(page);

		const createPage = new EventCreatePage(page);
		await createPage.goto();
		await createPage.fillTitle(`E2E Archive Test ${Date.now()}`);
		await createPage.fillDescription('To be archived');
		await createPage.submit();
		await createPage.waitForModal();

		const publishToggle = page.locator('[id="publish-toggle"]');
		const isChecked = await publishToggle.isChecked().catch(() => false);
		if (!isChecked) {
			await publishToggle.click();
			await page.waitForTimeout(500);
		}
		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/events\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);
		const archiveEventId = new URL(page.url()).pathname.split('/')[2] ?? '';

		const detailPage = new EventDetailPage(page);
		await detailPage.waitForLoaded();
		await detailPage.openActionDropdown();
		await detailPage.clickEditEvent();

		const editPage = new EventEditPage(page);
		await editPage.waitForForm();
		await editPage.archiveEvent(page);

		await expect(page).toHaveURL('/events', { timeout: 10_000 });
		expect(archiveEventId).not.toBe('');
	});

	test('owner can delete an unpublished event', async ({ page }) => {
		await loginAsOwner(page);

		const createPage = new EventCreatePage(page);
		await createPage.goto();
		await createPage.fillTitle(`E2E Delete Test ${Date.now()}`);
		await createPage.fillDescription('To be deleted');
		await createPage.submit();
		await createPage.waitForModal();
		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/events\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);

		const detailPage = new EventDetailPage(page);
		await detailPage.waitForLoaded();
		await detailPage.openActionDropdown();
		await detailPage.clickEditEvent();

		const editPage = new EventEditPage(page);
		await editPage.waitForForm();
		await editPage.deleteEvent(page);

		await expect(page).toHaveURL('/events', { timeout: 10_000 });
	});

	test('WhatsApp flow response creates an event signup', async ({ page, request }) => {
		await loginAsOwner(page);

		const detailPage = new EventDetailPage(page);
		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();

		const signupsPage = new EventSignupsPage(page);
		await signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 });

		const flowPhone = '+61400000001';
		const suffix = Date.now();
		const flowGivenName = `WA Flow ${suffix}`;

		const webhookBody = buildWhatsAppInboundFlowReplyWebhook({
			from: flowPhone,
			to: getE2EDefaultWhatsAppNumber(),
			responseJson: {
				givenName: flowGivenName,
				emailAddress: `wa-flow-${suffix}@belcoda.test`,
				phoneNumber: flowPhone,
				flow_token: 'unused',
				resource_type: 'event',
				resource_id: ids.eventId
			}
		});

		const { status } = await postWhatsAppInboundWebhook(request, webhookBody);
		expect(status).toBe(200);

		await detailPage.goto(ids.eventId);
		await detailPage.waitForLoaded();
		await signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(signupsPage.signupTable).toContainText(flowGivenName, { timeout: 15_000 });
	});

	test('public event page shows sign-up closed when the event has ended', async ({
		page,
		context
	}) => {
		const suffix = Date.now();
		const title = `E2E Past Event ${suffix}`;

		await loginAsOwner(page);

		const createPage = new EventCreatePage(page);
		await createPage.goto();
		await createPage.fillTitle(title);
		await createPage.fillDescription('E2E event in the past for closed signup');
		await createPage.submit();
		await createPage.waitForModal();

		const publishToggle = page.locator('[id="publish-toggle"]');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		if (!(await publishToggle.isChecked().catch(() => false))) {
			await publishToggle.click();
			await page.waitForTimeout(800);
		}
		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/events\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);
		const eventId = new URL(page.url()).pathname.split('/')[2] ?? '';
		const pastEventSlug = slugifyTitle(title);
		expect(eventId).not.toBe('');

		const editPage = new EventEditPage(page);
		await page.goto(`/events/${eventId}/edit`);
		await editPage.waitForForm();

		await page.getByTestId('event-form-date').click();
		const popover = page.locator('[data-slot=popover-content]');
		await popover.waitFor({ state: 'visible', timeout: 5_000 });
		const previousMonth = popover.getByRole('button', { name: /previous/i });
		for (let i = 0; i < 18; i++) {
			await previousMonth.click();
		}
		const day = popover.getByRole('gridcell', { name: '15' });
		if ((await day.count()) > 0) {
			await day.first().click();
		} else {
			await popover.getByRole('button', { name: '15' }).first().click();
		}

		await editPage.submit();
		await editPage.waitForModal();
		await editPage.closeModal();

		const anon = await context.newPage();
		const publicPage = new EventPublicPage(anon);
		await publicPage.goto(E2E_ORG_SLUG, pastEventSlug);
		try {
			await expect(anon.getByTestId('event-signup-closed')).toBeVisible({ timeout: 20_000 });
			await expect(anon.getByTestId('event-signup-given-name')).toHaveCount(0);
		} finally {
			await anon.close();
		}
	});
});

test.describe.serial('Event signup fields', () => {
	const CUSTOM_QUESTION_LABEL = 'What is your dietary requirement?';
	let eventSlug = '';

	test('owner creates event with address, standard fields, and a custom field', async ({
		page
	}) => {
		const suffix = Date.now();
		const title = `E2E Fields Event ${suffix}`;

		await loginAsOwner(page);

		const createPage = new EventCreatePage(page);
		await createPage.goto();

		await createPage.fillTitle(title);
		await createPage.fillDescription('Testing extra signup fields');
		await createPage.fillAddress({
			line1: '123 Test Street',
			locality: 'Testville',
			region: 'Test Region',
			postcode: '12345'
		});

		const surveyPage = new EventSurveyPage(page);
		await surveyPage.checkStandardField('address');
		await surveyPage.addShortTextQuestion(CUSTOM_QUESTION_LABEL);

		await createPage.submit();
		await createPage.waitForModal();

		const publishToggle = page.locator('[id="publish-toggle"]');
		await publishToggle.waitFor({ state: 'visible', timeout: 5_000 });
		const isChecked = await publishToggle.isChecked().catch(() => false);
		if (!isChecked) {
			await publishToggle.click();
			await page.waitForTimeout(800);
		}

		await createPage.closeModal();

		await expect(page).toHaveURL(
			/\/events\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i,
			{ timeout: 10_000 }
		);

		eventSlug = slugifyTitle(title);
		expect(eventSlug).not.toBe('');
	});

	test('public signup page shows standard address fields', async ({ page }) => {
		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, eventSlug);

		await expect(publicPage.eventTitle).toBeVisible({ timeout: 10_000 });
		await expect(publicPage.addressLine1Input).toBeVisible();
		await expect(publicPage.addressLocalityInput).toBeVisible();
		await expect(publicPage.addressRegionInput).toBeVisible();
		await expect(publicPage.addressPostcodeInput).toBeVisible();
	});

	test('public signup page shows the custom question field', async ({ page }) => {
		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, eventSlug);

		await expect(publicPage.eventTitle).toBeVisible({ timeout: 10_000 });
		await expect(page.getByLabel(CUSTOM_QUESTION_LABEL)).toBeVisible();
	});

	test('visitor can submit signup with all extra fields filled', async ({ page }) => {
		const suffix = Date.now();

		const publicPage = new EventPublicPage(page);
		await publicPage.goto(E2E_ORG_SLUG, eventSlug);

		await publicPage.fillSignupForm({
			givenName: 'Fields',
			familyName: `Tester ${suffix}`,
			email: `fields-${suffix}@belcoda.test`
		});

		await publicPage.addressLine1Input.fill('456 Signup Ave');
		await publicPage.addressLocalityInput.fill('Signuptown');
		await publicPage.addressRegionInput.fill('Signup State');
		await publicPage.addressPostcodeInput.fill('99999');

		await page.getByLabel(CUSTOM_QUESTION_LABEL).fill('Vegan');

		await publicPage.submitSignup();

		await expect(page).toHaveURL(
			new RegExp(`${E2E_ORG_SLUG}.*\\/events\\/${eventSlug}\\/signed-up`),
			{
				timeout: 15_000
			}
		);
	});
});
