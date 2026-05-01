import type { TemplateVariable, TemplateVariableKey } from '$lib/schema/template-variables';

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
