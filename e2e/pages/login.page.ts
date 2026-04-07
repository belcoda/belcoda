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
		this.emailInput = page.getByTestId('login-email');
		this.passwordInput = page.getByTestId('login-password');
		this.submitButton = page.getByTestId('login-submit');
		this.errorMessage = page.getByTestId('auth-error');
		this.googleButton = page.getByTestId('login-google');
		this.signupLink = page.getByTestId('login-signup-link');
		this.forgotPasswordLink = page.getByTestId('login-forgot-password');
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
