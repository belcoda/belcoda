import type { Locator, Page } from '@playwright/test';

export class PersonWhatsappComposePage {
	readonly page: Page;
	readonly templateComposer: Locator;
	readonly individualComposer: Locator;

	constructor(page: Page) {
		this.page = page;
		this.templateComposer = page.getByTestId('person-wa-compose-template');
		this.individualComposer = page.getByTestId('person-wa-compose-individual');
	}

	async gotoPersonTimeline(personId: string) {
		await this.page.goto(`/community/${personId}`);
		await this.page.getByTestId('person-timeline-display-name').waitFor({
			state: 'visible',
			timeout: 15_000
		});
	}

	templateVariableChip(label: string) {
		return this.templateComposer.getByText(label, { exact: true });
	}

	sendButton(composer: Locator) {
		return composer.getByRole('button', { name: 'Send' });
	}

	outgoingMessageText(text: string) {
		return this.page.locator('.message-text').filter({ hasText: text });
	}

	individualMessageInput() {
		return this.individualComposer.getByPlaceholder('Write your message...');
	}
}
