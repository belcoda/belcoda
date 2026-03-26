import type { Page, Locator } from '@playwright/test';

export class LoginPage {
	readonly page: Page;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly submitButton: Locator;
	readonly errorMessage: Locator;
	readonly googleButton: Locator;
	readonly signupLink: Locator;
	readonly forgotPasswordLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.emailInput = page.locator('input[type="email"], input[name="email"]');
		this.passwordInput = page.locator('input[type="password"], input[name="password"]');
		this.submitButton = page.locator('button[type="submit"]');
		this.errorMessage = page.locator(
			'[data-slot="alert-description"]:has-text("Invalid email or password")'
		);
		this.googleButton = page.locator('button:has-text("Google"), [data-provider="google"]');
		this.signupLink = page.locator('a[href="/signup"], a:has-text("Sign up")');
		this.forgotPasswordLink = page.locator('a[href*="forgot"], a:has-text("Forgot")');
	}

	async goto() {
		await this.page.goto('/login');
	}

	async login(email: string, password: string) {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}

	async clickGoogleSignIn() {
		await this.googleButton.click();
	}

	async clickSignup() {
		await this.signupLink.click();
	}

	async clickForgotPassword() {
		await this.forgotPasswordLink.click();
	}

	async expectErrorMessage(text?: string) {
		if (text) {
			await this.errorMessage.filter({ hasText: text }).waitFor();
		} else {
			await this.errorMessage.waitFor();
		}
	}
}
