import sendHtmlEmail from '$lib/server/utils/email/send_html_email';
import { type Locale } from '$lib/utils/language';
import { renderer } from './transactional/renderer';
import Broadcast from '$lib/emails/templates/Broadcast.svelte';
import type { Props as BroadcastProps } from '$lib/emails/templates/Broadcast.svelte';
import { t } from '$lib/index.svelte';
import { runWithLocale } from 'wuchale/load-utils/server';
import {
	renderHandlebarsTemplate,
	type TemplatePerson,
	type TemplateOrganization
} from '$lib/utils/string/handlebars';

export async function sendBroadcastEmail({
	emailAddress,
	organizationName,
	subject,
	sendSignatureName,
	sendSignatureEmail,
	personObject,
	organizationObject,
	replyToEmail,
	htmlBody,
	locale
}: {
	emailAddress: string;
	organizationName: string;
	sendSignatureName: string;
	sendSignatureEmail: string;
	subject?: string | null;
	personObject: TemplatePerson;
	organizationObject: TemplateOrganization;
	replyToEmail?: string;
	htmlBody: string;
	locale: Locale;
}) {
	return await runWithLocale(locale, async () => {
		const props: BroadcastProps = {
			language: locale,
			body: htmlBody,
			copyright: t`Copyright ${new Date().getFullYear().toString()} ${organizationName}`
		};
		const htmlEmail = await renderer.render(Broadcast, { props });
		const subjectRendered = subject
			? renderHandlebarsTemplate({
					template: subject,
					person: personObject,
					organization: organizationObject
				})
			: null;
		const htmlEmailRendered = await renderHandlebarsTemplate({
			template: htmlEmail,
			person: personObject,
			organization: organizationObject
		});
		await sendHtmlEmail({
			to: emailAddress,
			from: `${sendSignatureName} <${sendSignatureEmail}>`,
			html: htmlEmailRendered,
			subject: subjectRendered || null,
			stream: 'broadcast',
			replyTo: replyToEmail
		});
	});
}
