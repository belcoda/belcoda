import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WhatsappBusinessProfile } from '$lib/schema/whatsapp/ycloud/profile';

vi.mock('$env/dynamic/private', () => ({
	env: {
		YCLOUD_API_URL: 'https://api.ycloud.test',
		YCLOUD_API_KEY: 'test-api-key',
		MOCK_EXTERNAL_SERVICES: 'false',
		NODE_ENV: 'test'
	}
}));

const { updateWhatsappPhoneNumberProfile } = await import('./ycloud_api');

const wabaId = 'waba-123';
const phoneNumber = '+15551234567';

const fullProfile: WhatsappBusinessProfile = {
	about: 'About us',
	address: '123 Main St',
	description: 'A great business',
	email: 'contact@example.com',
	profilePictureUrl: 'https://example.com/photo.jpg',
	vertical: 'OTHER',
	websites: ['https://example.com'],
	verifiedName: 'Example Business',
	nameStatus: 'APPROVED'
};

function profileUrl() {
	return `https://api.ycloud.test/whatsapp/phoneNumbers/${wabaId}/${encodeURIComponent(phoneNumber)}/profile`;
}

describe('updateWhatsappPhoneNumberProfile', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('refetches profile when PATCH returns an empty 200 body', async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockImplementation(async (_url, init) => {
			if (init?.method === 'PATCH') {
				return new Response('', { status: 200 });
			}
			return new Response(JSON.stringify(fullProfile), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		});

		const result = await updateWhatsappPhoneNumberProfile({
			wabaId,
			phoneNumber,
			profile: { about: 'About us' }
		});

		expect(result).toEqual(fullProfile);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			profileUrl(),
			expect.objectContaining({ method: 'PATCH' })
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			profileUrl(),
			expect.objectContaining({ method: 'GET' })
		);
	});

	it('refetches profile when PATCH body has unknown fields only', async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockImplementation(async (_url, init) => {
			if (init?.method === 'PATCH') {
				return new Response(JSON.stringify({ newName: 'Pending Name' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			return new Response(JSON.stringify(fullProfile), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		});

		const result = await updateWhatsappPhoneNumberProfile({
			wabaId,
			phoneNumber,
			profile: { about: 'About us' }
		});

		expect(result).toEqual(fullProfile);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns PATCH body without refetch when it is a usable profile', async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockImplementation(async (_url, init) => {
			if (init?.method === 'PATCH') {
				return new Response(JSON.stringify(fullProfile), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			throw new Error('GET should not be called when PATCH returns a usable profile');
		});

		const result = await updateWhatsappPhoneNumberProfile({
			wabaId,
			phoneNumber,
			profile: { about: 'About us' }
		});

		expect(result).toEqual(fullProfile);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
