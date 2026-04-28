import type { Locator, Page } from '@playwright/test';
import { getPublicPetitionUrl } from '../../helpers/config';

export class PetitionPublicPage {
	readonly page: Page;
	readonly petitionTitle: Locator;
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
		this.petitionTitle = page.locator('h1').first();
		this.givenNameInput = page.getByTestId('petition-signup-given-name');
		this.familyNameInput = page.getByTestId('petition-signup-family-name');
		this.emailInput = page.getByTestId('petition-signup-email');
		this.submitButton = page.getByTestId('petition-signup-submit');
		this.whatsappSignupBtn = page.getByTestId('whatsapp-signup-btn').filter({ visible: true });
		this.addressLine1Input = page.getByTestId('signup-address-line1');
		this.addressLocalityInput = page.getByTestId('signup-address-locality');
		this.addressRegionInput = page.getByTestId('signup-address-region');
		this.addressPostcodeInput = page.getByTestId('signup-address-postcode');
	}

	async goto(orgSlug: string, petitionSlug: string) {
		await this.page.goto(getPublicPetitionUrl(orgSlug, petitionSlug));
	}

	async gotoViaPath(orgSlug: string, petitionSlug: string) {
		await this.page.goto(`/page/${orgSlug}/petitions/${petitionSlug}`);
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
