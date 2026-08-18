import { and, eq, or } from 'drizzle-orm';
import { event, member, user, whatsappAccount } from '$lib/schema/drizzle';
import {
	inferMemberOnboardingPatch,
	type MemberOnboardingInferenceFacts
} from '$lib/schema/member/onboarding';
import { memberOnboardingIsComplete, resolveMemberSettings } from '$lib/schema/member/settings';
import { drizzle } from '$lib/server/db';
import { updateMemberOnboarding } from '$lib/server/api/data/organization/member';

export async function inferAndPersistMemberOnboarding({
	userId,
	organizationId
}: {
	userId: string;
	organizationId: string;
}) {
	const [membership] = await drizzle
		.select({
			settings: member.settings,
			preferredLanguage: user.preferredLanguage
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
		.limit(1);

	if (!membership) {
		throw new Error('Member not found');
	}
	const settings = resolveMemberSettings(membership.settings);

	if (memberOnboardingIsComplete(settings.onboarding)) {
		return settings;
	}

	const [linkedWhatsappAccount, existingEvent, publishedEvent] = await Promise.all([
		drizzle
			.select({ id: whatsappAccount.id })
			.from(whatsappAccount)
			.where(
				or(
					and(
						eq(whatsappAccount.scope, 'organization'),
						eq(whatsappAccount.referenceId, organizationId)
					),
					and(eq(whatsappAccount.scope, 'user'), eq(whatsappAccount.referenceId, userId))
				)
			)
			.limit(1),
		drizzle
			.select({ id: event.id })
			.from(event)
			.where(eq(event.organizationId, organizationId))
			.limit(1),
		drizzle
			.select({ id: event.id })
			.from(event)
			.where(and(eq(event.organizationId, organizationId), eq(event.published, true)))
			.limit(1)
	]);

	// These are historical achievements. Soft-deleted or archived records still prove
	// that the corresponding onboarding step was completed and must not reopen it.
	const facts: MemberOnboardingInferenceFacts = {
		language: membership.preferredLanguage !== null,
		whatsappAccount: linkedWhatsappAccount.length > 0,
		event: existingEvent.length > 0,
		publishEvent: publishedEvent.length > 0
	};
	const onboardingPatch = inferMemberOnboardingPatch({
		settings: settings.onboarding,
		facts
	});

	if (Object.keys(onboardingPatch).length > 0) {
		await updateMemberOnboarding({ userId, organizationId, onboarding: onboardingPatch });
	}

	return {
		...settings,
		onboarding: {
			...settings.onboarding,
			...onboardingPatch
		}
	};
}
