import { LexicalHTMLRenderer as LexicalHtmlRenderer } from '@tryghost/kg-lexical-html-renderer';
import type { SerializedEditorState } from 'lexical';
import { sanitize, clearWindow } from 'isomorphic-dompurify';
import pino from '$lib/pino';

const log = pino(import.meta.url);
const lexicalRenderer = new LexicalHtmlRenderer();

/**
 * Renders a Lexical `description` field to HTML and sanitizes it with
 * DOMPurify before it's ever sent to a client that renders it with `{@html}`.
 * Always use this instead of calling the Lexical renderer directly.
 */
export async function renderSanitizedDescription({
	description,
	logContext
}: {
	description: SerializedEditorState | null | undefined;
	logContext: Record<string, unknown>;
}): Promise<string | null> {
	if (!description?.root?.children?.length) {
		return null;
	}

	try {
		const rendered = await lexicalRenderer.render(description);
		return sanitize(rendered);
	} catch (err) {
		log.warn({ err, ...logContext }, 'Failed to render description');
		return null;
	} finally {
		clearWindow(); // Release JSDom resources to avoid memory accumulation
	}
}
