import { BASE_URL, getUserEmails } from './config';
import type { E2EProject } from './config';

export type UserRole = 'owner' | 'admin' | 'member';

export interface TestUser {
	email: string;
	password: string;
	name: string;
	role: string;
}

const E2E_PASSWORD = 'TestPass123!';

export function getTestUsers(project: E2EProject): Record<UserRole, TestUser> {
	const emails = getUserEmails(project);
	const projectLabel = project.charAt(0).toUpperCase() + project.slice(1);
	return {
		owner: {
			email: emails.owner,
			password: E2E_PASSWORD,
			name: `E2E ${projectLabel} Owner`,
			role: 'owner'
		},
		admin: {
			email: emails.admin,
			password: E2E_PASSWORD,
			name: `E2E ${projectLabel} Admin`,
			role: 'admin'
		},
		member: {
			email: emails.member,
			password: E2E_PASSWORD,
			name: `E2E ${projectLabel} Member`,
			role: 'member'
		}
	};
}

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
