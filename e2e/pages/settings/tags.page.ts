import type { Page, Locator } from '@playwright/test';

export class TagsPage {
	readonly page: Page;
	readonly settingsSidebarTagsLink: Locator;
	readonly newTagTrigger: Locator;
	readonly newTagNameInput: Locator;
	readonly newTagSubmit: Locator;
	readonly editTagNameInput: Locator;
	readonly editTagActiveCheckbox: Locator;
	readonly editTagSubmit: Locator;

	constructor(page: Page) {
		this.page = page;
		this.settingsSidebarTagsLink = page.getByTestId('settings-sidebar-tags');
		this.newTagTrigger = page.getByTestId('new-tag-trigger');
		this.newTagNameInput = page.getByTestId('new-tag-name');
		this.newTagSubmit = page.getByTestId('new-tag-submit');
		this.editTagNameInput = page.getByTestId('edit-tag-name');
		this.editTagActiveCheckbox = page.getByTestId('edit-tag-active');
		this.editTagSubmit = page.getByTestId('edit-tag-submit');
	}

	async goto() {
		await this.page.goto('/settings/tags');
	}

	tagRow(tagId: string): Locator {
		return this.page.locator(`[data-testid="tag-row"][data-tag-id="${tagId}"]`);
	}

	tagRowByName(name: string): Locator {
		return this.page
			.locator('[data-testid="tag-row"]')
			.filter({ has: this.page.locator(`[data-testid="tag-row-name"]:has-text("${name}")`) });
	}

	editTriggerForTag(tagId: string): Locator {
		return this.page.locator(`[data-testid="edit-tag-trigger"][data-tag-id="${tagId}"]`);
	}

	deleteTriggerForTag(tagId: string): Locator {
		return this.page.locator(`[data-testid="delete-tag-trigger"][data-tag-id="${tagId}"]`);
	}

	async createTag(name: string) {
		await this.newTagTrigger.click();
		await this.newTagNameInput.fill(name);
		await this.newTagSubmit.click();
	}

	async editTag(tagId: string, newName: string) {
		await this.editTriggerForTag(tagId).click();
		await this.editTagNameInput.fill(newName);
		await this.editTagSubmit.click();
	}

	async deactivateTag(tagId: string) {
		await this.editTriggerForTag(tagId).click();
		const checkbox = this.editTagActiveCheckbox;
		const isChecked = await checkbox.isChecked();
		if (isChecked) {
			await checkbox.click();
		}
		await this.editTagSubmit.click();
	}

	async deleteTag(tagId: string) {
		await this.deleteTriggerForTag(tagId).click();
	}
}
