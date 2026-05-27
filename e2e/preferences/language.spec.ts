import { expect, test } from '@playwright/test';
import { PreferencesLanguagePage } from '../pages/preferences/language.page';
import { authStoragePath } from '../helpers/auth-storage';
import { ensureAuthenticated } from '../helpers/login';

const PROJECT = 'settings' as const;

test.use({ storageState: authStoragePath(PROJECT, 'member') });

test.describe.serial('Preferences: Language', () => {
	test('language page loads with a language selector', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await ensureAuthenticated(page, PROJECT, 'member');
		await languagePage.goto();

		await expect(languagePage.root).toBeVisible({ timeout: 15_000 });
		await expect(languagePage.selectTrigger).toBeVisible();
	});

	test('language selector shows all supported locales', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await ensureAuthenticated(page, PROJECT, 'member');
		await languagePage.goto();

		await languagePage.selectTrigger.click();

		await expect(languagePage.option('en')).toBeVisible({ timeout: 10_000 });
		await expect(languagePage.option('es')).toBeVisible();
		await expect(languagePage.option('pt')).toBeVisible();

		await page.keyboard.press('Escape');
	});

	test('can change language to Spanish', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await ensureAuthenticated(page, PROJECT, 'member');
		await languagePage.goto();

		await languagePage.selectLanguage('es');

		await expect(languagePage.selectTrigger).toContainText('Español', { timeout: 10_000 });
	});

	test('language preference persists after page reload', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await ensureAuthenticated(page, PROJECT, 'member');
		await languagePage.goto();

		await languagePage.selectLanguage('pt');
		await expect(languagePage.selectTrigger).toContainText('Português', { timeout: 10_000 });

		await page.reload();
		await expect(languagePage.selectTrigger).toContainText('Português', { timeout: 15_000 });
	});

	test('can change language back to English', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await ensureAuthenticated(page, PROJECT, 'member');
		await languagePage.goto();

		await languagePage.selectLanguage('en');

		await expect(languagePage.selectTrigger).toContainText('English', { timeout: 10_000 });
	});

	test.afterAll(async ({ browser }, testInfo) => {
		const context = await browser.newContext({
			baseURL: testInfo.project.use.baseURL,
			storageState: authStoragePath(PROJECT, 'member')
		});
		const page = await context.newPage();
		const languagePage = new PreferencesLanguagePage(page);

		try {
			await ensureAuthenticated(page, PROJECT, 'member');
			await languagePage.goto();
			await languagePage.selectLanguage('en');
		} finally {
			await context.close();
		}
	});
});
