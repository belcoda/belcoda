import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'PUT, OPTIONS',
	'Access-Control-Allow-Headers': '*'
};

function assertE2eEnvironment() {
	if (env.NODE_ENV === 'production') {
		throw error(403, 'This endpoint is only available in development mode');
	}
}

export const OPTIONS: RequestHandler = async () => {
	assertE2eEnvironment();
	return new Response(null, { status: 204, headers: corsHeaders });
};

export const PUT: RequestHandler = async () => {
	assertE2eEnvironment();
	return new Response(null, { status: 200, headers: corsHeaders });
};
