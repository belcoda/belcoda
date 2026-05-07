import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { EventListPage } from '../pages/events/event-list.page';
import { EventEditPage } from '../pages/events/event-edit.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type EventApi = {
	id: string;
	title: string;
	slug: string;
	shortDescription: string;
	startsAt: string;
	endsAt: string;
	country: string;
	timezone: string;
	published: boolean;
};

// `createEventRest` validates dates with valibot's `isoDateTime`, which expects
// a strict `YYYY-MM-DDTHH:MM` (no seconds, no timezone suffix). `Date.toISOString()`
// is not accepted.
function toApiDateTime(d: Date): string {
	return d.toISOString();
}

function buildEventBody(overrides: Record<string, unknown> = {}) {
	const now = Date.now();
	const startsAt = toApiDateTime(new Date(now + 7 * 24 * 60 * 60 * 1000));
	const endsAt = toApiDateTime(new Date(now + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000));
	return {
		title: `API Event ${now}`,
		slug: `api-event-${now}`,
		shortDescription: 'Created via REST API for e2e testing.',
		description: null,
		startsAt,
		endsAt,
		country: 'US',
		timezone: 'America/New_York',
		published: false,
		settings: {
			displayTimezone: true,
			survey: {
				schemaVersion: '1.0.0',
				collections: [
					{
						id: randomUUID(),
						title: 'Event information',
						description: null,
						questions: [],
						nextCollectionId: null,
						previousCollectionId: null
					}
				]
			}
		},
		...overrides
	};
}

test.describe.serial('API v1 Event', () => {
	let apiKey: string;
	const ids = {
		eventId: '',
		title: '',
		slug: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('POST /api/v1/events creates an event visible in the events list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const body = buildEventBody();
		ids.title = body.title as string;
		ids.slug = body.slug as string;

		const response = await client.post<EventApi>('/api/v1/events', body);
		expect(response.status).toBe(200);
		expect(response.body.title).toBe(ids.title);
		expect(response.body.slug).toBe(ids.slug);
		expect(response.body.published).toBe(false);
		ids.eventId = response.body.id;
		expect(ids.eventId).not.toBe('');

		const eventList = new EventListPage(page);
		await loginAsOwner(page);
		await eventList.goto();
		await expect(page.getByText(ids.title)).toBeVisible({ timeout: 15_000 });
	});

	test('GET /api/v1/events/:eventId matches the title shown on the edit page', async ({
		page,
		request
	}) => {
		const client = makeClient(request);

		const editPage = new EventEditPage(page);
		await loginAsOwner(page);
		await page.goto(`/events/${ids.eventId}/edit`);
		await editPage.waitForForm();
		const uiTitle = await editPage.titleInput.inputValue();

		const response = await client.get<EventApi>(`/api/v1/events/${ids.eventId}`);
		expect(response.status).toBe(200);
		expect(response.body.title).toBe(uiTitle);
		expect(response.body.id).toBe(ids.eventId);
	});

	test('GET /api/v1/events lists the event', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: EventApi[] }>(
			'/api/v1/events'
		);
		expect(response.status).toBe(200);
		expect(response.body.data.some((e) => e.id === ids.eventId)).toBe(true);
	});

	test('PUT /api/v1/events/:eventId updates the title visible in the UI', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const newTitle = `${ids.title} (api-edited)`;

		const response = await client.put<EventApi>(`/api/v1/events/${ids.eventId}`, {
			title: newTitle
		});
		expect(response.status).toBe(200);
		expect(response.body.title).toBe(newTitle);
		ids.title = newTitle;

		const editPage = new EventEditPage(page);
		await loginAsOwner(page);
		await page.goto(`/events/${ids.eventId}/edit`);
		await editPage.waitForForm();
		await expect(editPage.titleInput).toHaveValue(newTitle, { timeout: 15_000 });
	});

	test('DELETE /api/v1/events/:eventId removes the event from the list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/events/${ids.eventId}`);
		expect(response.status).toBe(204);

		const eventList = new EventListPage(page);
		await loginAsOwner(page);
		await eventList.goto();
		await expect(page.getByText(ids.title)).toHaveCount(0, { timeout: 15_000 });
	});

	test('GET /api/v1/events/:eventId returns 404 for a deleted event', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ message: string }>(`/api/v1/events/${ids.eventId}`);
		expect(response.status).toBe(404);
	});

	test('POST /api/v1/events with missing required fields returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>('/api/v1/events', {
			// Missing title, slug, shortDescription, startsAt, endsAt, country, timezone, published, settings.
			country: 'US'
		});
		expectValidationError(response);
	});

	test('POST /api/v1/events with an invalid country returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(
			'/api/v1/events',
			buildEventBody({ country: 'NOT_A_COUNTRY' })
		);
		expectValidationError(response);
	});

	test('POST /api/v1/events with invalid JSON returns 400', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.postRaw<{ message?: string; error?: string }>(
			'/api/v1/events',
			'{not valid'
		);
		expect(response.status).toBe(400);
	});
});
