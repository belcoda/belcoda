import { test as base } from '@playwright/test';
import { join } from 'path';
import {
	TEST_USERS,
	signInUser,
	extractSessionCookie,
	buildSessionCookie,
	type UserRole
} from './helpers/auth';

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
