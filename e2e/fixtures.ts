import { test as base } from '@playwright/test';
import { join } from 'path';
import {
	TEST_USERS,
	signInUser,
	extractSessionCookie,
	buildSessionCookie,
	type UserRole
} from './helpers/auth';

/**
 * Usage:
 * ```ts
 * import { test } from '../fixtures';
 *
 * test('admin can access settings', async ({ page, loginAs }) => {
 *   await loginAs('admin');
 *   await page.goto('/settings');
 * });
 *
 * test('role escalation', async ({ page, loginAs }) => {
 *   await loginAs('member');
 *   await page.goto('/admin-only');
 *   await expect(page).toHaveURL('/unauthorized'); // member can't access
 *
 *   await loginAs('admin'); // switch to admin
 *   await page.goto('/admin-only');
 *   await expect(page).toHaveURL('/admin-only'); // admin can access
 * });
 * ```
 */

const AUTH_DIR = join(process.cwd(), 'playwright', '.auth');

type Fixtures = {
	authDir: string;
	loginAs: (role: UserRole) => Promise<void>;
};

export const test = base.extend<Fixtures>({
	authDir: AUTH_DIR,

	loginAs: async ({ context }, use) => {
		const loginAs = async (role: UserRole) => {
			const user = TEST_USERS[role];
			const response = await signInUser(user);
			const token = extractSessionCookie(response);

			if (!token) {
				throw new Error(`Could not extract session token for ${role}`);
			}

			await context.addCookies([buildSessionCookie(token)]);
		};

		await use(loginAs);
	}
});

export { expect } from '@playwright/test';
