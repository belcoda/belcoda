export const ssr = false;

import { LOCALES, type Locale } from '$lib/utils/language';

export const load = async ({ url }) => {
	const locale = LOCALES.includes(url.searchParams.get('locale') as Locale)
		? (url.searchParams.get('locale') as Locale)
		: ('en' as Locale);
	return { locale };
};
