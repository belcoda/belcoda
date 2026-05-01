import type { TemplateVariable } from '$lib/schema/template-variables';

export function formatTemplateVariableToken(variable: Pick<TemplateVariable, 'key'> | string) {
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

export function insertTemplateVariableToken(
	value: string,
	token: string,
	selectionStart?: number | null,
	selectionEnd?: number | null
): TemplateVariableTextInsertion {
	const fallbackIndex = value.length;
	const start = normalizeSelectionIndex(selectionStart, fallbackIndex, value.length);
	const end = normalizeSelectionIndex(selectionEnd, start, value.length);
	const rangeStart = Math.min(start, end);
	const rangeEnd = Math.max(start, end);
	const nextValue = `${value.slice(0, rangeStart)}${token}${value.slice(rangeEnd)}`;
	const cursorPosition = rangeStart + token.length;

	return {
		value: nextValue,
		cursorPosition
	};
}
