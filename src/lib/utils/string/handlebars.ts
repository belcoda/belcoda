import Handlebars from 'handlebars';
import { type ReadPersonZero } from '$lib/schema/person';
import { type ReadOrganizationZero } from '$lib/schema/organization';

type MergeContext = { person: ReadPersonZero; organization: ReadOrganizationZero };

/**
 * The template fragments authors can merge into a handlebars template. This is
 * the single source of truth: `renderHandlebarsTemplate` registers one helper
 * per entry, and the editor's "insert fragment" UI lists them.
 *
 * `value` reads the merge value for a given person/organization. When it is
 * empty the helper falls back to the string the author passed in the template
 * (e.g. `{{givenName 'friend'}}` renders "friend" for a person with no first
 * name), and to an empty string when no fallback was given.
 */
export const templateFragments = [
	{ helper: 'givenName', value: ({ person }: MergeContext) => person.givenName },
	{ helper: 'familyName', value: ({ person }: MergeContext) => person.familyName },
	{ helper: 'email', value: ({ person }: MergeContext) => person.emailAddress },
	{ helper: 'phone', value: ({ person }: MergeContext) => person.phoneNumber },
	{ helper: 'organizationName', value: ({ organization }: MergeContext) => organization.name },
	{ helper: 'organizationSlug', value: ({ organization }: MergeContext) => organization.slug }
] as const;

export type TemplateFragmentHelper = (typeof templateFragments)[number]['helper'];

export function renderHandlebarsTemplate({
	template,
	person,
	organization
}: {
	template: string;
	person: ReadPersonZero;
	organization: ReadOrganizationZero;
}): string {
	const hb = Handlebars.create();

	for (const fragment of templateFragments) {
		hb.registerHelper(fragment.helper, function (fallbackString?: unknown) {
			const value = fragment.value({ person, organization });
			// Real values are raw text from the database, so return them plain and
			// let Handlebars HTML-escape them for the HTML output.
			if (value) return value;
			// The fallback is authored inside the template, which is already an HTML
			// string — the editor serialises `{{helper 'text'}}` into HTML and encodes
			// entities (e.g. `&` -> `&amp;`). Returning it as a SafeString stops
			// Handlebars from escaping it a second time (`&amp;` -> `&amp;amp;`).
			// Handlebars passes an options object (not a string) when the helper is
			// called with no argument, so guard for a real string.
			const fallback = typeof fallbackString === 'string' ? fallbackString : '';
			return new Handlebars.SafeString(fallback);
		});
	}

	const compiled = hb.compile(template);
	return compiled({
		person,
		organization
	});
}
