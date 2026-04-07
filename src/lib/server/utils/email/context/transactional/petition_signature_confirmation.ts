import { organization, person, petition } from '$lib/schema/drizzle';
import { env } from '$env/dynamic/public';
import { type Locale } from '$lib/utils/language';
import { htmlToPlaintext } from '$lib/utils/html';
import { dev } from '$app/environment';
import { runWithLocale } from 'wuchale/load-utils/server';
import { t } from '$lib/index.svelte';

const { PUBLIC_ROOT_DOMAIN } = env;

type Input = {
	organization: typeof organization.$inferSelect;
	locale: Locale;
	petition: typeof petition.$inferSelect;
	person: typeof person.$inferSelect;
};

export async function petitionSignatureConfirmation(options: Input) {
	return await runWithLocale(options.locale, () => {
		const petitionUrl = `${dev ? 'http://' : 'https://'}${options.organization.slug}.${PUBLIC_ROOT_DOMAIN}/petitions/${options.petition.slug}`;
		const petitionTitle = options.petition.title;
		const year = new Date().getFullYear();

		const subject = t`Signature recorded: ${petitionTitle}`;
		const title = t`Your signature was recorded`;
		const body = t`Thank you for signing "${petitionTitle}". Your signature has been recorded. Click the button below to view the petition or share it with others.`;
		const previewText = t`Your signature on "${petitionTitle}" was recorded`;
		const buttonText = t`View petition`;
		const buttonAltHtml = t`Copy and paste the following link into your browser ${petitionUrl}`;
		const buttonAltText = buttonAltHtml;
		const instanceName = t`Belcoda`;
		const copyright = t`Copyright ${String(year)} Belcoda`;

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
			logoAlt: t`Belcoda logo`,
			buttonAltHtml,
			buttonAltText,
			copyright
		};
	});
}
