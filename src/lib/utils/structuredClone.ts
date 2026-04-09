/**
 * Polyfill for structuredClone to ensure compatibility across all environments.
 * structuredClone is a native function in modern browsers and Node.js 17+,
 * but may not be available in older environments or certain test runners.
 */

export function structuredClone<T>(value: T): T {
	// Guard against undefined to prevent JSON.parse(undefined) crash
	if (value === undefined) {
		return value;
	}

	if (typeof globalThis.structuredClone === 'function') {
		return globalThis.structuredClone(value);
	}

	// Fallback implementation using JSON serialization
	// This works for most cases but has limitations:
	// - Doesn't handle functions, symbols, or undefined values
	// - Doesn't preserve prototype chains
	// - Doesn't handle circular references
	// However, it's sufficient for the simple object cloning used in this codebase
	return JSON.parse(JSON.stringify(value));
}
