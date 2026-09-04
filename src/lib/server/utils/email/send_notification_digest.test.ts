import { describe, expect, it } from 'vitest';
import { formatDigestPeriod } from './send_notification_digest';

describe('formatDigestPeriod', () => {
	it('keeps the compact range for dates in the same year', () => {
		const now = new Date('2026-08-10T12:00:00Z');
		expect(formatDigestPeriod('en', 'weekly', now)).toBe('Aug 4 – Aug 10, 2026');
	});

	it('includes both years when the range crosses a year boundary', () => {
		const now = new Date('2026-01-02T12:00:00Z');
		expect(formatDigestPeriod('en', 'weekly', now)).toBe('Dec 27, 2025 – Jan 2, 2026');
	});
});
