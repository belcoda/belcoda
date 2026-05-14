import type { Page, Locator } from '@playwright/test';

export class WhatsappAccountsPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		const heading = this.page.getByTestId('whatsapp-accounts-heading');
		let lastError: unknown;

		for (let attempt = 0; attempt < 3; attempt += 1) {
			await this.page.goto('/settings/whatsapp/accounts');
			try {
				await heading.waitFor({
					state: 'visible',
					timeout: 5_000
				});
				return;
			} catch (error) {
				lastError = error;
			}
		}

		throw lastError;
	}

	heading(): Locator {
		return this.page.getByTestId('whatsapp-accounts-heading');
	}

	activatedCard(): Locator {
		return this.page.getByTestId('whatsapp-accounts-activated-card');
	}

	activateCard(): Locator {
		return this.page.getByTestId('whatsapp-accounts-activate-card');
	}

	launchSignupButton(): Locator {
		return this.page.getByTestId('whatsapp-accounts-launch-signup');
	}

	async completeEmbeddedSignup({
		phoneNumberId,
		wabaId
	}: {
		phoneNumberId: string;
		wabaId: string;
	}) {
		await this.page.evaluate(
			({ phoneNumberId, wabaId }) => {
				const completeSignup = (window as any).__belcodaCompleteWhatsAppSignup;
				if (typeof completeSignup === 'function') {
					completeSignup(phoneNumberId, wabaId);
					return;
				}

				window.dispatchEvent(
					new MessageEvent('message', {
						origin: 'https://www.facebook.com',
						data: JSON.stringify({
							type: 'WA_EMBEDDED_SIGNUP',
							event: 'FINISH',
							data: {
								phone_number_id: phoneNumberId,
								waba_id: wabaId
							}
						})
					})
				);
			},
			{ phoneNumberId, wabaId }
		);
	}

	sidebarLink(): Locator {
		return this.page.getByTestId('settings-sidebar-whatsapp-accounts');
	}

	phoneLine(): Locator {
		return this.page.getByTestId('whatsapp-accounts-phone-line');
	}

	wabaLine(): Locator {
		return this.page.getByTestId('whatsapp-accounts-waba-line');
	}
}
