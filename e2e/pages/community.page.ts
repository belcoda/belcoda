import type { Page, Locator } from '@playwright/test';

export class CommunityPage {
	readonly page: Page;
	readonly heading: Locator;
	readonly sidebar: Locator;
	readonly userMenu: Locator;
	readonly orgMenu: Locator;
	readonly settingsLink: Locator;
	readonly logoutButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.heading = page.locator('h1');
		this.sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar');
		this.userMenu = page
			.locator('button')
			.filter({ has: page.locator('img[alt]') })
			.first();
		this.orgMenu = page.locator('[data-testid="org-menu"], button:has-text("Organization")');
		this.settingsLink = page.locator('a[href="/settings"], a:has-text("Settings")');
		this.logoutButton = page.locator('a[href="/logout"]');
	}

	async goto() {
		await this.page.goto('/community');
	}

	async expectLoaded() {
		await this.page.waitForLoadState('networkidle');
	}

	async openUserMenu() {
		await this.userMenu.click();
		await this.page.waitForSelector('[role="menu"]');
	}

	async openOrgMenu() {
		await this.orgMenu.click();
	}

	async clickSettings() {
		await this.settingsLink.click();
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
