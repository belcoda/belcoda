import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { EventSignupsPage } from '../pages/events/event-signups.page';
import { createApiClient, type ApiClient } from './api-client';
import { ensureOwnerApiKey } from './api-key.helper';
import { expectValidationError, loginAsOwner } from './test-helpers';

type EventApi = { id: string; title: string };
type PersonApi = { id: string; givenName: string; familyName: string };
type EventSignupApi = {
	id: string;
	eventId: string;
	personId: string;
	status: string;
	details: { channel: { type: string } };
};

// `createEventRest` validates dates with valibot's `isoDateTime`, which expects
// `YYYY-MM-DDTHH:MM` (no seconds/timezone). Strip the milliseconds + Z that
// `Date.toISOString()` emits.
function toApiDateTime(d: Date): string {
	return d.toISOString().slice(0, 16);
}

function buildEventBody() {
	const now = Date.now();
	return {
		title: `API Signup Event ${now}`,
		slug: `api-signup-event-${now}`,
		shortDescription: 'Created via REST API for e2e signup testing.',
		description: null,
		startsAt: toApiDateTime(new Date(now + 7 * 24 * 60 * 60 * 1000)),
		endsAt: toApiDateTime(new Date(now + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)),
		country: 'US',
		timezone: 'America/New_York',
		published: true,
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
		}
	};
}

test.describe.serial('API v1 Event Signup', () => {
	let apiKey: string;
	const ids = {
		eventId: '',
		personId: '',
		givenName: '',
		familyName: '',
		signupId: ''
	};

	function makeClient(request: import('@playwright/test').APIRequestContext): ApiClient {
		return createApiClient(request, apiKey);
	}

	test.beforeAll(async ({ browser }) => {
		({ apiKey } = await ensureOwnerApiKey(browser));
	});

	test('seed: create an event and a person via API for signup tests', async ({ request }) => {
		const client = makeClient(request);
		const suffix = Date.now();
		ids.givenName = 'EventSignupApi';
		ids.familyName = `Person ${suffix}`;

		const eventResp = await client.post<EventApi>('/api/v1/events', buildEventBody());
		expect(eventResp.status).toBe(200);
		ids.eventId = eventResp.body.id;
		expect(ids.eventId).not.toBe('');

		const personResp = await client.post<PersonApi>('/api/v1/person', {
			givenName: ids.givenName,
			familyName: ids.familyName,
			emailAddress: `event-signup-api-${suffix}@belcoda.test`,
			country: 'US',
			preferredLanguage: 'en'
		});
		expect(personResp.status).toBe(200);
		ids.personId = personResp.body.id;
		expect(ids.personId).not.toBe('');
	});

	test('POST /api/v1/events/:eventId/signups creates a visible signup row', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<EventSignupApi>(`/api/v1/events/${ids.eventId}/signups`, {
			personId: ids.personId,
			details: { channel: { type: 'adminPanel' } },
			status: 'signup'
		});
		expect(response.status).toBe(200);
		expect(response.body.eventId).toBe(ids.eventId);
		expect(response.body.personId).toBe(ids.personId);
		expect(response.body.status).toBe('signup');
		ids.signupId = response.body.id;
		expect(ids.signupId).not.toBe('');

		await loginAsOwner(page);
		await page.goto(`/events/${ids.eventId}`);
		const signupsPage = new EventSignupsPage(page);
		await signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(signupsPage.signupTable).toContainText(ids.givenName, { timeout: 15_000 });
		await expect(signupsPage.signupTable).toContainText(ids.familyName);
	});

	test('GET /api/v1/events/:eventId/signups/:signupId reflects the UI signup', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.get<EventSignupApi>(
			`/api/v1/events/${ids.eventId}/signups/${ids.signupId}`
		);
		expect(response.status).toBe(200);
		expect(response.body.id).toBe(ids.signupId);
		expect(response.body.eventId).toBe(ids.eventId);
		expect(response.body.personId).toBe(ids.personId);
		expect(response.body.status).toBe('signup');
	});

	test('GET /api/v1/events/:eventId/signups lists the new signup', async ({ request }) => {
		const client = makeClient(request);
		const response = await client.get<{ metadata: { count: number }; data: EventSignupApi[] }>(
			`/api/v1/events/${ids.eventId}/signups`
		);
		expect(response.status).toBe(200);
		expect(response.body.metadata.count).toBeGreaterThan(0);
		expect(response.body.data.some((s) => s.id === ids.signupId)).toBe(true);
	});

	test('PUT /api/v1/events/:eventId/signups/:signupId updates the visible status badge', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.put<EventSignupApi>(
			`/api/v1/events/${ids.eventId}/signups/${ids.signupId}`,
			{ status: 'attended' }
		);
		expect(response.status).toBe(200);
		expect(response.body.status).toBe('attended');

		await loginAsOwner(page);
		await page.goto(`/events/${ids.eventId}`);
		const signupsPage = new EventSignupsPage(page);
		await signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 });
		await expect(signupsPage.firstAttendedBadge).toBeVisible({ timeout: 15_000 });
	});

	test('DELETE /api/v1/events/:eventId/signups/:signupId removes the signup from the list', async ({
		page,
		request
	}) => {
		const client = makeClient(request);
		const response = await client.delete(`/api/v1/events/${ids.eventId}/signups/${ids.signupId}`);
		expect(response.status).toBe(204);

		await loginAsOwner(page);
		await page.goto(`/events/${ids.eventId}`);
		const signupsPage = new EventSignupsPage(page);
		// After deletion, the page either shows the signup table (if other signups remain)
		// or an empty state ("No signups found"). Wait for either to render, then assert
		// that the deleted signup's familyName is no longer present anywhere on the page.
		const emptyState = page.getByText('No signups found').first();
		await Promise.race([
			signupsPage.signupTable.waitFor({ state: 'visible', timeout: 15_000 }),
			emptyState.waitFor({ state: 'visible', timeout: 15_000 })
		]);
		await expect(page.locator('main').first()).not.toContainText(ids.familyName, {
			timeout: 15_000
		});
	});

	test('GET /api/v1/events/:eventId/signups/:signupId for a different event returns 404', async ({
		request
	}) => {
		const client = makeClient(request);
		// Create a sibling event and a fresh signup, then read with mismatched eventId.
		const otherEvent = await client.post<EventApi>('/api/v1/events', buildEventBody());
		expect(otherEvent.status).toBe(200);
		const otherEventId = otherEvent.body.id;

		const fresh = await client.post<EventSignupApi>(`/api/v1/events/${ids.eventId}/signups`, {
			personId: ids.personId,
			details: { channel: { type: 'adminPanel' } },
			status: 'signup'
		});
		expect(fresh.status).toBe(200);

		const response = await client.get<{ message: string }>(
			`/api/v1/events/${otherEventId}/signups/${fresh.body.id}`
		);
		expect(response.status).toBe(404);
	});

	test('POST /api/v1/events/:eventId/signups with missing required fields returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		const response = await client.post<{ error: string }>(`/api/v1/events/${ids.eventId}/signups`, {
			personId: ids.personId
		});
		expectValidationError(response);
	});

	test('PUT /api/v1/events/:eventId/signups/:signupId with invalid status returns a validation error', async ({
		request
	}) => {
		const client = makeClient(request);
		// Create a fresh signup for this update attempt.
		const fresh = await client.post<EventSignupApi>(`/api/v1/events/${ids.eventId}/signups`, {
			personId: ids.personId,
			details: { channel: { type: 'adminPanel' } },
			status: 'signup'
		});
		expect(fresh.status).toBe(200);

		const response = await client.put<{ error: string }>(
			`/api/v1/events/${ids.eventId}/signups/${fresh.body.id}`,
			{ status: 'definitely-not-a-status' }
		);
		expectValidationError(response);
	});
});
