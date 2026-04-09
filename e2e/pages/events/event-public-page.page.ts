import type { Page, Locator } from '@playwright/test';
import { getPublicEventUrl } from '../../helpers/config';

export class EventPublicPage {
	readonly page: Page;
	readonly eventTitle: Locator;
	readonly givenNameInput: Locator;
	readonly familyNameInput: Locator;
	readonly emailInput: Locator;
	readonly submitButton: Locator;
	readonly whatsappSignupBtn: Locator;

	readonly addressLine1Input: Locator;
	readonly addressLocalityInput: Locator;
	readonly addressRegionInput: Locator;
	readonly addressPostcodeInput: Locator;

	constructor(page: Page) {
		this.page = page;
		this.eventTitle = page.locator('h1').first();
		this.givenNameInput = page.getByTestId('event-signup-given-name');
		this.familyNameInput = page.getByTestId('event-signup-family-name');
		this.emailInput = page.getByTestId('event-signup-email');
		this.submitButton = page.getByTestId('event-signup-submit');
		this.whatsappSignupBtn = page.getByTestId('whatsapp-signup-btn');

		this.addressLine1Input = page.getByTestId('signup-address-line1');
		this.addressLocalityInput = page.getByTestId('signup-address-locality');
		this.addressRegionInput = page.getByTestId('signup-address-region');
		this.addressPostcodeInput = page.getByTestId('signup-address-postcode');
	}

	async goto(orgSlug: string, eventSlug: string) {
		await this.page.goto(getPublicEventUrl(orgSlug, eventSlug));
	}

	async gotoViaPath(orgSlug: string, eventSlug: string) {
		await this.page.goto(`/page/${orgSlug}/events/${eventSlug}`);
	}

	customFieldInput(fieldId: string): Locator {
		return this.page.getByTestId(`signup-custom-field-${fieldId}`);
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
