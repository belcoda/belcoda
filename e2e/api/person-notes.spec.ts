import { expect, test, type Page } from '@playwright/test';
import { PersonCreatePage } from '../pages/community/person-create.page';
import { PersonProfilePage } from '../pages/community/person-profile.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type PersonNoteApi = {
	id: string;
	personId: string;
	note: string;
	userId: string;
};

async function openNotesDrawer(page: Page) {
	await page.getByRole('button', { name: /^Notes$/i }).click();
	await page.getByTestId('person-notes-list').waitFor({ state: 'visible', timeout: 10_000 });
}

test.describe.serial('API v1 Person Notes', () => {
	let apiKey: string;
	let ownerUserId: string;
	const ids = {
		personId: '',
		personPath: '',
		noteId: '',
		noteText: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey, ownerUserId } = await ensureOwnerApiKey(browser));
	});

	test('owner creates a person to attach notes to', async ({ page }) => {
		const suffix = Date.now();
		const personCreate = new PersonCreatePage(page);

		await loginAsOwner(page);
		await personCreate.goto();
		await personCreate.fillRequiredFields(
			'NotesApi',
			`Subject ${suffix}`,
			`notes-api-${suffix}@belcoda.test`
		);
		await personCreate.submit();

		await expect(page).toHaveURL(
			/\/community\/[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}/i
		);
		ids.personPath = new URL(page.url()).pathname;
		ids.personId = ids.personPath.split('/')[2] ?? '';
		expect(ids.personId).not.toBe('');
	});

	test('GET /api/v1/person/:personId/notes returns an empty list initially', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: PersonNoteApi[] }>(
			`/api/v1/person/${ids.personId}/notes`
		);
		expect(response.status).toBe(200);
		expect(response.body.metadata.count).toBe(0);
		expect(response.body.data).toEqual([]);
	});

	test('POST /api/v1/person/:personId/notes creates a note that shows in the UI drawer', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		ids.noteText = `API note created at ${Date.now()}`;

		const response = await client.post<PersonNoteApi>(`/api/v1/person/${ids.personId}/notes`, {
			note: ids.noteText,
			userId: ownerUserId
		});
		expect(response.status).toBe(200);
		expect(response.body.note).toBe(ids.noteText);
		expect(response.body.personId).toBe(ids.personId);
		expect(response.body.userId).toBe(ownerUserId);
		ids.noteId = response.body.id;
		expect(ids.noteId).not.toBe('');

		await loginAsOwner(page);
		await page.goto(ids.personPath);
		await openNotesDrawer(page);

		const noteItem = page.locator(`[data-testid="person-note"][data-note-id="${ids.noteId}"]`);
		await expect(noteItem).toBeVisible({ timeout: 15_000 });
		await expect(noteItem.getByTestId('person-note-text')).toHaveText(ids.noteText);
	});

	test('GET /api/v1/person/:personId/notes lists the new note', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: PersonNoteApi[] }>(
			`/api/v1/person/${ids.personId}/notes`
		);
		expect(response.status).toBe(200);
		expect(response.body.metadata.count).toBeGreaterThan(0);
		const found = response.body.data.find((n) => n.id === ids.noteId);
		expect(found).toBeDefined();
		expect(found?.note).toBe(ids.noteText);
	});

	test('PUT /api/v1/person/:personId/notes/:noteId updates the visible note text', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const updatedText = `API note updated at ${Date.now()}`;

		const response = await client.put<PersonNoteApi>(
			`/api/v1/person/${ids.personId}/notes/${ids.noteId}`,
			{ note: updatedText }
		);
		expect(response.status).toBe(200);
		expect(response.body.note).toBe(updatedText);
		ids.noteText = updatedText;

		await loginAsOwner(page);
		await page.goto(ids.personPath);
		await openNotesDrawer(page);

		const noteItem = page.locator(`[data-testid="person-note"][data-note-id="${ids.noteId}"]`);
		await expect(noteItem.getByTestId('person-note-text')).toHaveText(updatedText, {
			timeout: 15_000
		});
	});

	test('DELETE /api/v1/person/:personId/notes/:noteId removes the note from the drawer', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/person/${ids.personId}/notes/${ids.noteId}`);
		expect(response.status).toBe(204);

		await loginAsOwner(page);
		await page.goto(ids.personPath);
		await openNotesDrawer(page);

		await expect(
			page.locator(`[data-testid="person-note"][data-note-id="${ids.noteId}"]`)
		).toHaveCount(0, { timeout: 15_000 });
	});

	test('POST /api/v1/person/:personId/notes with missing userId returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(`/api/v1/person/${ids.personId}/notes`, {
			note: 'Missing userId'
		});
		expectValidationError(response);
	});

	test('PUT /api/v1/person/:personId/notes/:noteId with missing note field returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		// Create a fresh note since the prior one was deleted.
		const created = await client.post<PersonNoteApi>(`/api/v1/person/${ids.personId}/notes`, {
			note: 'For invalid PUT test',
			userId: ownerUserId
		});
		expect(created.status).toBe(200);

		const response = await client.put<{ error: string }>(
			`/api/v1/person/${ids.personId}/notes/${created.body.id}`,
			{ wrongField: 'still wrong' }
		);
		expectValidationError(response);
	});
});
