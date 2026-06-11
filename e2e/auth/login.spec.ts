import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { getTestUsers } from '../helpers/auth';

const PROJECT = 'auth' as const;
const USERS = getTestUsers(PROJECT);

test.describe('Unauthenticated Access', () => {
	test('visiting /community redirects to /signup', async ({ page }) => {
		await page.goto('/community');
		await expect(page).toHaveURL(/\/signup/);
	});

	test('visiting / redirects to /signup', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/signup/);
	});

	test('clicking the login link in the signup page redirects to /login', async ({ page }) => {
		await page.goto('/signup');
		await page.getByTestId('signup-login-link').click();
		await expect(page).toHaveURL('/login');
	});
});

test.describe('Login Form', () => {
	test('login page loads with email and password fields', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await expect(page).toHaveURL('/login');
		await expect(loginPage.emailInput).toBeVisible();
		await expect(loginPage.passwordInput).toBeVisible();
		await expect(loginPage.submitButton).toBeVisible();
	});

	test('invalid credentials show an error', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.login(USERS.owner.email, 'wrong-password');

		await expect(page).toHaveURL('/login');
		await loginPage.expectErrorMessage();
	});
});

test.describe('Email and password login (UI)', () => {
	test('user signs in on the login page with email and password', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const communityPage = new CommunityPage(page);

		await loginPage.goto();
		await expect(loginPage.emailInput).toBeVisible();
		await expect(loginPage.passwordInput).toBeVisible();
		await loginPage.login(USERS.owner.email, USERS.owner.password);

		await expect(page).toHaveURL('/community', { timeout: 30_000 });
		await communityPage.expectLoaded();
	});
});

test.describe('Logout', () => {
	test('logged-in user can log out and is redirected to /login', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const communityPage = new CommunityPage(page);

		await loginPage.goto();
		await loginPage.login(USERS.member.email, USERS.member.password);
		await expect(page).toHaveURL('/community');
		await communityPage.expectLoaded();

		await communityPage.logout();
		await expect(page).toHaveURL('/login');
	});
});
