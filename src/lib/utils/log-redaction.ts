export const REDACTED_LOG_VALUE = '[REDACTED]';
export const REDACTED_EMAIL_VALUE = '[REDACTED_EMAIL]';

const EMAIL_IN_TEXT = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function normalizeLogKey(key: string): string {
	return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isSensitiveLogKey(key: string): boolean {
	const normalized = normalizeLogKey(key);
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

// Keys in text logs can appear as URL params, headers, or loose pairs:
// `auth_token=...`, `Authorization: Bearer ...`, `x.secret: ...`.
function isKeyCharacter(character: string): boolean {
	const code = character.charCodeAt(0);
	return (
		(code >= 48 && code <= 57) ||
		(code >= 65 && code <= 90) ||
		(code >= 97 && code <= 122) ||
		character === '_' ||
		character === '-' ||
		character === '.'
	);
}

// Query-style values stop at common delimiters (`&`, space, `;`), but header
// credentials such as `Authorization: Bearer ...` and `Cookie: ...` run to EOL.
function isValueTerminator(character: string, separator: string, key: string): boolean {
	if (character === '\r' || character === '\n') return true;
	const normalized = normalizeLogKey(key);
	if (separator === ':' && (normalized === 'authorization' || normalized.endsWith('cookie'))) {
		return false;
	}
	return (
		character === '&' ||
		character === '#' ||
		character === ';' ||
		character === ',' ||
		character === ' ' ||
		character === '\t'
	);
}

// Linear scanner for sensitive key/value text. It avoids regex backtracking while
// catching `token=secret`, `?token=secret&x=1`, and `Authorization: Bearer secret`.
function redactSensitiveKeyValues(value: string): string {
	let redacted = '';
	let index = 0;

	while (index < value.length) {
		if (!isKeyCharacter(value[index])) {
			redacted += value[index];
			index += 1;
			continue;
		}

		const keyStart = index;
		while (index < value.length && isKeyCharacter(value[index])) index += 1;
		const key = value.slice(keyStart, index);

		while (index < value.length && (value[index] === ' ' || value[index] === '\t')) index += 1;
		const separator = value[index];

		if ((separator !== '=' && separator !== ':') || !isSensitiveLogKey(key)) {
			redacted += value[keyStart];
			index = keyStart + 1;
			continue;
		}

		index += 1;
		while (index < value.length && (value[index] === ' ' || value[index] === '\t')) index += 1;
		const valueStart = index;
		while (index < value.length && !isValueTerminator(value[index], separator, key)) index += 1;

		redacted += value.slice(keyStart, valueStart) + REDACTED_LOG_VALUE;
	}

	return redacted;
}

export function redactSensitiveLogText(value: string): string {
	return redactSensitiveKeyValues(value).replace(EMAIL_IN_TEXT, REDACTED_EMAIL_VALUE);
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
