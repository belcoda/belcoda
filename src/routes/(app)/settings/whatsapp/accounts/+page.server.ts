import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => ({
	mockExternalServices:
		env.MOCK_EXTERNAL_SERVICES === 'true' && process.env.NODE_ENV !== 'production'
});
