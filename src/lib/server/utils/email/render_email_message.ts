import { LexicalHTMLRenderer as LexicalHtmlRenderer } from '@tryghost/kg-lexical-html-renderer';
import { organization as organizationTable, person, user as userTable } from '$lib/schema/drizzle';
import { templateVariableKeys, type TemplateVariableKey } from '$lib/schema/template-variables';
import { isRenderableImageNode, normalizeLexicalBody } from './normalize_lexical_body';
import { escapeHtml } from '$lib/utils/escape-html';

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

		if (!Object.hasOwn(values, key)) {
			return token;
		}

		const resolved = values[key as TemplateVariableKey];
		if (resolved === undefined) {
			return token;
		}

		return escape(resolved ?? '');
	});
}

/*
@tryghost/kg-lexical-html-renderer only renders image nodes when the Koenig
ImageNode class is registered with its headless editor. That class (from
@tryghost/kg-default-nodes) is built against a separate nested copy of
lexical@0.13.1 than the renderer's own, because this project pins
lexical@0.40.0 at the root (for svelte-lexical) and npm therefore nests a
private lexical copy inside each Ghost package. Registering the class makes
parsing fail with "Unable to find an active editor". Instead we normalize the
body (see normalize_lexical_body), render the Lexical segments between images
with the Ghost renderer, and emit the image-card markup — matching the Ghost
renderer's own output — ourselves.
*/
// The standard content width for email; images wider than this are capped so
// they never overflow the template. Matches the width @tryghost's own email
// renderer resizes content images to.
const EMAIL_CONTENT_WIDTH = 600;

function renderImageNodeHtml(node: Record<string, unknown> & { src: string }): string {
	const alt = typeof node.alt === 'string' ? node.alt : '';
	const caption = typeof node.caption === 'string' ? node.caption : '';
	const width = typeof node.width === 'number' ? node.width : null;
	const height = typeof node.height === 'number' ? node.height : null;

	let figureClasses = 'kg-card kg-image-card';
	if (caption) {
		figureClasses += ' kg-card-hascaption';
	}

	let img = `<img src="${escapeHtml(node.src)}" class="kg-image" alt="${escapeHtml(alt)}" loading="lazy"`;
	if (width && height) {
		// Outlook ignores max-width on images, so cap the width/height attributes
		// themselves (proportionally) at the content width. The inline style below
		// handles fluid scaling for clients that honour max-width.
		if (width > EMAIL_CONTENT_WIDTH) {
			const cappedHeight = Math.round((height * EMAIL_CONTENT_WIDTH) / width);
			img += ` width="${EMAIL_CONTENT_WIDTH}" height="${cappedHeight}"`;
		} else {
			img += ` width="${width}" height="${height}"`;
		}
	}
	// Constrain the image to its parent's width and keep its aspect ratio,
	// regardless of the intrinsic pixel size. Email clients strip <style> blocks
	// and class-based CSS, so this has to be inline on the element itself.
	img += ' style="max-width:100%;height:auto;">';

	const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
	return `<figure class="${figureClasses}">${img}${figcaption}</figure>`;
}

async function renderLexicalBody(lexicalRenderer: LexicalHtmlRenderer, body: unknown) {
	const normalized = normalizeLexicalBody(body);
	const root =
		typeof normalized === 'object' && normalized !== null
			? (normalized as { root?: { children?: unknown[] } }).root
			: undefined;
	const children = root && Array.isArray(root.children) ? root.children : undefined;

	if (!children?.some(isRenderableImageNode)) {
		return lexicalRenderer.render(JSON.stringify(normalized));
	}

	const output: string[] = [];
	let segment: unknown[] = [];

	async function renderSegment() {
		if (segment.length === 0) {
			return;
		}
		output.push(
			await lexicalRenderer.render(JSON.stringify({ root: { ...root, children: segment } }))
		);
		segment = [];
	}

	for (const child of children) {
		if (isRenderableImageNode(child)) {
			await renderSegment();
			output.push(renderImageNodeHtml(child));
		} else {
			segment.push(child);
		}
	}
	await renderSegment();

	return output.join('');
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
	const lexicalRenderer = new LexicalHtmlRenderer();
	const values = buildEmailTemplateValues({
		personObject,
		organization,
		sender
	});
	const html = body ? await renderLexicalBody(lexicalRenderer, body) : '';

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
