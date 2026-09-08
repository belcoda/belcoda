import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEventPublishingAnalytics, trackEventPublished } from './analytics';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('getEventPublishingAnalytics', () => {
	it('reports an event with an image, location, and survey', () => {
		expect(
			getEventPublishingAnalytics({
				featureImage: 'https://example.com/event.jpg',
				onlineLink: null,
				addressLine1: '1 Example Street',
				settings: {
					survey: {
						collections: [{ questions: [{ type: 'text' }] }]
					}
				}
			})
		).toEqual({
			has_image: true,
			has_location: true,
			has_survey: true
		});
	});

	it('reports an event without optional publishing features', () => {
		expect(
			getEventPublishingAnalytics({
				featureImage: null,
				onlineLink: null,
				addressLine1: null,
				settings: {
					survey: {
						collections: [{ questions: [] }]
					}
				}
			})
		).toEqual({
			has_image: false,
			has_location: false,
			has_survey: false
		});
	});

	it('counts an online event as having a location', () => {
		expect(
			getEventPublishingAnalytics({
				onlineLink: 'https://meet.example.com/event'
			})
		).toMatchObject({ has_location: true });
	});

	it('records the event name and privacy-safe properties with Umami', () => {
		const track = vi.fn();
		vi.stubGlobal('window', { umami: { track } });

		trackEventPublished({
			featureImage: null,
			onlineLink: 'https://meet.example.com/event',
			settings: {
				survey: {
					collections: [{ questions: [] }]
				}
			}
		});

		expect(track).toHaveBeenCalledWith('event_published', {
			has_image: false,
			has_location: true,
			has_survey: false
		});
	});
});
