import type { Page, Locator } from '@playwright/test';

export class CommunityPage {
	readonly page: Page;
	readonly heading: Locator;
	readonly sidebar: Locator;
	readonly userMenu: Locator;
	readonly orgMenu: Locator;
	readonly settingsLink: Locator;
	readonly logoutButton: Locator;
	readonly communitySearchInput: Locator;

	constructor(page: Page) {
		this.page = page;
		this.heading = page.locator('h1');
		this.sidebar = page.getByTestId('sidebar-content');
		this.communitySearchInput = page.getByTestId('community-person-search');
		this.userMenu = page.getByTestId('user-menu-trigger');
		this.orgMenu = page.getByTestId('org-menu-trigger');
		this.settingsLink = page.getByTestId('org-menu-settings');
		this.logoutButton = page.getByTestId('user-menu-logout');
	}

	async goto() {
		await this.page.goto('/community');
	}

	async expectLoaded() {
		await this.page.getByTestId('nav-community').waitFor({ state: 'visible' });
	}

	async searchCommunityList(query: string) {
		await this.communitySearchInput.fill(query);
	}

	personListLink(personId: string): Locator {
		return this.page.locator(
			`[data-testid="community-person-list-link"][data-person-id="${personId}"]`
		);
	}

	async openUserMenu() {
		await this.userMenu.click();
		await this.page.waitForSelector('[role="menu"]');
	}

	async openOrgMenu() {
		await this.orgMenu.click();
		await this.page.getByRole('menu').waitFor({ state: 'visible', timeout: 5_000 });
	}

	async clickSettings() {
		if (!(await this.settingsLink.isVisible().catch(() => false))) {
			await this.openOrgMenu();
		}

		if (!(await this.settingsLink.isVisible().catch(() => false))) {
			await this.page.keyboard.press('Escape');
			await this.openOrgMenu();
		}

		await this.settingsLink.waitFor({ state: 'visible', timeout: 10_000 });
		await this.settingsLink.click();
		await this.page.waitForURL(/\/settings\/?$/, { timeout: 10_000 });
	}

	async logout() {
		await this.openUserMenu();
		await this.logoutButton.waitFor({ state: 'visible' });
		await this.logoutButton.click();
		await this.page.waitForURL('/logout', { timeout: 5000 }).catch(() => {
			// If /logout is not reached, try waiting for /login
		});
		await this.page.waitForURL('/login', { timeout: 5000 });
	}
}
