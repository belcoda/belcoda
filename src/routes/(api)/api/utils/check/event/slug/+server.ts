import { json } from '@sveltejs/kit';
import { checkEventSlug } from '$lib/server/api/data/event/check';
export async function GET(event) {
	const slug = event.url.searchParams.get('slug');
	const organizationId = event.url.searchParams.get('organizationId');
	if (!slug || !organizationId) {
		return json({ error: 'Slug and organizationId are required' }, { status: 400 });
	}
	const result = await checkEventSlug({ slug, organizationId });
	return json({ result }, { status: 200 });
}
