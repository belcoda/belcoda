export function encodeCursor(values: Record<string, string | number | null>): string {
	return btoa(JSON.stringify(values));
}

export function decodeCursorOrNull<T extends Record<string, unknown>>(cursor: string): T | null {
	try {
		const parsed: unknown = JSON.parse(atob(cursor));
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
