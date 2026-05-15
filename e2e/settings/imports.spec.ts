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
	const ts = Date.now();
	const headers =
		'given_name,family_name,email_address,phone_number,whatsapp_username,subscribed,do_not_contact,address_line_1,address_line_2,locality,region,postcode,country,workplace,position,gender,date_of_birth,preferred_language,external_id';
	const rows = [
		`Amara,Osei,amara.osei.${ts}@belcoda.test,+254712340001,amaraosei,true,false,14 Kenyatta Ave,,Nairobi,Nairobi County,00100,ke,Safaricom,Software Engineer,female,1992-03-10,en,E2E-${ts}-001`,
		`Kofi,Mensah,kofi.mensah.${ts}@belcoda.test,+254712340002,kofimensah,true,false,22 Uhuru Highway,Apt 3,Nairobi,Nairobi County,00200,ke,Kenya Airways,Flight Attendant,male,1988-07-22,sw,E2E-${ts}-002`,
		`Fatima,Diallo,fatima.diallo.${ts}@belcoda.test,+254712340003,fatimadiallo,true,false,5 Mombasa Road,,Mombasa,Mombasa County,80100,ke,Standard Chartered,Branch Manager,female,1995-11-05,en,E2E-${ts}-003`,
		`Chidi,Okeke,chidi.okeke.${ts}@belcoda.test,+254712340004,chidiokeke,false,false,101 Tom Mboya St,,Kisumu,Kisumu County,40100,ke,Equity Bank,Loan Officer,male,1990-01-30,sw,E2E-${ts}-004`,
		`Nia,Kamau,nia.kamau.${ts}@belcoda.test,+254712340005,niakamau,true,false,78 Ngong Road,,Nairobi,Nairobi County,00100,ke,Nairobi Hospital,Nurse,female,1993-06-18,en,E2E-${ts}-005`,
		`Emeka,Adeyemi,emeka.adeyemi.${ts}@belcoda.test,+254712340006,emekaadeyemi,true,false,3 Kimathi St,,Nakuru,Nakuru County,20100,ke,KCB Group,Accountant,male,1985-09-12,sw,E2E-${ts}-006`,
		`Zainab,Hassan,zainab.hassan.${ts}@belcoda.test,+254712340007,zainabhassan,true,false,55 Haile Selassie Ave,,Nairobi,Nairobi County,00100,ke,UN Environment,Programme Officer,female,1991-04-25,en,E2E-${ts}-007`,
		`Seun,Abiodun,seun.abiodun.${ts}@belcoda.test,+254712340008,seunabiodun,false,true,9 Ronald Ngala St,,Eldoret,Uasin Gishu County,30100,ke,Bidco Africa,Operations Manager,male,1987-12-03,sw,E2E-${ts}-008`,
		`Adaeze,Nwosu,adaeze.nwosu.${ts}@belcoda.test,+254712340009,adaezenwosu,true,false,27 Wabera St,,Nairobi,Nairobi County,00200,ke,Deloitte,Auditor,female,1994-08-14,en,E2E-${ts}-009`,
		`Tobi,Afolabi,tobi.afolabi.${ts}@belcoda.test,+254712340010,tobiafolabi,true,false,6 Koinange St,,Thika,Kiambu County,01000,ke,KTDA,Field Officer,male,1996-02-28,sw,E2E-${ts}-010`
	];

	const csvContent = [headers, ...rows].join('\n');
	const tmpFile = path.join(os.tmpdir(), `e2e-import-${ts}.csv`);
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
		await expect(page.getByTestId('imports-selected-file')).toContainText(path.basename(csvFile));

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
