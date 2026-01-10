import { json } from '@sveltejs/kit';
import { checkPetitionSlug } from '$lib/server/api/data/petition/check';
export async function GET(event) {
	const slug = event.url.searchParams.get('slug');
	const organizationId = event.url.searchParams.get('organizationId');
	const excludePetitionId = event.url.searchParams.get('excludePetitionId');
	if (!slug || !organizationId) {
		return json({ error: 'Slug and organizationId are required' }, { status: 400 });
	}
	const result = await checkPetitionSlug({
		slug,
		organizationId,
		excludePetitionId: excludePetitionId || undefined
	});
	return json({ result }, { status: 200 });
}
