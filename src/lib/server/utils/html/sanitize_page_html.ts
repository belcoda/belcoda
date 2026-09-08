import { sanitize, clearWindow } from 'isomorphic-dompurify';

/**
 * Sanitizes the raw HTML produced by the TipTap editor before it is persisted to
 * the `pageHtml` column.
 *
 * We sanitize once, here at the input boundary, so that read paths can render
 * `pageHtml` with `{@html}` without sanitizing again. Every persisted write of
 * `pageHtml` MUST go through this (see the event/petition server data functions).
 *
 * Empty/nullish input is normalized to `null` so an empty document is treated as
 * "no page content" (falsy) by both the editor swap logic and the public render.
 */
export function sanitizePageHtml(html: string | null | undefined): string | null {
	if (!html) return null;
	try {
		const clean = sanitize(html);
		// A document that sanitizes down to nothing is stored as null, not ''.
		return clean.trim().length > 0 ? clean : null;
	} finally {
		clearWindow(); // Release JSDom resources to avoid memory accumulation on the server.
	}
}
