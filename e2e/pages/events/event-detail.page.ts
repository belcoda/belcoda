import type { Page, Locator } from '@playwright/test';

export class EventDetailPage {
	readonly page: Page;
	readonly actionDropdownTrigger: Locator;

	constructor(page: Page) {
		this.page = page;
		this.actionDropdownTrigger = page.getByTestId('event-action-dropdown');
	}

	async goto(eventId: string) {
		await this.page.goto(`/events/${eventId}`);
	}

	async waitForLoaded() {
		await this.actionDropdownTrigger.waitFor({ state: 'visible', timeout: 15_000 });
	}

	async openActionDropdown() {
		await this.actionDropdownTrigger.click();
		await this.page.waitForSelector('[role="menu"]', { timeout: 5_000 });
	}

	async clickEditEvent() {
		await this.page.getByTestId('event-action-edit').click();
	}

	async clickPreviewEvent() {
		await this.page.getByTestId('event-action-preview').click();
	}

	async clickDetailedSignups() {
		await this.page.getByTestId('event-action-signups').click();
	}

	async getEventSlugFromUrl(): Promise<string> {
		const url = this.page.url();
		const parts = url.split('/');
		const eventsIdx = parts.indexOf('events');
		return eventsIdx !== -1 ? (parts[eventsIdx + 1] ?? '') : '';
	}
}
