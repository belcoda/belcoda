import type { Page, Locator } from '@playwright/test';

export class EventPublicPage {
	readonly page: Page;
	readonly eventTitle: Locator;
	readonly givenNameInput: Locator;
	readonly familyNameInput: Locator;
	readonly emailInput: Locator;
	readonly submitButton: Locator;
	readonly whatsappSignupBtn: Locator;

	constructor(page: Page) {
		this.page = page;
		this.eventTitle = page.locator('h1').first();
		this.givenNameInput = page.getByTestId('event-signup-given-name');
		this.familyNameInput = page.getByTestId('event-signup-family-name');
		this.emailInput = page.getByTestId('event-signup-email');
		this.submitButton = page.getByTestId('event-signup-submit');
		this.whatsappSignupBtn = page.getByTestId('whatsapp-signup-btn');
	}

	async goto(orgSlug: string, eventSlug: string) {
		await this.page.goto(`/page/${orgSlug}/events/${eventSlug}`);
	}

	async fillSignupForm({
		givenName,
		familyName,
		email
	}: {
		givenName: string;
		familyName: string;
		email: string;
	}) {
		await this.givenNameInput.fill(givenName);
		await this.familyNameInput.fill(familyName);
		await this.emailInput.fill(email);
	}

	async submitSignup() {
		await this.submitButton.click();
	}
}
