import { expect, test, type Browser } from '@playwright/test';
import { createApiClient } from '../api/api-client';
import { ApiKeysPage } from '../pages/settings/api-keys.page';
import { PersonWhatsappComposePage } from '../pages/community/person-whatsapp-compose.page';
import { loginAsOwner } from '../helpers/login';
import { ownerStorageState } from '../helpers/auth-storage';
import { getMockWabaId } from '../helpers/config';
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
	subscribed: boolean;
	doNotContact: boolean;
};

let cachedApiKey: string | null = null;

async function ensureCommunityOwnerApiKey(browser: Browser): Promise<string> {
	if (cachedApiKey) return cachedApiKey;

	const context = await browser.newContext({ storageState: ownerStorageState(PROJECT) });
	const page = await context.newPage();
	try {
		const apiKeysPage = new ApiKeysPage(page);
		await loginAsOwner(page, PROJECT);
		await apiKeysPage.goto();
		await apiKeysPage.root.waitFor({ state: 'visible', timeout: 15_000 });

		const keyName = `e2e-community-wa-${Date.now()}`;
		await apiKeysPage.createApiKey(keyName);
		await apiKeysPage.keyDisplay.waitFor({ state: 'visible', timeout: 30_000 });
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
		test.setTimeout(60_000);
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
		const paramInput = composePage.templateParamInput();
		await expect(paramInput).toBeVisible({ timeout: 5_000 });
		await paramInput.fill('E2E Name');
		await expect(composePage.templateVariableChip('E2E Name')).toBeVisible({ timeout: 5_000 });
		await page.keyboard.press('Escape');

		await composePage.sendButton(composePage.templateComposer).click();

		await expect
			.poll(
				async () =>
					composePage.outgoingMessageText('Hi E2E Name, do you have a second to talk?').count(),
				{ timeout: 20_000 }
			)
			.toBeGreaterThan(0);
	});

	test('inbound message opens window and shows individual composer', async ({ page, request }) => {
		const webhookBody = buildWhatsAppInboundTextWebhook({
			wabaId: getMockWabaId(PROJECT)!,
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

	test('inbound STOP unsubscribes the person while individual replies remain available', async ({
		page,
		request
	}) => {
		const client = createApiClient(request, cachedApiKey!);
		const firstWebhook = buildWhatsAppInboundTextWebhook({
			wabaId: getMockWabaId(PROJECT)!,
			from: state.personPhone,
			to: getE2EDefaultWhatsAppNumber(),
			body: ' stop! '
		});

		const firstResponse = await postWhatsAppInboundWebhook(request, firstWebhook);
		expect(firstResponse.status).toBe(200);
		await expect
			.poll(
				async () => {
					const response = await client.get<PersonApi>(`/api/v1/person/${state.personId}`);
					return {
						subscribed: response.body.subscribed,
						doNotContact: response.body.doNotContact
					};
				},
				{ timeout: 20_000 }
			)
			.toEqual({ subscribed: false, doNotContact: false });

		const repeatedWebhook = buildWhatsAppInboundTextWebhook({
			wabaId: getMockWabaId(PROJECT)!,
			from: state.personPhone,
			to: getE2EDefaultWhatsAppNumber(),
			body: 'STOP'
		});
		const repeatedResponse = await postWhatsAppInboundWebhook(request, repeatedWebhook);
		expect(repeatedResponse.status).toBe(200);

		const personResponse = await client.get<PersonApi>(`/api/v1/person/${state.personId}`);
		expect(personResponse.body.subscribed).toBe(false);
		expect(personResponse.body.doNotContact).toBe(false);

		await loginAsOwner(page, PROJECT);
		const composePage = new PersonWhatsappComposePage(page);
		await composePage.gotoPersonTimeline(state.personId);
		await expect(composePage.individualComposer).toBeVisible({ timeout: 15_000 });

		await composePage.individualMessageInput().fill('E2E reply after opt-out');
		await composePage.sendButton(composePage.individualComposer).click();
		await expect(composePage.outgoingMessageText('E2E reply after opt-out')).toBeVisible({
			timeout: 20_000
		});
	});
});
