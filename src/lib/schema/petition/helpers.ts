import * as v from 'valibot';
import { get } from '$lib/utils/http';
import { petitionSchema } from '$lib/schema/petition/petition';

export function generatePetitionTitleAsyncSchema(
	organizationId: string,
	excludePetitionId?: string
) {
	const petitionTitle = v.pipeAsync(
		petitionSchema.entries.title,
		v.checkAsync(async (value) => {
			try {
				const result = await get({
					path: `/api/utils/check/petition/title?title=${value}&organizationId=${organizationId}${excludePetitionId ? `&excludePetitionId=${excludePetitionId}` : ''}`,
					schema: v.object({ result: v.boolean() })
				});
				if (result.result) {
					//petition exists, that's an error, title must be unique
					return false;
				} else {
					return true;
				}
			} catch (error) {
				return false;
			}
		}, 'Another petition exists with this title')
	);
	const petitionSlug = v.pipeAsync(
		petitionSchema.entries.slug,
		v.checkAsync(async (value) => {
			try {
				const result = await get({
					path: `/api/utils/check/petition/slug?slug=${value}&organizationId=${organizationId}${excludePetitionId ? `&excludePetitionId=${excludePetitionId}` : ''}`,
					schema: v.object({ result: v.boolean() })
				});
				if (result.result) {
					//petition exists, that's an error, slug must be unique
					return false;
				} else {
					return true;
				}
			} catch (error) {
				return false;
			}
		}, 'Another petition exists with this slug')
	);

	return { title: petitionTitle, slug: petitionSlug };
}
