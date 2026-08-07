const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

/**
 * Escapes HTML special characters so a string can be safely interpolated into markup
 * that is rendered with `{@html}` or written directly into an HTML string (e.g. an
 * email body). Used both client- and server-side.
 *
 * Deliberately dependency-free: this needs to be unit-testable, and `$lib/utils/html.ts`
 * cannot currently be loaded under vitest because `isomorphic-dompurify` fails to
 * resolve there.
 *
 * `&` must be replaced first, otherwise the ampersands introduced by the later
 * replacements would be double-escaped.
 */
export function escapeHtml(value: string | null | undefined): string {
	if (value === null || value === undefined || value === '') return '';
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
