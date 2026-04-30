import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import {
	WhatsAppTemplateFormPage,
	WhatsAppTemplatesListPage
} from '../pages/settings/whatsapp-templates.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

function randomTemplateName(): string {
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	let suffix = '';
	for (let i = 0; i < 10; i++) {
		suffix += letters[Math.floor(Math.random() * letters.length)] ?? 'a';
	}
	return `e2e_wa_tpl_${suffix}`;
}

test.describe.serial('Settings: WhatsApp templates', () => {
	const ids = {
		templateId: '',
		templateName: ''
	};

	test('owner can create a WhatsApp template', async ({ page }) => {
		ids.templateName = randomTemplateName();

		await loginAsOwner(page);

		const listPage = new WhatsAppTemplatesListPage(page);
		await listPage.goto();

		await expect(page.getByTestId('whatsapp-templates-activate-account')).toHaveCount(0);

		await listPage.createTemplateLink().click();
		await expect(page).toHaveURL(/\/settings\/whatsapp\/templates\/new\/?$/);

		const formPage = new WhatsAppTemplateFormPage(page);
		await page.getByTestId('whatsapp-template-form').waitFor({ state: 'visible', timeout: 15_000 });

		await formPage.fillTemplateName(ids.templateName);
		await formPage.fillFirstExampleVariable('Maria');
		await formPage.saveCreate();

		const row = listPage.rowForTemplateName(ids.templateName);
		await expect(row).toBeVisible({ timeout: 20_000 });

		const templateId = await row.getAttribute('data-template-id');
		expect(templateId).toBeTruthy();
		ids.templateId = templateId ?? '';

		await expect(listPage.statusCellForRow(row)).toContainText('Not submitted', {
			timeout: 15_000
		});
	});

	test('owner can edit a WhatsApp template', async ({ page }) => {
		await loginAsOwner(page);

		const formPage = new WhatsAppTemplateFormPage(page);
		await formPage.gotoEdit(ids.templateId);

		await formPage.fillBodyText('Hi {{1}}, this is an E2E template update.');
		await formPage.fillFirstExampleVariable('Pat');
		await formPage.saveEdit();

		const listPage = new WhatsAppTemplatesListPage(page);
		const row = listPage.rowForTemplateId(ids.templateId);
		await expect(row).toBeVisible({ timeout: 20_000 });
		await expect(listPage.statusCellForRow(row)).toContainText('Not submitted', {
			timeout: 15_000
		});
	});

	test('owner can submit a WhatsApp template for review', async ({ page }) => {
		await loginAsOwner(page);

		const listPage = new WhatsAppTemplatesListPage(page);
		await listPage.goto();

		const row = listPage.rowForTemplateId(ids.templateId);
		await expect(row).toBeVisible({ timeout: 20_000 });

		const submitBtn = listPage.submitButtonForRow(row);
		await expect(submitBtn).toBeVisible({ timeout: 10_000 });
		await submitBtn.click();

		await listPage.goto();
		const refreshedRow = listPage.rowForTemplateId(ids.templateId);
		await expect(refreshedRow).toBeVisible({ timeout: 20_000 });
		await expect(listPage.statusCellForRow(refreshedRow)).toContainText('Pending', {
			timeout: 25_000
		});
		await expect(listPage.submitButtonForRow(refreshedRow)).toHaveCount(0);
	});
});
