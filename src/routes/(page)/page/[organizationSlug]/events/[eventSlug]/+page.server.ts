import pino from '$lib/pino';
const log = pino(import.meta.url);

export async function load({ locals, url }) {
	log.debug(
		{
			locals,
			requestId: locals.requestId,
			time: new Date().getTime(),
			sessionId: locals.session?.session.id,
			url: url.toString()
		},
		'[DEBUG] Route started loading'
	);
	const session = locals.session;
	return { session };
}
