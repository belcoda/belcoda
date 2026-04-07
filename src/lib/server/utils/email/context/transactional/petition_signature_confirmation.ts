import { organization, person, petition } from '$lib/schema/drizzle';
import { env } from '$env/dynamic/public';
import { type Locale } from '$lib/utils/language';
import { htmlToPlaintext } from '$lib/utils/html';
import { dev } from '$app/environment';

const { PUBLIC_ROOT_DOMAIN } = env;

// Simple i18n helper for server-side email translations
// TODO: Replace with proper Wuchale server-side i18n when available
function t(key: string, params: Record<string, string>, locale: Locale): string {
	const translations: Record<Locale, Record<string, string>> = {
		en: {
			'petition.signature.subject': 'Signature recorded: {title}',
			'petition.signature.title': 'Your signature was recorded',
			'petition.signature.body':
				'Thank you for signing "{title}". Your signature has been recorded. Click the button below to view the petition or share it with others.',
			'petition.signature.previewText': 'Your signature on "{title}" was recorded',
			'petition.signature.buttonText': 'View petition',
			'petition.signature.buttonAlt': 'Copy and paste the following link into your browser {url}',
			'petition.signature.instanceName': 'Belcoda',
			'petition.signature.copyright': 'Copyright {year} Belcoda'
		},
		es: {
			'petition.signature.subject': 'Firma registrada: {title}',
			'petition.signature.title': 'Tu firma fue registrada',
			'petition.signature.body':
				'Gracias por firmar "{title}". Tu firma ha sido registrada. Haz clic en el botón de abajo para ver la petición o compartirla con otros.',
			'petition.signature.previewText': 'Tu firma en "{title}" fue registrada',
			'petition.signature.buttonText': 'Ver petición',
			'petition.signature.buttonAlt':
				'Copia y pega el siguiente enlace en tu navegador {url}',
			'petition.signature.instanceName': 'Belcoda',
			'petition.signature.copyright': 'Copyright {year} Belcoda'
		},
		pt: {
			'petition.signature.subject': 'Assinatura registrada: {title}',
			'petition.signature.title': 'Sua assinatura foi registrada',
			'petition.signature.body':
				'Obrigado por assinar "{title}". Sua assinatura foi registrada. Clique no botão abaixo para ver a petição ou compartilhá-la com outras pessoas.',
			'petition.signature.previewText': 'Sua assinatura em "{title}" foi registrada',
			'petition.signature.buttonText': 'Ver petição',
			'petition.signature.buttonAlt': 'Copie e cole o seguinte link no seu navegador {url}',
			'petition.signature.instanceName': 'Belcoda',
			'petition.signature.copyright': 'Copyright {year} Belcoda'
		}
	};

	let translation = translations[locale]?.[key] || translations['en'][key] || key;
	Object.entries(params).forEach(([param, value]) => {
		translation = translation.replace(`{${param}}`, value);
	});
	return translation;
}

type Input = {
	organization: typeof organization.$inferSelect;
	locale: Locale;
	petition: typeof petition.$inferSelect;
	person: typeof person.$inferSelect;
};

export function petitionSignatureConfirmation(options: Input) {
	const petitionUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}/petitions/${options.petition.slug}`;

	const subject = t(
		'petition.signature.subject',
		{ title: options.petition.title },
		options.locale
	);
	const title = t('petition.signature.title', {}, options.locale);
	const body = t('petition.signature.body', { title: options.petition.title }, options.locale);
	const previewText = t(
		'petition.signature.previewText',
		{ title: options.petition.title },
		options.locale
	);
	const buttonText = t('petition.signature.buttonText', {}, options.locale);
	const buttonAltHtml = t('petition.signature.buttonAlt', { url: petitionUrl }, options.locale);
	const buttonAltText = t('petition.signature.buttonAlt', { url: petitionUrl }, options.locale);
	const instanceName = t('petition.signature.instanceName', {}, options.locale);
	const copyright = t(
		'petition.signature.copyright',
		{ year: new Date().getFullYear().toString() },
		options.locale
	);

	return {
		language: options.locale,
		subject,
		title,
		body,
		bodyPlainText: htmlToPlaintext(body),
		previewText,
		buttonText,
		buttonUrl: petitionUrl,
		instanceName,
		logoUrl:
			options.organization.icon ||
			options.organization.logo ||
			`http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		buttonAltHtml,
		buttonAltText,
		copyright
	};
}