import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { PreferencesLanguagePage } from '../pages/preferences/language.page';
import { getTestUsers } from '../helpers/auth';

const PROJECT = 'settings' as const;
const USERS = getTestUsers(PROJECT);

async function loginAsMember(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.member.email, USERS.member.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Preferences: Language', () => {
	test('language page loads with a language selector', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await loginAsMember(page);
		await languagePage.goto();

		await expect(languagePage.root).toBeVisible({ timeout: 15_000 });
		await expect(languagePage.selectTrigger).toBeVisible();
	});

	test('language selector shows all supported locales', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await loginAsMember(page);
		await languagePage.goto();

		await languagePage.selectTrigger.click();

		await expect(languagePage.option('en')).toBeVisible({ timeout: 10_000 });
		await expect(languagePage.option('es')).toBeVisible();
		await expect(languagePage.option('pt')).toBeVisible();

		await page.keyboard.press('Escape');
	});

	test('can change language to Spanish', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await loginAsMember(page);
		await languagePage.goto();

		await languagePage.selectLanguage('es');

		await expect(languagePage.selectTrigger).toContainText('Español', { timeout: 10_000 });
	});

	test('language preference persists after page reload', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await loginAsMember(page);
		await languagePage.goto();

		await languagePage.selectLanguage('pt');
		await expect(languagePage.selectTrigger).toContainText('Português', { timeout: 10_000 });

		await page.reload();
		await expect(languagePage.selectTrigger).toContainText('Português', { timeout: 15_000 });
	});

	test('can change language back to English', async ({ page }) => {
		const languagePage = new PreferencesLanguagePage(page);

		await loginAsMember(page);
		await languagePage.goto();

		await languagePage.selectLanguage('en');

		await expect(languagePage.selectTrigger).toContainText('English', { timeout: 10_000 });
	});

	test.afterAll(async ({ browser }, testInfo) => {
		const context = await browser.newContext({
			baseURL: testInfo.project.use.baseURL,
			storageState: testInfo.project.use.storageState
		});
		const page = await context.newPage();
		const loginPage = new LoginPage(page);
		const communityPage = new CommunityPage(page);
		const languagePage = new PreferencesLanguagePage(page);

		try {
			await loginPage.goto();
			await loginPage.login(USERS.member.email, USERS.member.password);
			await expect(page).toHaveURL('/community');
			await communityPage.expectLoaded();
			await languagePage.goto();
			await languagePage.selectLanguage('en');
		} finally {
			await context.close();
		}
	});
});
