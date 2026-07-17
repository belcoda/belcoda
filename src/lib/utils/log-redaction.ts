export const REDACTED_LOG_VALUE = '[REDACTED]';
export const REDACTED_EMAIL_VALUE = '[REDACTED_EMAIL]';

const EMAIL_IN_TEXT = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const SENSITIVE_QUERY_VALUE = /([?&][^=&#\s]*(?:token|secret|email)[^=&#\s]*=)[^&#\s]*/gi;

function isSensitiveLogKey(key: string): boolean {
	const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
	return (
		normalized === 'authorization' ||
		normalized.endsWith('token') ||
		normalized.endsWith('cookie') ||
		normalized.endsWith('cookies') ||
		normalized.includes('secret') ||
		normalized === 'email' ||
		normalized === 'emails' ||
		normalized.endsWith('email') ||
		normalized.endsWith('emailaddress') ||
		normalized.endsWith('emailaddresses')
	);
}

export function redactSensitiveLogText(value: string): string {
	return value
		.replace(SENSITIVE_QUERY_VALUE, `$1${REDACTED_LOG_VALUE}`)
		.replace(EMAIL_IN_TEXT, REDACTED_EMAIL_VALUE);
}

function redactValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
	if (typeof value === 'string') return redactSensitiveLogText(value);
	if (value === null || typeof value !== 'object') return value;
	if (value instanceof Date || Buffer.isBuffer(value)) return value;
	if (value instanceof URL) return redactSensitiveLogText(value.toString());
	if (seen.has(value)) return seen.get(value);

	if (value instanceof Error) {
		const redactedError = new Error(redactSensitiveLogText(value.message));
		seen.set(value, redactedError);
		redactedError.name = value.name;
		redactedError.stack = value.stack ? redactSensitiveLogText(value.stack) : undefined;
		for (const [key, nestedValue] of Object.entries(value)) {
			Object.assign(redactedError, {
				[key]: isSensitiveLogKey(key) ? REDACTED_LOG_VALUE : redactValue(nestedValue, seen)
			});
		}
		return redactedError;
	}

	if (Array.isArray(value)) {
		const redactedArray: unknown[] = [];
		seen.set(value, redactedArray);
		for (const item of value) redactedArray.push(redactValue(item, seen));
		return redactedArray;
	}

	const redactedObject: Record<string, unknown> = {};
	seen.set(value, redactedObject);
	for (const [key, nestedValue] of Object.entries(value)) {
		redactedObject[key] = isSensitiveLogKey(key)
			? REDACTED_LOG_VALUE
			: redactValue(nestedValue, seen);
	}
	return redactedObject;
}

export function redactLogArguments<T extends unknown[]>(argumentsToLog: T): T {
	const seen = new WeakMap<object, unknown>();
	return argumentsToLog.map((value) => redactValue(value, seen)) as T;
}
