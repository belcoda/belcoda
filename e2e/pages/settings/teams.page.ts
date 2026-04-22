import type { Page, Locator } from '@playwright/test';

export class TeamsPage {
	readonly page: Page;
	readonly settingsSidebarTeamsLink: Locator;
	readonly newTeamTrigger: Locator;
	readonly newTeamNameInput: Locator;
	readonly newTeamSubmit: Locator;
	readonly editTeamNameInput: Locator;
	readonly editTeamSubmit: Locator;

	constructor(page: Page) {
		this.page = page;
		this.settingsSidebarTeamsLink = page.getByTestId('settings-sidebar-teams');
		this.newTeamTrigger = page.getByTestId('new-team-trigger');
		this.newTeamNameInput = page.getByTestId('new-team-name');
		this.newTeamSubmit = page.getByTestId('new-team-submit');
		this.editTeamNameInput = page.getByTestId('edit-team-name');
		this.editTeamSubmit = page.getByTestId('edit-team-submit');
	}

	async goto() {
		await this.page.goto('/settings/teams');
	}

	teamRow(teamId: string): Locator {
		return this.page.locator(`[data-testid="team-row"][data-team-id="${teamId}"]`);
	}

	teamRowByName(name: string): Locator {
		return this.page
			.locator('[data-testid="team-row"]')
			.filter({ has: this.page.locator(`[data-testid="team-row-name"]:has-text("${name}")`) });
	}

	editTriggerForTeam(teamId: string): Locator {
		return this.page.locator(`[data-testid="edit-team-trigger"][data-team-id="${teamId}"]`);
	}

	async createTeam(name: string) {
		await this.newTeamTrigger.click();
		await this.newTeamNameInput.fill(name);
		await this.newTeamSubmit.click();
	}

	async editTeam(teamId: string, newName: string) {
		await this.editTriggerForTeam(teamId).click();
		await this.editTeamNameInput.fill(newName);
		await this.editTeamSubmit.click();
	}
}

export class TeamDetailPage {
	readonly page: Page;
	readonly addPersonTrigger: Locator;

	constructor(page: Page) {
		this.page = page;
		this.addPersonTrigger = page.getByTestId('team-add-person-trigger');
	}

	async goto(teamId: string) {
		await this.page.goto(`/settings/teams/${teamId}`);
	}

	personRow(personId: string): Locator {
		return this.page.locator(`[data-testid="team-person-row"][data-person-id="${personId}"]`);
	}

	removePersonButton(personId: string): Locator {
		return this.page.locator(`[data-testid="team-remove-person"][data-person-id="${personId}"]`);
	}
}
