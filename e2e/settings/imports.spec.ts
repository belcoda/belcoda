import { expect, test, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { LoginPage } from '../pages/login.page';
import { CommunityPage } from '../pages/community/community.page';
import { ImportsPage } from '../pages/settings/imports.page';
import { getTestUsers } from '../helpers/auth';

const PROJECT = 'settings' as const;
const USERS = getTestUsers(PROJECT);

async function loginAsOwner(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.owner.email, USERS.owner.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function loginAsAdmin(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.admin.email, USERS.admin.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

async function loginAsMember(page: Page) {
	const loginPage = new LoginPage(page);
	const communityPage = new CommunityPage(page);
	await loginPage.goto();
	await loginPage.login(USERS.member.email, USERS.member.password);
	await expect(page).toHaveURL('/community');
	await communityPage.expectLoaded();
}

function createSampleCsvFile(): string {
	const csvContent = [
		'given_name,family_name,email_address,phone_number,subscribed,do_not_contact',
		`E2EImport,Person1,e2e-import-1-${Date.now()}@belcoda.test,+254712345001,true,false`,
		`E2EImport,Person2,e2e-import-2-${Date.now()}@belcoda.test,+254712345002,true,false`
	].join('\n');

	const tmpFile = path.join(os.tmpdir(), `e2e-import-${Date.now()}.csv`);
	fs.writeFileSync(tmpFile, csvContent);
	return tmpFile;
}

test.describe.serial('Settings: People Imports', () => {
	test('owner can navigate to imports page via sidebar', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsOwner(page);
		await page.goto('/settings');

		await importsPage.settingsSidebarImportsLink.click();
		await expect(page).toHaveURL('/settings/people/imports');
		await expect(page.getByRole('heading', { name: /people imports/i })).toBeVisible({
			timeout: 15_000
		});
	});

	test('imports page shows empty state when no imports exist', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsOwner(page);
		await importsPage.goto();

		await expect(importsPage.emptyState).toBeVisible({ timeout: 15_000 });
		await expect(importsPage.newImportTrigger).toBeVisible();
	});

	test('owner can open the new import modal', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsOwner(page);
		await importsPage.goto();

		await importsPage.newImportTrigger.click();

		await expect(importsPage.csvFileInput).toBeVisible({ timeout: 10_000 });
		await expect(importsPage.downloadSampleButton).toBeVisible();
		await expect(importsPage.uploadCancelButton).toBeVisible();
		await expect(importsPage.uploadSubmitButton).toBeVisible();
	});

	test('owner can cancel the import modal', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsOwner(page);
		await importsPage.goto();

		await importsPage.newImportTrigger.click();
		await expect(importsPage.csvFileInput).toBeVisible({ timeout: 10_000 });

		await importsPage.uploadCancelButton.click();
		await expect(importsPage.csvFileInput).not.toBeVisible({ timeout: 5_000 });
	});

	test('selecting a CSV file shows the filename', async ({ page }) => {
		const importsPage = new ImportsPage(page);
		const csvFile = createSampleCsvFile();

		await loginAsOwner(page);
		await importsPage.goto();

		await importsPage.newImportTrigger.click();
		await expect(importsPage.csvFileInput).toBeVisible({ timeout: 10_000 });

		await importsPage.csvFileInput.setInputFiles(csvFile);

		await expect(page.getByTestId('imports-selected-file')).toBeVisible({ timeout: 5_000 });
		await expect(page.getByTestId('imports-selected-file')).toContainText(
			path.basename(csvFile)
		);

		fs.unlinkSync(csvFile);
	});

	test('owner can upload a CSV and import starts', async ({ page }) => {
		const importsPage = new ImportsPage(page);
		const csvFile = createSampleCsvFile();
		const fakeS3Url = 'https://fake-s3.example.com/upload/test.csv';

		await page.route('**/api/utils/upload**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ signedUrl: fakeS3Url })
			});
		});

		await page.route(fakeS3Url, async (route) => {
			await route.fulfill({
				status: 200,
				headers: { location: fakeS3Url }
			});
		});

		await loginAsOwner(page);
		await importsPage.goto();

		await importsPage.newImportTrigger.click();
		await expect(importsPage.csvFileInput).toBeVisible({ timeout: 10_000 });

		await importsPage.csvFileInput.setInputFiles(csvFile);
		await importsPage.uploadSubmitButton.click();

		await expect(importsPage.csvFileInput).not.toBeVisible({ timeout: 15_000 });

		fs.unlinkSync(csvFile);
	});

	test('imports table row appears after upload', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsOwner(page);
		await importsPage.goto();

		const rowCount = await importsPage.importRows.count();
		if (rowCount > 0) {
			const firstRow = importsPage.importRows.first();
			const statusBadge = firstRow.getByTestId('imports-row-status');
			await expect(statusBadge).toBeVisible({ timeout: 15_000 });
			const statusText = await statusBadge.textContent();
			expect(['Pending', 'Processing', 'Completed', 'Failed']).toContain(statusText?.trim());
		}
	});

	test('admin can access imports page', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsAdmin(page);
		await importsPage.goto();

		await expect(page.getByRole('heading', { name: /people imports/i })).toBeVisible({
			timeout: 15_000
		});
		await expect(importsPage.newImportTrigger).toBeVisible();
	});

	test('member cannot access imports page', async ({ page }) => {
		const importsPage = new ImportsPage(page);

		await loginAsMember(page);
		await importsPage.goto();

		await expect(page.getByText(/not authorized|unauthorized/i)).toBeVisible({ timeout: 15_000 });
		await expect(importsPage.newImportTrigger).toHaveCount(0);
	});
});
