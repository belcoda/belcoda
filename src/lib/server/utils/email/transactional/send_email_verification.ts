import sendHtmlEmail from '$lib/server/utils/email/send_html_email';
import { type Locale } from '$lib/utils/language';
import { renderer } from './renderer';
import SingleButtonTransactional from '$lib/emails/templates/SingleButtonTransactional.svelte';
import type { Props as SingleButtonTransactionalProps } from '$lib/emails/templates/SingleButtonTransactional.svelte';
import { t } from '$lib/index.svelte';
import { runWithLocale } from 'wuchale/load-utils/server';

export async function sendEmailVerificationEmail({
	url,
	emailAddress,
	locale
}: {
	url: string;
	emailAddress: string;
	locale: Locale;
}) {
	return await runWithLocale(locale, async () => {
		const props: SingleButtonTransactionalProps = {
			language: locale,
			instanceUrl: url,
			title: t`Security verification`,
			body: t`Please verify your email address for security purposes. Click the button below to verify your email address.`,
			previewText: t`Please verify your email address for security purposes`,
			buttonText: t`Verify email`,
			buttonUrl: url,
			instanceName: 'Belcoda',
			logoAlt: t`Belcoda logo`,
			buttonAltHtml: t`Copy and paste the following link into your browser ${url}`,
			copyright: t`Copyright ${new Date().getFullYear().toString()} Belcoda`
		};
		const html = await renderer.render(SingleButtonTransactional, { props });
		await sendHtmlEmail({
			to: emailAddress,
			from: 'Belcoda <noreply@belcoda.com>',
			html,
			subject: t`Verify your email address`,
			stream: 'outbound'
		});
	});
}
