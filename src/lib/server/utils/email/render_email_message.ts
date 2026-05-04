import LexicalHtmlRenderer from '@tryghost/kg-lexical-html-renderer';
import { organization as organizationTable, person, user as userTable } from '$lib/schema/drizzle';
import {
	resolveTemplateVariables,
	type TemplateVariableValueMap
} from '$lib/utils/template-variables';

const lexicalRenderer = new LexicalHtmlRenderer();

type EmailTemplatePerson = Pick<
	typeof person.$inferSelect,
	'givenName' | 'familyName' | 'emailAddress' | 'phoneNumber'
>;
type EmailTemplateOrganization = Pick<typeof organizationTable.$inferSelect, 'name' | 'slug'>;
type EmailTemplateSender = Pick<typeof userTable.$inferSelect, 'name' | 'email'>;

function buildEmailTemplateVariableValues({
	personObject,
	organization,
	sender
}: {
	personObject?: EmailTemplatePerson | null;
	organization: EmailTemplateOrganization;
	sender?: EmailTemplateSender | null;
}): TemplateVariableValueMap {
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

function resolveLexicalTextNodes(value: unknown, values: TemplateVariableValueMap): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => resolveLexicalTextNodes(item, values));
	}

	if (!value || typeof value !== 'object') {
		return value;
	}

	const node = value as Record<string, unknown>;
	const resolvedNode = Object.fromEntries(
		Object.entries(node).map(([key, item]) => [key, resolveLexicalTextNodes(item, values)])
	);

	// Lexical stores user-visible text on text nodes. Resolve only that field before HTML rendering.
	if (node.type === 'text' && typeof node.text === 'string') {
		resolvedNode.text = resolveTemplateVariables(node.text, values);
	}

	return resolvedNode;
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
	const values = buildEmailTemplateVariableValues({
		personObject,
		organization,
		sender
	});
	const renderedSubject = resolveTemplateVariables(subject || '', values);
	const resolvedBody = body ? resolveLexicalTextNodes(body, values) : null;
	const renderedBody = resolvedBody
		? resolveTemplateVariables(await lexicalRenderer.render(JSON.stringify(resolvedBody)), values)
		: '';

	return {
		subject: renderedSubject,
		body: renderedBody
	};
}
