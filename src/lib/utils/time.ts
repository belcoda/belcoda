import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import es from 'javascript-time-ago/locale/es';
TimeAgo.addDefaultLocale(en);
TimeAgo.addLocale(es);

const timeAgoCache = {
	en: new TimeAgo('en', { polyfill: false }),
	es: new TimeAgo('es', { polyfill: false })
};

export function getTimeAgo(locale: string) {
	return timeAgoCache[locale as keyof typeof timeAgoCache];
}
