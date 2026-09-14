import { describe, expect, it } from 'vitest';
import {
	getPetitionFormSignatureCompletedAnalytics,
	getPetitionPublishingAnalytics,
	getPetitionWhatsAppHandoffAnalytics,
	petitionSignatureTransitionedToComplete,
	petitionTransitionedToPublished
} from './analytics';

const petitionWithSurvey = {
	featureImage: 'https://example.com/private-image.jpg',
	petitionTarget: 'Private petition target',
	settings: {
		survey: {
			collections: [{ questions: [{ title: 'Private question' }] }]
		}
	}
};

describe('petition analytics', () => {
	it('reduces publishing details to privacy-safe feature flags', () => {
		expect(getPetitionPublishingAnalytics(petitionWithSurvey)).toEqual({
			has_image: true,
			has_target: true,
			has_survey: true
		});
	});

	it('counts only a change from unpublished to published as a publication', () => {
		expect(petitionTransitionedToPublished(false, true)).toBe(true);
		expect(petitionTransitionedToPublished(true, true)).toBe(false);
		expect(petitionTransitionedToPublished(true, false)).toBe(false);
		expect(petitionTransitionedToPublished(false, false)).toBe(false);
	});

	it('describes a successful public form signature', () => {
		expect(
			getPetitionFormSignatureCompletedAnalytics({
				redirectLocation: '/page/example/petitions/example/signed?layout=embed',
				baseUrl: new URL('https://example.com/page/example/petitions/example'),
				isAdmin: false,
				petition: petitionWithSurvey,
				layout: 'embed'
			})
		).toEqual({
			signature_channel: 'form',
			has_survey: true,
			layout: 'embed'
		});
	});

	it('excludes administrator previews and unrelated redirects', () => {
		const input = {
			redirectLocation: '/page/example/petitions/example/signed',
			baseUrl: new URL('https://example.com/page/example/petitions/example'),
			petition: petitionWithSurvey,
			layout: 'default' as const
		};

		expect(getPetitionFormSignatureCompletedAnalytics({ ...input, isAdmin: true })).toBeNull();
		expect(
			getPetitionFormSignatureCompletedAnalytics({
				...input,
				isAdmin: false,
				redirectLocation: '/login'
			})
		).toBeNull();
	});

	it('excludes WhatsApp handoffs from administrator previews', () => {
		expect(
			getPetitionWhatsAppHandoffAnalytics({ opened: true, isAdmin: false, layout: 'default' })
		).toEqual({ method: 'direct_link', layout: 'default' });
		expect(
			getPetitionWhatsAppHandoffAnalytics({ opened: true, isAdmin: true, layout: 'default' })
		).toBeNull();
	});

	it('counts only new or restored signatures as WhatsApp completions', () => {
		expect(petitionSignatureTransitionedToComplete()).toBe(true);
		expect(petitionSignatureTransitionedToComplete({ deletedAt: new Date() })).toBe(true);
		expect(petitionSignatureTransitionedToComplete({ deletedAt: null })).toBe(false);
	});
});
