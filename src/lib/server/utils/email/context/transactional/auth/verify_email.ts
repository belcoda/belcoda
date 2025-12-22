import { env } from '$env/dynamic/public';
const { PUBLIC_HOST } = env;
import { type Locale } from '$lib/utils/language';
import { htmlToPlaintext } from '$lib/utils/html';

export function emailConfirm({ url, locale }: { url: string; locale: Locale }) {
	const body =
		'Thanks for signing up! Before you dive in, we just need to make sure we’ve got the right email address. Please confirm your email to activate your account and unlock all the features waiting for you.';
	return {
		language: locale,
		subject: 'Confirm your email to get started',
		title: 'Let’s verify your email address',
		body: body,
		bodyPlainText: htmlToPlaintext(body),
		previewText: 'We need to make sure we’ve got the right email address for you',
		buttonText: 'Confirm email',
		buttonUrl: url,
		instanceName: 'Belcoda',
		logoUrl: `http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		buttonAltHtml: `Copy and paste the following link into your browser ${url}`,
		buttonAltText: `Copy and paste the following link into your browser ${url}`,
		copyright: `Copyright ${new Date().getFullYear()} Belcoda`
	};
}

export function emailVerification({ url, locale }: { url: string; locale: Locale }) {
	const body =
		'Please verify your email address for security purposes. Click the button below to verify your email address.';
	return {
		language: locale,
		subject: 'Verify your email address',
		title: 'Security verification',
		body: body,
		bodyPlainText: htmlToPlaintext(body),
		previewText: 'Please verify your email address for security purposes',
		buttonText: 'Verify email',
		buttonUrl: url,
		instanceName: 'Belcoda',
		logoUrl: `http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		buttonAltHtml: `Copy and paste the following link into your browser ${url}`,
		buttonAltText: `Copy and paste the following link into your browser ${url}`,
		copyright: `Copyright ${new Date().getFullYear()} Belcoda`
	};
}

export function oneTimeCode({ code, locale }: { code: string; locale: Locale }) {
	const body =
		'Please verify your login by entering this 6 digit code when you sign in. If you did not request this code, please ignore this email or contact support if you have concerns about your account security.';
	return {
		language: locale,
		subject: 'Six digit security code',
		title: code,
		body: body,
		bodyPlainText: htmlToPlaintext(body),
		previewText: 'Your one time security code to login is {code}',
		instanceName: 'Belcoda',
		logoUrl: `http://app.belcoda.com/logos/logomark_black.svg`,
		logoAlt: `Belcoda logo`,
		copyright: `Copyright ${new Date().getFullYear()} Belcoda`
	};
}
