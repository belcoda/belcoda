import { json } from '@sveltejs/kit';
import { checkEventTitle } from '$lib/server/api/data/event/check';
export async function GET(event) {
	const title = event.url.searchParams.get('title');
	const organizationId = event.url.searchParams.get('organizationId');
	const excludeEventId = event.url.searchParams.get('excludeEventId');
	if (!title || !organizationId) {
		return json({ error: 'Title and organizationId are required' }, { status: 400 });
	}
	const result = await checkEventTitle({
		title,
		organizationId,
		excludeEventId: excludeEventId || undefined
	});
	return json({ result }, { status: 200 });
}
