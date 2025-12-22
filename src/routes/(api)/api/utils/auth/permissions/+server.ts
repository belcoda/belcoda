import { json } from '@sveltejs/kit';
import { getQueryContext } from '$lib/server/api/utils/auth/permissions';
import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function GET(event) {
	try {
		const userId = event.locals.session?.user.id;
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const queryContext = await getQueryContext(userId);
		return json(queryContext);
	} catch (error) {
		log.error(error, 'Error getting permissions context');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
