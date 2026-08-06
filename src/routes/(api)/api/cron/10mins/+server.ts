import { processCronTrigger } from '$lib/server/utils/flows/trigger/cron';
export async function POST() {
	await processCronTrigger();
	return new Response('Cron job completed');
}
