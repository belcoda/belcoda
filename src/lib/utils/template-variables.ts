import type {
	TemplateParamSource,
	TemplateVariable,
	TemplateVariableKey
} from '$lib/schema/template-variables';
import { templateVariableKeys } from '$lib/schema/template-variables';

export type TemplateVariableValueMap = Partial<
	Record<TemplateVariableKey, string | null | undefined>
>;

/**
 * Converts a variable key into the token users insert into message templates.
 */
export function formatTemplateVariable(
	variable: Pick<TemplateVariable, 'key'> | TemplateVariableKey
) {
	const key = typeof variable === 'string' ? variable : variable.key;
	return `{{${key}}}`;
}

export type TemplateVariableTextInsertion = {
	value: string;
	cursorPosition: number;
};

function normalizeSelectionIndex(
	index: number | null | undefined,
	fallback: number,
	valueLength: number
) {
	if (typeof index !== 'number' || Number.isNaN(index)) {
		return fallback;
	}

	return Math.min(Math.max(index, 0), valueLength);
}

/**
 * Inserts a template variable into plain text, replacing any selected range.
 * The cursor position is returned so callers can restore focus after Svelte updates the input value.
 */
export function insertTemplateVariable(
	value: string,
	variable: string,
	selectionStart?: number | null,
	selectionEnd?: number | null
): TemplateVariableTextInsertion {
	const fallbackIndex = value.length;
	const start = normalizeSelectionIndex(selectionStart, fallbackIndex, value.length);
	const end = normalizeSelectionIndex(selectionEnd, start, value.length);
	const rangeStart = Math.min(start, end);
	const rangeEnd = Math.max(start, end);
	const nextValue = `${value.slice(0, rangeStart)}${variable}${value.slice(rangeEnd)}`;
	const cursorPosition = rangeStart + variable.length;

	return {
		value: nextValue,
		cursorPosition
	};
}

/**
 * Resolves stored parameter sources into the ordered strings WhatsApp expects.
 * Existing templateStrings are treated as literal values until a draft is migrated to templateParams.
 */
export function resolveTemplateParamSources({
	templateParams,
	templateStrings,
	values
}: {
	templateParams?: readonly TemplateParamSource[] | null;
	templateStrings?: readonly string[] | null;
	values: TemplateVariableValueMap;
}): string[] {
	const sources =
		templateParams ?? templateStrings?.map((value) => ({ type: 'literal' as const, value })) ?? [];

	return sources.map((source) => {
		if (source.type === 'literal') {
			return source.value;
		}

		return values[source.key] || source.fallback || '';
	});
}

const templateVariableKeySet = new Set<string>(templateVariableKeys);
const templateVariableTokenPattern = /\{\{\s*([a-z_]+\.[a-z_]+)\s*\}\}/g;

/**
 * Replaces named inline template variables in email subject/body content.
 * Unknown variable tokens are preserved so user-written text is not unexpectedly removed.
 */
export function resolveTemplateVariables(value: string, values: TemplateVariableValueMap): string {
	return value.replace(templateVariableTokenPattern, (token, key: string) => {
		if (!templateVariableKeySet.has(key)) {
			return token;
		}

		return values[key as TemplateVariableKey] || '';
	});
}
