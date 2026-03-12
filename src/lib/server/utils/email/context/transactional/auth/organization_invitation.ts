import { type Locale } from '$lib/utils/language';
import { htmlToPlaintext } from '$lib/utils/html';

export function organizationInvitation({
	url,
	orgIcon,
	inviterName,
	organizationName,
	locale
}: {
	url: string;
	orgIcon?: string | null;
	inviterName: string;
	organizationName: string;
	locale: Locale;
}) {
	const body = `${inviterName} has invited you to join${organizationName} on Belcoda. Click the button below to accept the invitation and get started.`;
	return {
		language: locale,
		subject: `You've been invited to join ${organizationName}`,
		title: `Join ${organizationName}`,
		body: body,
		bodyPlainText: htmlToPlaintext(body),
		previewText: `${inviterName} has invited you to join ${organizationName} on Belcoda`,
		buttonText: 'Accept invitation',
		buttonUrl: url,
		instanceName: 'Belcoda',
		logoUrl: orgIcon || `http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		buttonAltHtml: `Copy and paste the following link into your browser ${url}`,
		buttonAltText: `Copy and paste the following link into your browser ${url}`,
		copyright: `Copyright ${new Date().getFullYear()} Belcoda`
	};
}
