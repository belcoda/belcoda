import { htmlToPlaintext } from '$lib/utils/html';
import { type Locale } from '$lib/utils/language';
export function passwordReset({ url, locale }: { url: string; locale: Locale }) {
	const body =
		'We received a request to reset your password. If this was you, click the button below to create a new one. If not, you can safely ignore this email—your account will stay secure.';
	return {
		language: locale,
		subject: 'Reset Password',
		title: 'Reset your password',
		body: body,
		bodyPlainText: htmlToPlaintext(body),
		previewText:
			'Click below to create a new password. If you didn’t request this, just ignore this email.',
		buttonText: 'Reset password',
		buttonUrl: url,
		instanceName: 'Belcoda',
		logoUrl: `http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		buttonAltHtml: `Copy and paste the following link into your browser ${url}`,
		buttonAltText: `Copy and paste the following link into your browser ${url}`,
		copyright: `Copyright ${new Date().getFullYear()} Belcoda`
	};
}
