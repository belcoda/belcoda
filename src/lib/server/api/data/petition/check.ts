import { drizzle } from '$lib/server/db';
import { eq, isNull, and, not } from 'drizzle-orm';
import { petition, actionCode } from '$lib/schema/drizzle';
export async function checkPetitionSlug({
	slug,
	organizationId,
	excludePetitionId
}: {
	slug: string;
	organizationId: string;
	excludePetitionId?: string;
}) {
	const where = [
		eq(petition.organizationId, organizationId),
		isNull(petition.deletedAt),
		eq(petition.slug, slug)
	];
	if (excludePetitionId) {
		where.push(not(eq(petition.id, excludePetitionId)));
	}
	const result = await drizzle.query.petition.findFirst({
		where: and(...where)
	});
	return result ? true : false;
}
export async function checkPetitionTitle({
	title,
	organizationId,
	excludePetitionId
}: {
	title: string;
	organizationId: string;
	excludePetitionId?: string;
}) {
	const where = [
		eq(petition.organizationId, organizationId),
		isNull(petition.deletedAt),
		eq(petition.title, title)
	];
	if (excludePetitionId) {
		where.push(not(eq(petition.id, excludePetitionId)));
	}
	const result = await drizzle.query.petition.findFirst({
		where: and(...where)
	});
	return result ? true : false;
}

export async function _getPetitionActionCodeUnsafe({ petitionId }: { petitionId: string }) {
	const result = await drizzle.query.actionCode.findFirst({
		where: and(
			eq(actionCode.referenceId, petitionId),
			eq(actionCode.type, 'petition_signed'),
			isNull(actionCode.deletedAt)
		)
	});
	return result;
}
