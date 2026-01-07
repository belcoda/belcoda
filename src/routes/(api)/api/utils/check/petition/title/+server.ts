import { json } from '@sveltejs/kit';
import { checkPetitionTitle } from '$lib/server/api/data/petition/check';
export async function GET(event) {
	const title = event.url.searchParams.get('title');
	const organizationId = event.url.searchParams.get('organizationId');
	const excludePetitionId = event.url.searchParams.get('excludePetitionId');
	if (!title || !organizationId) {
		return json({ error: 'Title and organizationId are required' }, { status: 400 });
	}
	const result = await checkPetitionTitle({
		title,
		organizationId,
		excludePetitionId: excludePetitionId || undefined
	});
	return json({ result }, { status: 200 });
}
