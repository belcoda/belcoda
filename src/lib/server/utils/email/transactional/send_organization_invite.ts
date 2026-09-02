import sendHtmlEmail from '$lib/server/utils/email/send_html_email';
import { type Locale } from '$lib/utils/language';
import { renderer } from './renderer';
import SingleButtonTransactional from '$lib/emails/templates/SingleButtonTransactional.svelte';
import type { Props as SingleButtonTransactionalProps } from '$lib/emails/templates/SingleButtonTransactional.svelte';
import { t } from '$lib/index.svelte';
import { runWithLocale } from 'wuchale/load-utils/server';

function formatEmailDisplayName(name: string): string {
	const cleaned = name.replace(/[\r\n\t]+/g, ' ').trim();
	if (/[()<>@,;:\\".[\]]/.test(cleaned)) {
		return `"${cleaned.replace(/(["\\])/g, String.raw`\$1`)}"`;
	}
	return cleaned;
}

export async function sendOrganizationInvitationEmail({
	url,
	orgIcon,
	emailAddress,
	inviterName,
	organizationName,
	locale
}: {
	url: string;
	emailAddress: string;
	orgIcon?: string | null;
	inviterName: string;
	organizationName: string;
	locale: Locale;
}) {
	return await runWithLocale(locale, async () => {
		const body = t`${inviterName} has invited you to join ${organizationName} on Belcoda. Click the button below to accept the invitation and get started.`;
		const props: SingleButtonTransactionalProps = {
			language: locale,
			instanceUrl: url,
			title: t`Join ${organizationName}`,
			body: body,
			logoUrl: orgIcon || undefined,
			previewText: t`${inviterName} has invited you to join ${organizationName} on Belcoda`,
			buttonText: t`Accept invitation`,
			buttonUrl: url,
			instanceName: organizationName,
			logoAlt: orgIcon ? organizationName : t`Belcoda logo`,
			buttonAltHtml: t`Copy and paste the following link into your browser ${url}`,
			copyright: t`Copyright ${new Date().getFullYear().toString()} ${organizationName}`
		};
		const html = await renderer.render(SingleButtonTransactional, { props });
		await sendHtmlEmail({
			to: emailAddress,
			from: `${formatEmailDisplayName(organizationName)} <noreply@belcoda.com>`,
			html,
			subject: t`Invitation to join ${organizationName}`,
			stream: 'outbound'
		});
	});
}
