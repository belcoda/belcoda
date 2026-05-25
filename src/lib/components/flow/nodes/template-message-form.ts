import { v4 as uuidv4 } from 'uuid';
import type { WhatsappTemplateMessageData } from '$lib/schema/flow/index';
import type { TemplateMessageComponents } from '$lib/schema/whatsapp/template/index';
import type { TemplateParamSource, TemplateVariableKey } from '$lib/schema/template-variables';
import { t } from '$lib/index.svelte';

export type TemplateMessageFormState = {
	templateId: string;
	headerParams: TemplateParamSource[];
	bodyParams: TemplateParamSource[];
	buttons: { id: string }[];
	headerImageUrl: string | null;
};

export function getInitialParamSources(
	templateParams: TemplateParamSource[] | undefined,
	templateStrings: string[] | undefined
): TemplateParamSource[] {
	if (templateParams) {
		return templateParams.map((param) => ({ ...param }));
	}
	return templateStrings?.map((value) => ({ type: 'literal' as const, value })) ?? [];
}

export function cloneTemplateMessageData(
	data: WhatsappTemplateMessageData
): TemplateMessageFormState {
	return {
		templateId: data.templateId,
		headerParams: getInitialParamSources(data.header?.templateParams, data.header?.templateStrings),
		bodyParams: getInitialParamSources(data.body?.templateParams, data.body?.templateStrings),
		buttons: (data.buttons ?? []).map((b) => ({ ...b })),
		headerImageUrl: data.header?.imageUrl ?? null
	};
}

export function getParamTemplateString(param: TemplateParamSource | undefined) {
	if (!param) return '';
	if (param.type === 'literal') return param.value;
	return param.fallback ?? '';
}

export function getParamDisplayValue(
	params: TemplateParamSource[],
	index: number,
	placeholder: string
) {
	const param = params[index];
	if (!param) return placeholder;
	if (param.type === 'literal') return param.value || placeholder;
	return param.fallback || getVariableLabel(param.key);
}

export function getVariableLabel(key: TemplateVariableKey) {
	switch (key) {
		case 'person.given_name':
			return t`Given name`;
		case 'person.family_name':
			return t`Family name`;
		case 'person.email_address':
			return t`Email address`;
		case 'person.phone_number':
			return t`Phone number`;
		case 'organization.name':
			return t`Organization name`;
		case 'organization.slug':
			return t`Organization slug`;
		case 'sender.name':
			return t`Sender name`;
		case 'sender.email':
			return t`Sender email`;
		case 'event.name':
			return t`Event name`;
		case 'event.start_date':
			return t`Event start date`;
		case 'event.location':
			return t`Event location`;
		case 'petition.name':
			return t`Petition name`;
		case 'petition.goal_count':
			return t`Petition goal`;
		default:
			return key;
	}
}

export function getParamSource(params: TemplateParamSource[], index: number): TemplateParamSource {
	return params[index] ?? { type: 'literal', value: '' };
}

export function buildNodeData(state: TemplateMessageFormState): WhatsappTemplateMessageData {
	return {
		templateId: state.templateId,
		header: {
			templateStrings: state.headerParams.map(getParamTemplateString),
			templateParams: state.headerParams.map((p) => ({ ...p })),
			imageUrl: state.headerImageUrl
		},
		body: {
			templateStrings: state.bodyParams.map(getParamTemplateString),
			templateParams: state.bodyParams.map((p) => ({ ...p }))
		},
		buttons: state.buttons.map((b) => ({ ...b }))
	};
}

export function applyTemplateDefaults(
	current: TemplateMessageFormState,
	components: TemplateMessageComponents,
	options: { mergeExisting: boolean }
): TemplateMessageFormState {
	const templateHeader = components.find((c) => c.type === 'HEADER');
	const templateBody = components.find((c) => c.type === 'BODY');
	const templateButtons = components.find((c) => c.type === 'BUTTONS');

	let headerParams = [...current.headerParams];
	let bodyParams = [...current.bodyParams];
	let buttons = current.buttons.map((b) => ({ ...b }));
	let headerImageUrl = current.headerImageUrl;

	if (templateButtons?.type === 'BUTTONS' && templateButtons.buttons) {
		const targetLength = templateButtons.buttons.length;
		if (buttons.length > targetLength) {
			buttons = buttons.slice(0, targetLength);
		}
		if (buttons.length < targetLength) {
			buttons = [
				...buttons,
				...templateButtons.buttons.slice(buttons.length).map(() => ({ id: uuidv4() }))
			];
		}
	}

	if (templateBody?.type === 'BODY' && templateBody.example) {
		const bodyTextExamples = templateBody.example.body_text;
		const examples = Array.isArray(bodyTextExamples?.[0]) ? bodyTextExamples[0] : [];
		if (options.mergeExisting) {
			bodyParams = [...bodyParams];
			for (let i = 0; i < examples.length; i++) {
				if (!bodyParams[i]) {
					bodyParams[i] = { type: 'literal', value: examples[i] };
				}
			}
		} else {
			bodyParams = examples.map((value) => ({ type: 'literal' as const, value }));
		}
	}

	if (!templateHeader) {
		headerParams = [];
		headerImageUrl = null;
	} else if (
		templateHeader.format === 'IMAGE' &&
		templateHeader.example &&
		'header_url' in templateHeader.example &&
		Array.isArray(templateHeader.example.header_url)
	) {
		const exampleUrl = templateHeader.example.header_url[0];
		headerImageUrl = options.mergeExisting
			? headerImageUrl || exampleUrl || null
			: (exampleUrl ?? null);
		headerParams = [];
	} else if (templateHeader.format === 'TEXT') {
		const headerExample = templateHeader.example;
		const exampleText =
			headerExample && 'header_text' in headerExample && Array.isArray(headerExample.header_text)
				? headerExample.header_text[0] || ''
				: '';
		if (options.mergeExisting) {
			headerParams = [...headerParams];
			if (!headerParams[0]) {
				headerParams[0] = { type: 'literal', value: exampleText };
			}
		} else {
			headerParams = exampleText ? [{ type: 'literal', value: exampleText }] : [];
		}
		headerImageUrl = null;
	}

	return {
		...current,
		headerParams,
		bodyParams,
		buttons,
		headerImageUrl
	};
}

export function patchParamSource(
	params: TemplateParamSource[],
	index: number,
	source: TemplateParamSource
): TemplateParamSource[] {
	return params.map((p, i) => (i === index ? { ...source } : p));
}

export function patchParamSourceType(
	params: TemplateParamSource[],
	index: number,
	type: TemplateParamSource['type']
): TemplateParamSource[] {
	const current = getParamSource(params, index);
	if (type === 'literal') {
		return patchParamSource(params, index, {
			type: 'literal',
			value: getParamTemplateString(current)
		});
	}
	return patchParamSource(params, index, {
		type: 'variable',
		key: current.type === 'variable' ? current.key : 'person.given_name',
		fallback: getParamTemplateString(current)
	});
}
