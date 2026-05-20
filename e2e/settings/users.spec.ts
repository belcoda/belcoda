import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { UsersPage } from '../pages/settings/users.page';
import { OrganizationPage } from '../pages/organization.page';
import { getTestUsers, signUpUser, verifyUserEmail } from '../helpers/auth';
import { BASE_URL, getOrgSlug } from '../helpers/config';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'settings' as const;
const USERS = getTestUsers(PROJECT);
const ORG_SLUG = getOrgSlug(PROJECT);

async function signOut(page: Page) {
	await page.goto('/logout');
	await page.waitForURL('**/login', { timeout: 10_000 });
}

async function loginAs(page: Page, email: string, password: string) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(email, password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function getInvitationId(email: string): Promise<string> {
	const response = await fetch(`${BASE_URL}/api/e2e/get-invitation`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', origin: BASE_URL },
		body: JSON.stringify({ email, orgSlug: ORG_SLUG })
	});
	if (!response.ok) {
		throw new Error(`get-invitation failed: ${response.status} ${await response.text()}`);
	}
	const data = await response.json();
	return data.invitationId as string;
}

test.describe.serial('Settings: User Invitations', () => {
	const state = {
		invitedEmail: ''
	};

	test('owner can send an invitation and it appears in the pending list', async ({ page }) => {
		const suffix = Date.now();
		state.invitedEmail = `e2e-invite-${suffix}@belcoda.test`;

		await loginAs(page, USERS.owner.email, USERS.owner.password);

		const usersPage = new UsersPage(page);
		await usersPage.goto();
		await usersPage.openInviteModal();
		await usersPage.fillInviteEmail(state.invitedEmail);
		await usersPage.submitInvite();

		await expect(page.getByText(`Invitation sent to ${state.invitedEmail}`)).toBeVisible({
			timeout: 10_000
		});
		await expect(usersPage.invitationRowByEmail(state.invitedEmail)).toBeVisible({
			timeout: 15_000
		});
	});

	test('pending invitation is still visible after page reload', async ({ page }) => {
		await loginAs(page, USERS.owner.email, USERS.owner.password);

		const usersPage = new UsersPage(page);
		await usersPage.goto();

		await expect(usersPage.invitationRowByEmail(state.invitedEmail)).toBeVisible({
			timeout: 15_000
		});
	});

	test('owner can cancel a pending invitation', async ({ page }) => {
		const suffix = Date.now();
		const cancelEmail = `e2e-invite-cancel-${suffix}@belcoda.test`;

		await loginAs(page, USERS.owner.email, USERS.owner.password);

		const usersPage = new UsersPage(page);
		await usersPage.goto();
		await usersPage.openInviteModal();
		await usersPage.fillInviteEmail(cancelEmail);
		await usersPage.submitInvite();
		await expect(usersPage.invitationRowByEmail(cancelEmail)).toBeVisible({ timeout: 15_000 });

		await usersPage.cancelInvitationByEmail(cancelEmail);

		await expect(page.getByText('Invitation cancelled')).toBeVisible({ timeout: 10_000 });
		await expect(usersPage.invitationRowByEmail(cancelEmail)).toHaveCount(0, { timeout: 15_000 });
	});

	test('member cannot access user management', async ({ page }) => {
		const usersPage = new UsersPage(page);

		await loginAs(page, USERS.member.email, USERS.member.password);
		await usersPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(usersPage.inviteButton).toHaveCount(0);
	});
});

test.describe.serial('Settings: Invitation acceptance', () => {
	test('invited user can sign up and accept invitation', async ({ page }) => {
		const suffix = Date.now();
		const inviteeEmail = `e2e-invite-accept-${suffix}@belcoda.test`;
		const inviteePassword = 'TestPass123!';

		// Owner sends invite
		await loginAs(page, USERS.owner.email, USERS.owner.password);
		const usersPage = new UsersPage(page);
		await usersPage.goto();
		await usersPage.openInviteModal();
		await usersPage.fillInviteEmail(inviteeEmail);
		await usersPage.submitInvite();
		await expect(usersPage.invitationRowByEmail(inviteeEmail)).toBeVisible({ timeout: 15_000 });

		// Sign up + verify as the invitee (no real email needed)
		await signUpUser({
			email: inviteeEmail,
			password: inviteePassword,
			name: 'E2E Invitee Accept',
			role: 'member'
		});
		await verifyUserEmail(inviteeEmail);

		// Sign out the owner before logging in as the invitee
		await signOut(page);

		// Log in as invitee — no active org yet, lands on /organization
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.login(inviteeEmail, inviteePassword);
		await expect(page).toHaveURL('/organization', { timeout: 30_000 });

		const orgPage = new OrganizationPage(page);
		await orgPage.acceptInvitation();

		await expect(page).toHaveURL('/community', { timeout: 30_000 });
	});
});

test.describe.serial('Settings: Invitation decline', () => {
	test('invited user can decline an invitation', async ({ page }) => {
		const suffix = Date.now();
		const inviteeEmail = `e2e-invite-decline-${suffix}@belcoda.test`;
		const inviteePassword = 'TestPass123!';

		// Owner sends invite
		await loginAs(page, USERS.owner.email, USERS.owner.password);
		const usersPage = new UsersPage(page);
		await usersPage.goto();
		await usersPage.openInviteModal();
		await usersPage.fillInviteEmail(inviteeEmail);
		await usersPage.submitInvite();
		await expect(usersPage.invitationRowByEmail(inviteeEmail)).toBeVisible({ timeout: 15_000 });

		// Sign up + verify as the invitee
		await signUpUser({
			email: inviteeEmail,
			password: inviteePassword,
			name: 'E2E Invitee Decline',
			role: 'member'
		});
		await verifyUserEmail(inviteeEmail);

		// Sign out the owner before logging in as the invitee
		await signOut(page);

		// Log in as invitee — lands on /organization
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.login(inviteeEmail, inviteePassword);
		await expect(page).toHaveURL('/organization', { timeout: 30_000 });

		const orgPage = new OrganizationPage(page);
		await orgPage.declineInvitation();

		await expect(page).toHaveURL('/organization', { timeout: 30_000 });
		await page.reload();
		await expect(page.getByTestId('invitation-accept')).toHaveCount(0, { timeout: 10_000 });
	});
});
