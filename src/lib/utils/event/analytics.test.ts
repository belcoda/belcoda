import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	eventHasSurvey,
	getEventPublishingAnalytics,
	trackEventDeclineCompleted,
	trackEventPublished,
	trackEventSignupCompleted,
	trackEventWhatsAppHandoffOpened
} from './analytics';

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

describe('public event analytics', () => {
	it('detects a survey only when at least one question exists', () => {
		expect(
			eventHasSurvey({
				settings: {
					survey: {
						collections: [{ questions: [] }, { questions: [{ type: 'text' }] }]
					}
				}
			})
		).toBe(true);
		expect(eventHasSurvey({})).toBe(false);
	});

	it('defines the completed form signup event', () => {
		const track = vi.fn();
		vi.stubGlobal('window', { umami: { track } });

		trackEventSignupCompleted({
			signup_channel: 'form',
			has_survey: true,
			layout: 'embed'
		});

		expect(track).toHaveBeenCalledWith('event_signup_completed', {
			signup_channel: 'form',
			has_survey: true,
			layout: 'embed'
		});
	});

	it('defines decline completion separately from signup completion', () => {
		const track = vi.fn();
		vi.stubGlobal('window', { umami: { track } });

		trackEventDeclineCompleted({
			response_channel: 'form',
			has_survey: false,
			layout: 'default'
		});

		expect(track).toHaveBeenCalledWith('event_decline_completed', {
			response_channel: 'form',
			has_survey: false,
			layout: 'default'
		});
	});

	it('defines only a direct-link WhatsApp handoff event', () => {
		const track = vi.fn();
		vi.stubGlobal('window', { umami: { track } });

		trackEventWhatsAppHandoffOpened({
			method: 'direct_link',
			layout: 'default'
		});

		expect(track).toHaveBeenCalledWith('event_whatsapp_handoff_opened', {
			method: 'direct_link',
			layout: 'default'
		});
	});
});
