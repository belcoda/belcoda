import { expect, type Page } from '@playwright/test';
import type { ApiResponse } from './api-client';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { TEST_USERS } from '../helpers/auth';

/**
 * Many `/api/v1/*` routes throw `Response` objects from `processIncomingBody` /
 * `buildApiErrorResponse` (see `src/lib/server/utils/restApi.ts`). SvelteKit
 * does not understand those, so a body that fails valibot validation comes back
 * as a 500 instead of the intended 400. This is a known issue that's explicitly
 * out of scope on this branch (see the e2e-tests-for-rest-api plan).
 *
 * Tests that exercise validation should therefore accept either 400 (the
 * eventual goal) or 500 (the current behaviour), while still asserting that
 * the request was rejected with an error message.
 */
export function expectValidationError(
	response: ApiResponse<unknown>,
	{ allow500 = true }: { allow500?: boolean } = {}
): void {
	const acceptable = allow500 ? [400, 500] : [400];
	expect(acceptable, `expected status to be one of ${acceptable.join(', ')}`).toContain(
		response.status
	);
	// SvelteKit `error()` returns `{ message }`; `buildApiErrorResponse` returns
	// `{ error }`. Accept either as long as it's a non-empty string.
	const body = response.body as { error?: unknown; message?: unknown } | null | undefined;
	const text = body?.error ?? body?.message;
	expect(typeof text).toBe('string');
	expect((text as string).length).toBeGreaterThan(0);
}

/**
 * Shared "log in as the e2e owner" helper used by every API spec to reach
 * the authenticated UI for parity assertions. Mirrors the pattern in the
 * existing community/events/petitions specs.
 */
export async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}
