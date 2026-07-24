const WHATSAPP_OPT_OUT_KEYWORDS = new Set(['STOP']);
const TRAILING_PUNCTUATION = new Set('.!?,;:');

function stripTrailingPunctuation(message: string): string {
	let end = message.length;
	while (end > 0 && TRAILING_PUNCTUATION.has(message[end - 1]!)) {
		end--;
	}
	return message.slice(0, end);
}

function normalizeOptOutMessage(message: string): string {
	return stripTrailingPunctuation(message.normalize('NFKC').trim().toUpperCase()).trimEnd();
}

export function isWhatsappOptOutMessage(message: string): boolean {
	return WHATSAPP_OPT_OUT_KEYWORDS.has(normalizeOptOutMessage(message));
}
