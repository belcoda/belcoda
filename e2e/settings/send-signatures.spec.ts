import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { SendSignaturesPage } from '../pages/settings/send-signatures.page';
import { TEST_USERS } from '../helpers/auth';

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

test.describe.serial('Settings: Send Signatures', () => {
	const state = {
		displayName: '',
		emailAddress: '',
		replyTo: '',
		returnPathDomain: '',
		updatedDisplayName: '',
		updatedReplyTo: '',
		updatedReturnPathDomain: ''
	};

	test('owner can view send signature settings page', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);
		await loginAsOwner(page);
		await sendSignaturesPage.goto();
		await expect(sendSignaturesPage.systemSignatureCard).toBeVisible({ timeout: 15_000 });
	});

	test('owner can create a custom send signature', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);
		const suffix = Date.now();
		state.displayName = `E2E Signature ${suffix}`;
		state.emailAddress = `e2e-signature-${suffix}@example.com`;
		state.replyTo = `e2e-reply-${suffix}@example.com`;
		state.returnPathDomain = 'bounce.example.com';

		await loginAsOwner(page);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.createSignature({
			displayName: state.displayName,
			emailAddress: state.emailAddress,
			replyTo: state.replyTo,
			returnPathDomain: state.returnPathDomain
		});

		await expect(page.getByText('Email signature created successfully')).toBeVisible({
			timeout: 15_000
		});
		await expect(sendSignaturesPage.signatureRowByEmail(state.emailAddress)).toBeVisible({
			timeout: 15_000
		});
	});

	test('owner can edit a custom send signature', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);
		const suffix = Date.now();
		state.updatedDisplayName = `${state.displayName} Updated`;
		state.updatedReplyTo = `e2e-reply-updated-${suffix}@example.com`;
		state.updatedReturnPathDomain = 'mail.bounce.example.com';

		await loginAsOwner(page);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.editSignature(state.emailAddress, {
			displayName: state.updatedDisplayName,
			replyTo: state.updatedReplyTo,
			returnPathDomain: state.updatedReturnPathDomain
		});

		const row = sendSignaturesPage.signatureRowByEmail(state.emailAddress);
		await expect(page.getByText('Email signature updated successfully')).toBeVisible({
			timeout: 15_000
		});
		await expect(row).toContainText(state.updatedDisplayName, { timeout: 15_000 });
		await expect(row).toContainText(state.updatedReplyTo, { timeout: 15_000 });
		await expect(row.getByTestId('settings-send-signatures-row-reply-to')).toContainText(
			state.updatedReplyTo,
			{ timeout: 15_000 }
		);
		await expect(row.getByTestId('settings-send-signatures-row-reply-to')).not.toContainText(
			state.emailAddress
		);
		await expect(row).toContainText(state.updatedReturnPathDomain, { timeout: 15_000 });
	});

	test('owner can verify a custom send signature', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);

		await loginAsOwner(page);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.verifySignature(state.emailAddress);

		await expect(page.getByText('Email signature verification status updated')).toBeVisible({
			timeout: 15_000
		});
		const row = sendSignaturesPage.signatureRowByEmail(state.emailAddress);
		await expect(row).toContainText('Verified', { timeout: 15_000 });
	});

	test('owner can set custom send signature as default', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);
		const optionLabel = `${state.updatedDisplayName} <${state.emailAddress}>`;

		await loginAsOwner(page);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.selectDefaultSignature(optionLabel);

		await expect(page.getByText('Default send signature updated successfully')).toBeVisible({
			timeout: 15_000
		});
	});

	test('owner can delete custom send signature', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);

		await loginAsOwner(page);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.deleteSignature(state.emailAddress);

		await expect(page.getByText('Email signature deleted successfully')).toBeVisible({
			timeout: 15_000
		});
		await expect(sendSignaturesPage.signatureRowByEmail(state.emailAddress)).toHaveCount(0, {
			timeout: 15_000
		});
	});
});
