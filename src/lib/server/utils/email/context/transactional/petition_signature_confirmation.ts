import { organization, person, petition } from '$lib/schema/drizzle';
import { env } from '$env/dynamic/public';
import { type Locale } from '$lib/utils/language';
import { htmlToPlaintext } from '$lib/utils/html';
import { dev } from '$app/environment';

const { PUBLIC_ROOT_DOMAIN } = env;

type Input = {
	organization: typeof organization.$inferSelect;
	locale: Locale;
	petition: typeof petition.$inferSelect;
	person: typeof person.$inferSelect;
};

export function petitionSignatureConfirmation(options: Input) {
	const petitionUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}/petitions/${options.petition.slug}`;

	const body = `Thank you for signing “${options.petition.title}”. Your signature has been recorded. Click the button below to view the petition or share it with others.`;

	return {
		language: options.locale,
		subject: `Signature recorded: ${options.petition.title}`,
		title: 'Your signature was recorded',
		body,
		bodyPlainText: htmlToPlaintext(body),
		previewText: `Your signature on “${options.petition.title}” was recorded`,
		buttonText: 'View petition',
		buttonUrl: petitionUrl,
		instanceName: 'Belcoda',
		logoUrl:
			options.organization.icon ||
			options.organization.logo ||
			`http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		buttonAltHtml: `Copy and paste the following link into your browser ${petitionUrl}`,
		buttonAltText: `Copy and paste the following link into your browser ${petitionUrl}`,
		copyright: `Copyright ${new Date().getFullYear()} Belcoda`
	};
}
