import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { type Locale } from '$lib/utils/language';

// Simple i18n helper for WhatsApp messages
// TODO: Replace with proper Wuchale i18n when available
function t(key: string, params: Record<string, string>, locale: Locale): string {
	const translations: Record<Locale, Record<string, string>> = {
		en: {
			'petitions.whatsapp_message':
				'Sign petition for {title} [#{code}] (do not edit this message)'
		},
		es: {
			'petitions.whatsapp_message':
				'Firmar petición para {title} [#{code}] (no edite este mensaje)'
		},
		pt: {
			'petitions.whatsapp_message':
				'Assinar petição para {title} [#{code}] (não edite esta mensagem)'
		}
	};

	let translation = translations[locale]?.[key] || translations['en'][key] || key;
	Object.entries(params).forEach(([param, value]) => {
		translation = translation.replace(`{${param}}`, value);
	});
	return translation;
}

export function getPetitionLink({
	petitionSlug,
	organizationSlug
}: {
	petitionSlug: string;
	organizationSlug: string;
}) {
	return `http${dev ? '' : 's'}://${organizationSlug}.${env.PUBLIC_ROOT_DOMAIN}/petitions/${petitionSlug}`;
}

export function generateWhatsAppPetitionLink({
	petitionTitle,
	whatsAppNumber,
	actionCode,
	locale = 'en'
}: {
	petitionTitle: string;
	whatsAppNumber?: string | null;
	actionCode: string;
	locale?: Locale;
}) {
	const message = t(
		'petitions.whatsapp_message',
		{ title: petitionTitle, code: actionCode },
		locale
	);
	return `https://wa.me/${whatsAppNumber || env.PUBLIC_DEFAULT_WHATSAPP_NUMBER}/?text=${encodeURIComponent(message)}`;
}