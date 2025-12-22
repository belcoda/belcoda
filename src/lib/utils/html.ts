export function stripHtmlAndTrim(html: string): string {
	const withSpaces = html
		.replace(/<\s*(p|br)[^>]*>/gi, ' ') // Replace <p>, <br> with space
		.replace(/<\/p>/gi, ' '); // Replace </p> with space

	const noTags = withSpaces.replace(/<[^>]*>/g, ''); // Remove other tags
	const normalized = noTags.replace(/\s+/g, ' ').trim(); // Normalize spaces

	return normalized.slice(0, 90);
}
export function stripHtmlTags(html: string): string {
	//replace <p> and <br> with line breaks
	const withLineBreaks = html.replace(/<\s*(p|br)[^>]*>/gi, '\n');
	const noTags = withLineBreaks.replace(/<[^>]*>/g, ''); // Remove other tags
	const normalized = noTags.replace(/[ \t]+/g, ' ').trim(); // Only normalize horizontal whitespace

	return normalized;
}

export function decodeHTMLEntities(text: string): string {
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&nbsp;': ' '
	};

	return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);
}

export function htmlToPlaintext(html: string): string {
	if (!html) return '';

	let text = html;

	// Convert <strong>/<b> to **text**
	text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**');

	// Convert <em>/<i> to _text_
	text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '_$2_');

	// Convert <br> to line breaks
	text = text.replace(/<\s*br\s*\/?>/gi, '\n');

	// Convert <p> to double line breaks
	text = text.replace(/<\s*p[^>]*>/gi, '\n\n').replace(/<\s*\/p\s*>/gi, '');

	// Strip all other tags
	text = text.replace(/<[^>]+>/g, '');

	// Decode HTML entities
	text = decodeHTMLEntities(text);

	// Normalize spacing
	return text.replace(/\n{3,}/g, '\n\n').trim();
}
