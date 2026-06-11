import { expect, test } from '@playwright/test';
import { SendSignaturesPage } from '../pages/settings/send-signatures.page';
import { loginAsOwner, loginAsMember } from '../helpers/login';
import { expectMemberCannotAccessSettings } from '../helpers/settings-access';

const PROJECT = 'settings' as const;

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
		await loginAsOwner(page, PROJECT);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
	});

	test('owner can create a custom send signature', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);
		const suffix = Date.now();
		state.displayName = `E2E Signature ${suffix}`;
		state.emailAddress = `e2e-signature-${suffix}@example.com`;
		state.replyTo = `e2e-reply-${suffix}@example.com`;
		state.returnPathDomain = 'bounce.example.com';

		await loginAsOwner(page, PROJECT);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
		await sendSignaturesPage.createSignature({
			displayName: state.displayName,
			emailAddress: state.emailAddress,
			replyTo: state.replyTo,
			returnPathDomain: state.returnPathDomain
		});

		await expect(page.getByText('Email signature created successfully')).toBeVisible({
			timeout: 15_000
		});
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
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

		await loginAsOwner(page, PROJECT);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
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

		await loginAsOwner(page, PROJECT);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
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

		await loginAsOwner(page, PROJECT);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
		await sendSignaturesPage.selectDefaultSignature(optionLabel);

		await expect(page.getByText('Default send signature updated successfully')).toBeVisible({
			timeout: 15_000
		});
	});

	test('member cannot access send signature management', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);

		await loginAsMember(page, PROJECT);
		await sendSignaturesPage.goto();

		await expectMemberCannotAccessSettings(page);
		await expect(sendSignaturesPage.newSignatureTrigger).toHaveCount(0);
		await expect(sendSignaturesPage.signatureRowByEmail(state.emailAddress)).toHaveCount(0, {
			timeout: 5_000
		});
	});

	test('owner can delete custom send signature', async ({ page }) => {
		const sendSignaturesPage = new SendSignaturesPage(page);

		await loginAsOwner(page, PROJECT);
		await sendSignaturesPage.goto();
		await sendSignaturesPage.waitForOwnerPageLoaded();
		await sendSignaturesPage.deleteSignature(state.emailAddress);

		await expect(page.getByText('Email signature deleted successfully')).toBeVisible({
			timeout: 15_000
		});
		await expect(sendSignaturesPage.signatureRowByEmail(state.emailAddress)).toHaveCount(0, {
			timeout: 15_000
		});
	});
});
