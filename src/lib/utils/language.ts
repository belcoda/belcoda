const isoLanguageCodes = {
	af: { name: 'Afrikaans', native: 'Afrikaans' },
	sq: { name: 'Albanian', native: 'shqip' },
	am: { name: 'Amharic', native: 'አማርኛ' },
	ar: { name: 'Arabic', native: 'العربية' },
	an: { name: 'Aragonese', native: 'aragonés' },
	hy: { name: 'Armenian', native: 'հայերեն' },
	ast: { name: 'Asturian', native: 'asturianu' },
	az: { name: 'Azerbaijani', native: 'azərbaycan dili' },
	eu: { name: 'Basque', native: 'euskara' },
	be: { name: 'Belarusian', native: 'беларуская' },
	bn: { name: 'Bengali', native: 'বাংলা' },
	bs: { name: 'Bosnian', native: 'bosanski' },
	br: { name: 'Breton', native: 'brezhoneg' },
	bg: { name: 'Bulgarian', native: 'български' },
	ca: { name: 'Catalan', native: 'català' },
	ckb: { name: 'Central Kurdish', native: 'کوردی (دەستنوسی عەرەبی)' },
	zh: { name: 'Chinese', native: '中文' },
	'zh-HK': { name: 'Chinese (Hong Kong)', native: '中文（香港）' },
	'zh-CN': { name: 'Chinese (Simplified)', native: '中文（简体）' },
	'zh-TW': { name: 'Chinese (Traditional)', native: '中文（繁體）' },
	co: { name: 'Corsican', native: 'Corsican' },
	hr: { name: 'Croatian', native: 'hrvatski' },
	cs: { name: 'Czech', native: 'čeština' },
	da: { name: 'Danish', native: 'dansk' },
	nl: { name: 'Dutch', native: 'Nederlands' },
	en: { name: 'English', native: 'English' },
	'en-AU': { name: 'English (Australia)', native: 'English (Australia)' },
	'en-CA': { name: 'English (Canada)', native: 'English (Canada)' },
	'en-IN': { name: 'English (India)', native: 'English (India)' },
	'en-NZ': { name: 'English (New Zealand)', native: 'English (New Zealand)' },
	'en-ZA': { name: 'English (South Africa)', native: 'English (South Africa)' },
	'en-GB': { name: 'English (United Kingdom)', native: 'English (United Kingdom)' },
	'en-US': { name: 'English (United States)', native: 'English (United States)' },
	eo: { name: 'Esperanto', native: 'esperanto' },
	et: { name: 'Estonian', native: 'eesti' },
	fo: { name: 'Faroese', native: 'føroyskt' },
	fil: { name: 'Filipino', native: 'Filipino' },
	fi: { name: 'Finnish', native: 'suomi' },
	fr: { name: 'French', native: 'français' },
	'fr-CA': { name: 'French (Canada)', native: 'français (Canada)' },
	'fr-FR': { name: 'French (France)', native: 'français (France)' },
	'fr-CH': { name: 'French (Switzerland)', native: 'français (Suisse)' },
	gl: { name: 'Galician', native: 'galego' },
	ka: { name: 'Georgian', native: 'ქართული' },
	de: { name: 'German', native: 'Deutsch' },
	'de-AT': { name: 'German (Austria)', native: 'Deutsch (Österreich)' },
	'de-DE': { name: 'German (Germany)', native: 'Deutsch (Deutschland)' },
	'de-LI': { name: 'German (Liechtenstein)', native: 'Deutsch (Liechtenstein)' },
	'de-CH': { name: 'German (Switzerland)', native: 'Deutsch (Schweiz)' },
	el: { name: 'Greek', native: 'Ελληνικά' },
	gn: { name: 'Guarani', native: 'Guarani' },
	gu: { name: 'Gujarati', native: 'ગુજરાતી' },
	ha: { name: 'Hausa', native: 'Hausa' },
	haw: { name: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi' },
	he: { name: 'Hebrew', native: 'עברית' },
	hi: { name: 'Hindi', native: 'हिन्दी' },
	hu: { name: 'Hungarian', native: 'magyar' },
	is: { name: 'Icelandic', native: 'íslenska' },
	id: { name: 'Indonesian', native: 'Indonesia' },
	ia: { name: 'Interlingua', native: 'Interlingua' },
	ga: { name: 'Irish', native: 'Gaeilge' },
	it: { name: 'Italian', native: 'italiano' },
	'it-IT': { name: 'Italian (Italy)', native: 'italiano (Italia)' },
	'it-CH': { name: 'Italian (Switzerland)', native: 'italiano (Svizzera)' },
	ja: { name: 'Japanese', native: '日本語' },
	kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
	kk: { name: 'Kazakh', native: 'қазақ тілі' },
	km: { name: 'Khmer', native: 'ខ្មែរ' },
	ko: { name: 'Korean', native: '한국어' },
	ku: { name: 'Kurdish', native: 'Kurdî' },
	ky: { name: 'Kyrgyz', native: 'кыргызча' },
	lo: { name: 'Lao', native: 'ລາວ' },
	la: { name: 'Latin', native: 'Latin' },
	lv: { name: 'Latvian', native: 'latviešu' },
	ln: { name: 'Lingala', native: 'lingála' },
	lt: { name: 'Lithuanian', native: 'lietuvių' },
	mk: { name: 'Macedonian', native: 'македонски' },
	ms: { name: 'Malay', native: 'Bahasa Melayu' },
	ml: { name: 'Malayalam', native: 'മലയാളം' },
	mt: { name: 'Maltese', native: 'Malti' },
	mr: { name: 'Marathi', native: 'मराठी' },
	mn: { name: 'Mongolian', native: 'монгол' },
	ne: { name: 'Nepali', native: 'नेपाली' },
	no: { name: 'Norwegian', native: 'norsk' },
	nb: { name: 'Norwegian Bokmål', native: 'norsk bokmål' },
	nn: { name: 'Norwegian Nynorsk', native: 'nynorsk' },
	oc: { name: 'Occitan', native: 'Occitan' },
	or: { name: 'Oriya', native: 'ଓଡ଼ିଆ' },
	om: { name: 'Oromo', native: 'Oromoo' },
	ps: { name: 'Pashto', native: 'پښتو' },
	fa: { name: 'Persian', native: 'فارسی' },
	pl: { name: 'Polish', native: 'polski' },
	pt: { name: 'Portuguese', native: 'português' },
	'pt-BR': { name: 'Portuguese (Brazil)', native: 'português (Brasil)' },
	'pt-PT': { name: 'Portuguese (Portugal)', native: 'português (Portugal)' },
	pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
	qu: { name: 'Quechua', native: 'Quechua' },
	ro: { name: 'Romanian', native: 'română' },
	mo: { name: 'Romanian (Moldova)', native: 'română (Moldova)' },
	rm: { name: 'Romansh', native: 'rumantsch' },
	ru: { name: 'Russian', native: 'русский' },
	gd: { name: 'Scottish Gaelic', native: 'Scottish Gaelic' },
	sr: { name: 'Serbian', native: 'српски' },
	sh: { name: 'Serbo', native: 'Croatian' },
	sn: { name: 'Shona', native: 'chiShona' },
	sd: { name: 'Sindhi', native: 'Sindhi' },
	si: { name: 'Sinhala', native: 'සිංහල' },
	sk: { name: 'Slovak', native: 'slovenčina' },
	sl: { name: 'Slovenian', native: 'slovenščina' },
	so: { name: 'Somali', native: 'Soomaali' },
	st: { name: 'Southern Sotho', native: 'Southern Sotho' },
	es: { name: 'Spanish', native: 'español' },
	'es-AR': { name: 'Spanish (Argentina)', native: 'español (Argentina)' },
	'es-419': { name: 'Spanish (Latin America)', native: 'español (Latinoamérica)' },
	'es-MX': { name: 'Spanish (Mexico)', native: 'español (México)' },
	'es-ES': { name: 'Spanish (Spain)', native: 'español (España)' },
	'es-US': { name: 'Spanish (United States)', native: 'español (Estados Unidos)' },
	su: { name: 'Sundanese', native: 'Sundanese' },
	sw: { name: 'Swahili', native: 'Kiswahili' },
	sv: { name: 'Swedish', native: 'svenska' },
	tg: { name: 'Tajik', native: 'тоҷикӣ' },
	ta: { name: 'Tamil', native: 'தமிழ்' },
	tt: { name: 'Tatar', native: 'Tatar' },
	te: { name: 'Telugu', native: 'తెలుగు' },
	th: { name: 'Thai', native: 'ไทย' },
	ti: { name: 'Tigrinya', native: 'ትግርኛ' },
	to: { name: 'Tongan', native: 'lea fakatonga' },
	tr: { name: 'Turkish', native: 'Türkçe' },
	tk: { name: 'Turkmen', native: 'Turkmen' },
	tw: { name: 'Twi', native: 'Twi' },
	uk: { name: 'Ukrainian', native: 'українська' },
	ur: { name: 'Urdu', native: 'اردو' },
	ug: { name: 'Uyghur', native: 'Uyghur' },
	uz: { name: 'Uzbek', native: 'o‘zbek' },
	vi: { name: 'Vietnamese', native: 'Tiếng Việt' },
	wa: { name: 'Walloon', native: 'wa' },
	cy: { name: 'Welsh', native: 'Cymraeg' },
	fy: { name: 'Western Frisian', native: 'Western Frisian' },
	xh: { name: 'Xhosa', native: 'Xhosa' },
	yi: { name: 'Yiddish', native: 'Yiddish' },
	yo: { name: 'Yoruba', native: 'Èdè Yorùbá' },
	zu: { name: 'Zulu', native: 'isiZulu' }
};
export type LanguageCode = keyof typeof isoLanguageCodes;
export type LanguageName = (typeof isoLanguageCodes)[LanguageCode]['name'];
export type LanguageNativeName = (typeof isoLanguageCodes)[LanguageCode]['native'];

export const languageCodes = Object.keys(isoLanguageCodes) as LanguageCode[];

export function getLocalizedLanguageName(languageCode: LanguageCode): string {
	return isoLanguageCodes[languageCode].native;
}

export function getEnglishLanguageName(languageCode: LanguageCode): string {
	return isoLanguageCodes[languageCode].name;
}

export const LOCALES = ['en', 'es', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

import { t } from '$lib/index.svelte';

export const getLocaleName = (locale: Locale): string => {
	switch (locale) {
		case 'en':
			return t`English`;
		case 'es':
			return t`Español`;
		case 'pt':
			return t`Português`;
		default:
			return locale;
	}
};

export function isSupportedLanguage(locale: string): locale is Locale {
	return LOCALES.includes(locale as Locale);
}

export function clampLocale(locale: string): Locale {
	return isSupportedLanguage(locale) ? locale : 'en';
}
