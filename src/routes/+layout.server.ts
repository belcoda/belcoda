export const ssr = false;

import { LOCALES, type Locale } from '$lib/utils/language';

export const load = async ({ url, locals, cookies }) => {
	let locale: Locale = 'en'; //default locale...
	if (LOCALES.includes(locals.locale)) {
		locale = locals.locale;
	}
	if (
		locals.session?.user?.preferredLanguage &&
		LOCALES.includes(locals.session.user.preferredLanguage as Locale)
	) {
		locale = locals.session.user.preferredLanguage as Locale;
	}
	if (LOCALES.includes(url.searchParams.get('locale') as Locale)) {
		locale = url.searchParams.get('locale') as Locale;
	}
	return { locale };
};
