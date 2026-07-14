import { json } from '@sveltejs/kit';
import { getQueue } from '$lib/server/queue/index';
import pino from '$lib/pino';

const log = pino(import.meta.url);

export async function POST() {
	try {
		const queue = await getQueue();
		await queue.sendDigest({ frequency: 'weekly' });
		return json({ message: 'Weekly digest queued' });
	} catch (err) {
		log.error({ err }, 'Failed to queue weekly digest');
		return json({ error: 'Failed to queue weekly digest' }, { status: 500 });
	}
}
