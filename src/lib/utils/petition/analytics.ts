import { trackAnalyticsEvent } from '$lib/utils/analytics';

export type PetitionAnalyticsSource = {
	featureImage?: string | null;
	petitionTarget?: string | null;
	settings?: {
		survey?: {
			collections?: Array<{
				questions?: unknown[];
			}>;
		} | null;
	} | null;
};

export type PublicPetitionLayout = 'default' | 'embed';

export const petitionAnalyticsEventNames = {
	published: 'petition_published',
	signatureCompleted: 'petition_signature_completed',
	whatsAppHandoffOpened: 'petition_whatsapp_handoff_opened'
} as const;

export type PetitionFormSignatureCompletedAnalyticsData = {
	signature_channel: 'form';
	has_survey: boolean;
	layout: PublicPetitionLayout;
};

export type PetitionWhatsAppSignatureCompletedAnalyticsData = {
	signature_channel: 'whatsapp';
	has_survey: boolean;
};

export type PetitionWhatsAppHandoffAnalyticsData = {
	method: 'direct_link';
	layout: PublicPetitionLayout;
};

export function petitionHasSurvey(petition: PetitionAnalyticsSource): boolean {
	return Boolean(
		petition.settings?.survey?.collections?.some((collection) => collection.questions?.length)
	);
}

export function getPetitionPublishingAnalytics(petition: PetitionAnalyticsSource) {
	return {
		has_image: Boolean(petition.featureImage),
		has_target: Boolean(petition.petitionTarget),
		has_survey: petitionHasSurvey(petition)
	};
}

export function trackPetitionPublished(petition: PetitionAnalyticsSource): void {
	trackAnalyticsEvent(
		petitionAnalyticsEventNames.published,
		getPetitionPublishingAnalytics(petition)
	);
}

export function trackPetitionSignatureCompleted(
	data:
		| PetitionFormSignatureCompletedAnalyticsData
		| PetitionWhatsAppSignatureCompletedAnalyticsData
): void {
	trackAnalyticsEvent(petitionAnalyticsEventNames.signatureCompleted, data);
}

export function trackPetitionWhatsAppHandoffOpened(
	data: PetitionWhatsAppHandoffAnalyticsData
): void {
	trackAnalyticsEvent(petitionAnalyticsEventNames.whatsAppHandoffOpened, data);
}
