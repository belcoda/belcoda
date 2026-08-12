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
	const label = getVariableLabel(param.key);
	if (param.fallback?.trim()) {
		return `${label} → ${param.fallback}`;
	}
	return label;
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

function applyButtonDefaults(
	currentButtons: { id: string }[],
	templateButtons: TemplateMessageComponents[number] | undefined
): { id: string }[] {
	let buttons = currentButtons.map((b) => ({ ...b }));
	if (templateButtons?.type !== 'BUTTONS' || !templateButtons.buttons) {
		// The template has no BUTTONS component, so the node must have no buttons.
		// Any `currentButtons` here are stale (e.g. the template was edited to drop
		// its buttons); returning them would leave button ids with no rendered handle
		// and orphan the edges wired to them. This runs only once the template query
		// is `complete` (see the guard in TemplateMessage.svelte), so it never wipes
		// buttons mid-load.
		return [];
	}
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
	return buttons;
}

function applyBodyDefaults(
	currentBodyParams: TemplateParamSource[],
	templateBody: TemplateMessageComponents[number] | undefined,
	mergeExisting: boolean
): TemplateParamSource[] {
	if (templateBody?.type !== 'BODY' || !templateBody.example) {
		return [...currentBodyParams];
	}
	const bodyTextExamples = templateBody.example.body_text;
	const examples = Array.isArray(bodyTextExamples?.[0]) ? bodyTextExamples[0] : [];
	if (!mergeExisting) {
		return examples.map((value) => ({ type: 'literal' as const, value }));
	}
	const bodyParams = [...currentBodyParams];
	for (let i = 0; i < examples.length; i++) {
		if (!bodyParams[i]) {
			bodyParams[i] = { type: 'literal', value: examples[i] };
		}
	}
	return bodyParams;
}

function resolveImageUrl(
	currentUrl: string | null,
	exampleUrl: string | undefined,
	mergeExisting: boolean
): string | null {
	return mergeExisting ? currentUrl || exampleUrl || null : (exampleUrl ?? null);
}

function resolveTextHeaderParams(
	currentParams: TemplateParamSource[],
	exampleText: string,
	mergeExisting: boolean
): TemplateParamSource[] {
	if (!mergeExisting) {
		return exampleText ? [{ type: 'literal', value: exampleText }] : [];
	}
	const params = [...currentParams];
	if (!params[0]) {
		params[0] = { type: 'literal', value: exampleText };
	}
	return params;
}

function getImageHeaderExampleUrl(
	templateHeader: Extract<TemplateMessageComponents[number], { type: 'HEADER'; format: 'IMAGE' }>
): string | undefined {
	const headerUrl = templateHeader.example?.header_url;
	return Array.isArray(headerUrl) ? headerUrl[0] : undefined;
}

function getTextHeaderExample(
	templateHeader: Extract<TemplateMessageComponents[number], { type: 'HEADER'; format: 'TEXT' }>
): string {
	const headerText = templateHeader.example?.header_text;
	return Array.isArray(headerText) ? headerText[0] || '' : '';
}

function applyHeaderDefaults(
	currentHeaderParams: TemplateParamSource[],
	currentHeaderImageUrl: string | null,
	templateHeader: TemplateMessageComponents[number] | undefined,
	mergeExisting: boolean
): { headerParams: TemplateParamSource[]; headerImageUrl: string | null } {
	if (templateHeader?.type !== 'HEADER') {
		return { headerParams: [], headerImageUrl: null };
	}
	if (templateHeader.format === 'IMAGE') {
		return {
			headerParams: [],
			headerImageUrl: resolveImageUrl(
				currentHeaderImageUrl,
				getImageHeaderExampleUrl(templateHeader),
				mergeExisting
			)
		};
	}
	if (templateHeader.format === 'TEXT') {
		return {
			headerParams: resolveTextHeaderParams(
				currentHeaderParams,
				getTextHeaderExample(templateHeader),
				mergeExisting
			),
			headerImageUrl: null
		};
	}
	return { headerParams: [...currentHeaderParams], headerImageUrl: currentHeaderImageUrl };
}

export function applyTemplateDefaults(
	current: TemplateMessageFormState,
	components: TemplateMessageComponents,
	options: { mergeExisting: boolean }
): TemplateMessageFormState {
	const templateHeader = components.find((c) => c.type === 'HEADER');
	const templateBody = components.find((c) => c.type === 'BODY');
	const templateButtons = components.find((c) => c.type === 'BUTTONS');

	const buttons = applyButtonDefaults(current.buttons, templateButtons);
	const bodyParams = applyBodyDefaults(current.bodyParams, templateBody, options.mergeExisting);
	const { headerParams, headerImageUrl } = applyHeaderDefaults(
		current.headerParams,
		current.headerImageUrl,
		templateHeader,
		options.mergeExisting
	);

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
