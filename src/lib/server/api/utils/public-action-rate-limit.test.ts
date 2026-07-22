import { beforeEach, describe, expect, it } from 'vitest';
import {
	checkPublicActionRateLimit,
	clearPublicActionRateLimitForTest
} from './public-action-rate-limit';

const baseInput = {
	action: 'event_signup' as const,
	organizationId: 'org_123',
	resourceId: 'event_123',
	subject: '203.0.113.10',
	maxRequests: 2
};

describe('checkPublicActionRateLimit', () => {
	beforeEach(() => {
		clearPublicActionRateLimitForTest();
	});

	it('allows requests until the bucket reaches its limit', () => {
		expect(checkPublicActionRateLimit(baseInput)).toEqual({ limited: false });
		expect(checkPublicActionRateLimit(baseInput)).toEqual({ limited: false });

		expect(checkPublicActionRateLimit(baseInput)).toMatchObject({
			limited: true,
			retryAfterSeconds: expect.any(Number)
		});
	});

	it('keeps different resources in separate buckets', () => {
		checkPublicActionRateLimit(baseInput);
		checkPublicActionRateLimit(baseInput);

		expect(
			checkPublicActionRateLimit({
				...baseInput,
				resourceId: 'event_456'
			})
		).toEqual({ limited: false });
	});

	it('keeps different subjects in separate buckets', () => {
		checkPublicActionRateLimit(baseInput);
		checkPublicActionRateLimit(baseInput);

		expect(
			checkPublicActionRateLimit({
				...baseInput,
				subject: '203.0.113.11'
			})
		).toEqual({ limited: false });
	});
});
