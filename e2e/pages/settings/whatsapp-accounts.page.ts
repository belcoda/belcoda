import type { Page, Locator } from '@playwright/test';

export class WhatsappAccountsPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto() {
		await this.page.goto('/settings/whatsapp/accounts');
		await this.page.getByTestId('whatsapp-accounts-heading').waitFor({
			state: 'visible',
			timeout: 15_000
		});
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
