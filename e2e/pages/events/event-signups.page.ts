import type { Page, Locator } from '@playwright/test';

export class EventSignupsPage {
	readonly page: Page;
	readonly signupTable: Locator;
	readonly detailedTable: Locator;
	readonly markAttendedBtn: Locator;
	readonly markNoShowBtn: Locator;

	constructor(page: Page) {
		this.page = page;
		this.signupTable = page.getByTestId('event-signup-table');
		this.detailedTable = page.getByTestId('event-signups-detailed-table');
		this.markAttendedBtn = page.getByTestId('event-mark-attended-btn');
		this.markNoShowBtn = page.getByTestId('event-mark-noshow-btn');
	}

	get firstAttendedBadge(): Locator {
		return this.page.getByText('Attended').first();
	}

	get firstNoShowBadge(): Locator {
		return this.page.getByText('No show').first();
	}

	async markFirstSignupAttended() {
		const attendedBtn = this.page.getByTestId('signup-action-attended').first();
		await attendedBtn.waitFor({ state: 'visible', timeout: 10_000 });
		await attendedBtn.click();
	}

	async markFirstSignupNoShow() {
		const dropdownTrigger = this.page.getByTestId('signup-action-dropdown').first();
		await dropdownTrigger.waitFor({ state: 'visible', timeout: 10_000 });
		await dropdownTrigger.click();
		await this.page.waitForSelector('[role="menu"]', { timeout: 5_000 });
		await this.page.getByRole('menuitem', { name: 'Mark as no show' }).first().click();
	}
}
