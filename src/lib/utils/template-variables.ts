import type { TemplateVariable } from '$lib/schema/template-variables';

export function formatTemplateVariableToken(variable: Pick<TemplateVariable, 'key'> | string) {
	const key = typeof variable === 'string' ? variable : variable.key;
	return `{{${key}}}`;
}
