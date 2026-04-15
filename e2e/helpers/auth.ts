import { BASE_URL } from './config';

export type UserRole = 'owner' | 'admin' | 'member';

export interface TestUser {
	email: string;
	password: string;
	name: string;
	role: string;
}

export const TEST_USERS: Record<UserRole, TestUser> = {
	owner: {
		email: 'e2e-owner@belcoda.test',
		password: 'TestPass123!',
		name: 'E2E Owner',
		role: 'owner'
	},
	admin: {
		email: 'e2e-admin@belcoda.test',
		password: 'TestPass123!',
		name: 'E2E Admin',
		role: 'admin'
	},
	member: {
		email: 'e2e-member@belcoda.test',
		password: 'TestPass123!',
		name: 'E2E Member',
		role: 'member'
	}
};

export async function verifyUserEmail(email: string): Promise<void> {
	const response = await fetch(`${BASE_URL}/api/e2e/verify-email`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		body: JSON.stringify({ email })
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to verify email for ${email}: ${response.status} ${error}`);
	}

	console.log(`  ✓ Email verified for ${email}`);
}
export async function signUpUser(user: TestUser): Promise<Response> {
	const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		body: JSON.stringify({
			email: user.email,
			password: user.password,
			name: user.name
		})
	});

	if (!response.ok) {
		const error = await response.text();
		if (!error.includes('already exists')) {
			console.log(`Sign up response for ${user.email}:`, response.status, error);
		}
	}

	return response;
}

// Sign in a user using better-auth api
export async function signInUser(user: TestUser): Promise<Response> {
	const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		body: JSON.stringify({
			email: user.email,
			password: user.password
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to sign in ${user.email}: ${response.status} ${error}`);
	}

	return response;
}

export function extractSessionCookie(response: Response): string | null {
	const setCookie = response.headers.get('set-cookie');
	if (!setCookie) return null;

	const match = setCookie.match(/belcoda\.session_token=([^;]+)/);
	return match ? match[1] : null;
}

export function buildSessionCookie(token: string) {
	return {
		name: 'belcoda.session_token',
		value: token,
		domain: 'localhost',
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'Lax' as const
	};
}
