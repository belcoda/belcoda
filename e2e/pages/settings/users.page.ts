import type { Page, Locator } from '@playwright/test';

export class UsersPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/users');
	}

	get inviteButton(): Locator {
		return this.page.getByTestId('invite-user-trigger');
	}

	async openInviteModal() {
		await this.inviteButton.click();
	}

	async fillInviteEmail(email: string) {
		await this.page.locator('#invite-email').fill(email);
	}

	async submitInvite() {
		await this.page.getByTestId('invite-user-submit').click();
	}

	invitationRowByEmail(email: string): Locator {
		return this.page.locator(`[data-invitation-email="${email}"]`);
	}

	async cancelInvitationByEmail(email: string) {
		await this.invitationRowByEmail(email).getByTestId('settings-users-cancel-invitation').click();
	}

	memberRowByName(name: string): Locator {
		return this.page.locator('td').filter({ hasText: name }).first();
	}
}
