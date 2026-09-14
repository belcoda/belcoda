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

type PetitionWhatsAppHandoffAnalyticsInput = {
	opened: boolean;
	isAdmin: boolean;
	layout: PublicPetitionLayout;
};

type PetitionFormSignatureAnalyticsInput = {
	transitionedToComplete: boolean;
	isAdmin: boolean;
	petition: PetitionAnalyticsSource;
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

export function petitionTransitionedToPublished(
	previouslyPublished: boolean,
	published: boolean
): boolean {
	return !previouslyPublished && published;
}

export function getPetitionFormSignatureCompletedAnalytics({
	transitionedToComplete,
	isAdmin,
	petition,
	layout
}: PetitionFormSignatureAnalyticsInput): PetitionFormSignatureCompletedAnalyticsData | null {
	if (!transitionedToComplete || isAdmin) return null;

	return {
		signature_channel: 'form',
		has_survey: petitionHasSurvey(petition),
		layout
	};
}

export function petitionSignatureTransitionedToComplete(existingSignature?: {
	deletedAt?: Date | null;
}): boolean {
	return !existingSignature || existingSignature.deletedAt != null;
}

export function getPetitionWhatsAppHandoffAnalytics({
	opened,
	isAdmin,
	layout
}: PetitionWhatsAppHandoffAnalyticsInput): PetitionWhatsAppHandoffAnalyticsData | null {
	if (!opened || isAdmin) return null;

	return {
		method: 'direct_link',
		layout
	};
}

export function trackPetitionWhatsAppHandoffOpened(
	data: PetitionWhatsAppHandoffAnalyticsData
): void {
	trackAnalyticsEvent(petitionAnalyticsEventNames.whatsAppHandoffOpened, data);
}
