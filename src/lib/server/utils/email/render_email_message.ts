import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
import { organization as organizationTable, person, user as userTable } from '$lib/schema/drizzle';
import { templateVariableKeys, type TemplateVariableKey } from '$lib/schema/template-variables';

const lexicalRenderer = new LexicalHtmlRenderer();
const templateVariableKeySet = new Set<string>(templateVariableKeys);
const templateVariableTokenPattern = /\{\{\s*([a-z_]+\.[a-z_]+)\s*\}\}/g;

type EmailTemplatePerson = Pick<
	typeof person.$inferSelect,
	'givenName' | 'familyName' | 'emailAddress' | 'phoneNumber'
>;
type EmailTemplateOrganization = Pick<typeof organizationTable.$inferSelect, 'name' | 'slug'>;
type EmailTemplateSender = Pick<typeof userTable.$inferSelect, 'name' | 'email'>;
type EmailTemplateValues = Partial<Record<TemplateVariableKey, string | null | undefined>>;

function buildEmailTemplateValues({
	personObject,
	organization,
	sender
}: {
	personObject?: EmailTemplatePerson | null;
	organization: EmailTemplateOrganization;
	sender?: EmailTemplateSender | null;
}): EmailTemplateValues {
	return {
		'person.given_name': personObject?.givenName,
		'person.family_name': personObject?.familyName,
		'person.email_address': personObject?.emailAddress,
		'person.phone_number': personObject?.phoneNumber,
		'organization.name': organization.name,
		'organization.slug': organization.slug,
		'sender.name': sender?.name,
		'sender.email': sender?.email
	};
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderTemplateVariables({
	value,
	values,
	escape
}: {
	value: string;
	values: EmailTemplateValues;
	escape: (value: string) => string;
}) {
	return value.replace(templateVariableTokenPattern, (token, key: string) => {
		if (!templateVariableKeySet.has(key)) {
			return token;
		}

		return escape(values[key as TemplateVariableKey] || '');
	});
}

export async function renderEmailMessage({
	subject,
	body,
	personObject,
	organization,
	sender
}: {
	subject?: string | null;
	body?: unknown;
	personObject?: EmailTemplatePerson | null;
	organization: EmailTemplateOrganization;
	sender?: EmailTemplateSender | null;
}) {
	const values = buildEmailTemplateValues({
		personObject,
		organization,
		sender
	});
	const html = body ? await lexicalRenderer.render(JSON.stringify(body)) : '';

	return {
		subject: renderTemplateVariables({
			value: subject || '',
			values,
			escape: (value) => value
		}),
		body: renderTemplateVariables({
			value: html,
			values,
			escape: escapeHtml
		})
	};
}
