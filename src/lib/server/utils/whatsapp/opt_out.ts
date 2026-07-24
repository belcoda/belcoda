const WHATSAPP_OPT_OUT_KEYWORDS = new Set(['STOP']);

function normalizeOptOutMessage(message: string): string {
	return message
		.normalize('NFKC')
		.trim()
		.toUpperCase()
		.replace(/[.!?,;:]+$/u, '')
		.trimEnd();
}

export function isWhatsappOptOutMessage(message: string): boolean {
	return WHATSAPP_OPT_OUT_KEYWORDS.has(normalizeOptOutMessage(message));
}
