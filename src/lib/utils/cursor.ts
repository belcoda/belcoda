function encodeBase64Utf8(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

function decodeBase64Utf8(base64: string): string {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

export function encodeCursor(values: Record<string, string | number | null>): string {
	return encodeBase64Utf8(JSON.stringify(values));
}

export function decodeCursorOrNull<T extends Record<string, unknown>>(cursor: string): T | null {
	try {
		const parsed: unknown = JSON.parse(decodeBase64Utf8(cursor));
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			return null;
		}
		return parsed as T;
	} catch {
		return null;
	}
}

export function decodeCursor<T extends Record<string, unknown>>(cursor: string): T {
	const decoded = decodeCursorOrNull<T>(cursor);
	if (decoded === null) {
		throw new Error('Invalid cursor');
	}
	return decoded;
}
