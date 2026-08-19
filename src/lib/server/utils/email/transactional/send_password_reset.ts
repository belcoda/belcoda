import sendHtmlEmail from '$lib/server/utils/email/send_html_email';
import { type Locale } from '$lib/utils/language';
import { Renderer } from '@better-svelte-email/server';
const renderer = new Renderer();
import SingleButtonTransactional from '$lib/emails/templates/SingleButtonTransactional.svelte';
import type { Props as SingleButtonTransactionalProps } from '$lib/emails/templates/SingleButtonTransactional.svelte';
import { t } from '$lib/index.svelte';
import { runWithLocale } from 'wuchale/load-utils/server';

export async function sendPasswordResetEmail({
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
			title: t`Reset your password`,
			body: t`We received a request to reset your password. If this was you, click the button below to create a new one. If not, you can safely ignore this email—your account will stay secure.`,
			previewText: t`Click below to create a new password. If you didn't request this, just ignore this email.`,
			buttonText: t`Reset password`,
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
			subject: t`Reset Password`,
			stream: 'outbound'
		});
	});
}
