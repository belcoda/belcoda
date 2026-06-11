import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	toYCloudProfileUpdatePayload,
	updateWhatsappBusinessProfileInput,
	whatsappBusinessProfilePatchResponseSchema
} from './profile';

describe('updateWhatsappBusinessProfileInput', () => {
	it('accepts empty strings for clearable profile fields', () => {
		const parsed = v.parse(updateWhatsappBusinessProfileInput, {
			about: 'Hello',
			description: '',
			address: '',
			email: '',
			profilePictureUrl: ''
		});
		expect(parsed.description).toBe('');
		expect(parsed.address).toBe('');
		expect(parsed.email).toBe('');
		expect(parsed.profilePictureUrl).toBe('');
	});

	it('rejects empty about', () => {
		expect(() =>
			v.parse(updateWhatsappBusinessProfileInput, {
				about: ''
			})
		).toThrow();
	});
});

describe('whatsappBusinessProfilePatchResponseSchema', () => {
	it('rejects an empty PATCH success body', () => {
		const result = v.safeParse(whatsappBusinessProfilePatchResponseSchema, {});
		expect(result.success).toBe(false);
	});

	it('accepts a PATCH body that includes about', () => {
		const result = v.safeParse(whatsappBusinessProfilePatchResponseSchema, {
			about: 'Hello',
			verifiedName: 'Acme'
		});
		expect(result.success).toBe(true);
	});
});

describe('toYCloudProfileUpdatePayload', () => {
	it('preserves empty strings for YCloud clearing', () => {
		const payload = toYCloudProfileUpdatePayload({
			description: '',
			address: '123 Main St'
		});
		expect(payload).toEqual({
			description: '',
			address: '123 Main St'
		});
	});
});
