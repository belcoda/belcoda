import { expect, test, type Browser } from '@playwright/test';
import { createApiClient } from '../api/api-client';
import { ApiKeysPage } from '../pages/settings/api-keys.page';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { PersonWhatsappComposePage } from '../pages/community/person-whatsapp-compose.page';
import { loginAsOwner } from '../helpers/login';
import { getTestUsers } from '../helpers/auth';
import { E2E_COMMUNITY_MOCK_WABA_ID } from '../helpers/config';
import {
	buildWhatsAppInboundTextWebhook,
	getE2EDefaultWhatsAppNumber,
	postWhatsAppInboundWebhook
} from '../helpers/whatsapp-webhook';

const PROJECT = 'community' as const;

type PersonApi = {
	id: string;
	givenName: string | null;
	familyName: string | null;
	phoneNumber: string | null;
};

let cachedApiKey: string | null = null;

async function ensureCommunityOwnerApiKey(browser: Browser): Promise<string> {
	if (cachedApiKey) return cachedApiKey;

	const owner = getTestUsers(PROJECT).owner;
	const context = await browser.newContext();
	const page = await context.newPage();
	try {
		const loginPage = new LoginPage(page);
		const communityPage = new CommunityPage(page);
		await loginPage.goto();
		await loginPage.login(owner.email, owner.password);
		await page.waitForURL('/community', { timeout: 30_000 });
		await communityPage.expectLoaded();

		const apiKeysPage = new ApiKeysPage(page);
		const keyName = `e2e-community-wa-${Date.now()}`;
		await apiKeysPage.goto();
		await apiKeysPage.createApiKey(keyName);
		await apiKeysPage.keyDisplay.waitFor({ state: 'visible', timeout: 15_000 });
		const key = await apiKeysPage.keyDisplay.inputValue();
		if (!key) throw new Error('Failed to read API key from the create-key modal');
		await apiKeysPage.closeCreateModalButton.click();
		cachedApiKey = key;
		return key;
	} finally {
		await context.close();
	}
}

test.describe.serial('Community: person WhatsApp compose', () => {
	const state = {
		personId: '',
		personPhone: ''
	};

	test.beforeAll(async ({ browser }) => {
		await ensureCommunityOwnerApiKey(browser);
	});

	test('closed customer service window shows template composer', async ({ page, request }) => {
		const suffix = Date.now();
		state.personPhone = `+1555555${String(suffix).slice(-4)}`;
		const client = createApiClient(request, cachedApiKey!);

		const response = await client.post<PersonApi>('/api/v1/person', {
			givenName: 'WA',
			familyName: `Compose ${suffix}`,
			emailAddress: `wa-compose-${suffix}@belcoda.test`,
			phoneNumber: state.personPhone,
			country: 'US',
			preferredLanguage: 'en'
		});
		expect(response.status).toBe(200);
		state.personId = response.body.id;
		expect(state.personId).not.toBe('');

		await loginAsOwner(page, PROJECT);
		const composePage = new PersonWhatsappComposePage(page);
		await composePage.gotoPersonTimeline(state.personId);

		await expect(composePage.templateComposer).toBeVisible({ timeout: 15_000 });
		await expect(composePage.individualComposer).toHaveCount(0);
		await expect(composePage.templateComposer).toContainText('do you have a second');
	});

	test('owner can edit a template variable and send a template message', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		const composePage = new PersonWhatsappComposePage(page);
		await composePage.gotoPersonTimeline(state.personId);

		await expect(composePage.templateComposer).toBeVisible({ timeout: 15_000 });
		await composePage.templateVariableChip('Maria').click();
		const paramInput = page.locator('[data-slot="popover-content"] input').first();
		await expect(paramInput).toBeVisible({ timeout: 5_000 });
		await paramInput.fill('E2E Name');
		await page.keyboard.press('Escape');

		await composePage.sendButton(composePage.templateComposer).click();

		await expect(composePage.outgoingMessageText('Hi E2E Name, do you have a second to talk?')).toBeVisible({
			timeout: 20_000
		});
	});

	test('inbound message opens window and shows individual composer', async ({ page, request }) => {
		const webhookBody = buildWhatsAppInboundTextWebhook({
			wabaId: E2E_COMMUNITY_MOCK_WABA_ID,
			from: state.personPhone,
			to: getE2EDefaultWhatsAppNumber(),
			body: 'Hello from E2E'
		});

		const { status } = await postWhatsAppInboundWebhook(request, webhookBody);
		expect(status).toBe(200);

		await loginAsOwner(page, PROJECT);
		const composePage = new PersonWhatsappComposePage(page);
		await composePage.gotoPersonTimeline(state.personId);
		await page.reload();

		await expect
			.poll(async () => composePage.individualComposer.isVisible(), { timeout: 20_000 })
			.toBe(true);
		await expect(composePage.templateComposer).toHaveCount(0);
		await expect(composePage.individualMessageInput()).toBeVisible();
	});

	test('owner can send a regular WhatsApp message', async ({ page }) => {
		await loginAsOwner(page, PROJECT);
		const composePage = new PersonWhatsappComposePage(page);
		await composePage.gotoPersonTimeline(state.personId);

		await expect(composePage.individualComposer).toBeVisible({ timeout: 15_000 });
		await composePage.individualMessageInput().fill('E2E freeform reply');
		await composePage.sendButton(composePage.individualComposer).click();

		await expect(composePage.outgoingMessageText('E2E freeform reply')).toBeVisible({
			timeout: 20_000
		});
	});
});
