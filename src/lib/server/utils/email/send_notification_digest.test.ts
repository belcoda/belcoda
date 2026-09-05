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

	it('anchors the daily date to the organization time zone near midnight', () => {
		// The same instant lands on different calendar days depending on the zone.
		const now = new Date('2026-09-03T23:30:00Z');
		expect(formatDigestPeriod('en', 'daily', now, 'America/New_York')).toBe('Sep 3, 2026');
		expect(formatDigestPeriod('en', 'daily', now, 'Asia/Kolkata')).toBe('Sep 4, 2026');
	});

	it('anchors the weekly range and its year boundary to the time zone', () => {
		// 2026-01-01T02:00Z is still Dec 31, 2025 in New York, shifting the range back a year.
		const now = new Date('2026-01-01T02:00:00Z');
		expect(formatDigestPeriod('en', 'weekly', now, 'America/New_York')).toBe(
			'Dec 25 – Dec 31, 2025'
		);
	});
});
