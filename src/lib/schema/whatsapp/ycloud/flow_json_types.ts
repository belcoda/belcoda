// WhatsApp Flow JSON Schema for YCloud API
// Based on WhatsApp Flows v7.2

// Main WhatsApp Flow JSON structure
export interface WhatsAppFlowJSON {
	version: string;
	data_api_version?: string;
	routing_model?: Record<string, string[]>;
	screens: WhatsAppFlowScreen[];
}

// Individual screen
export interface WhatsAppFlowScreen {
	id: string;
	title: string;
	terminal?: boolean;
	success?: boolean;
	data?: Record<string, unknown>;
	layout: {
		type: 'SingleColumnLayout';
		children: WhatsAppFlowComponent[];
	};
}

// Union of all possible WhatsApp Flow components
export type WhatsAppFlowComponent =
	| WhatsAppDropdown
	| WhatsAppTextHeading
	| WhatsAppTextInput
	| WhatsAppTextArea
	| WhatsAppRadioButtonsGroup
	| WhatsAppCheckboxGroup
	| WhatsAppDatePicker
	| WhatsAppOptIn
	| WhatsAppFooter;

// Text heading component (for descriptions/titles)
export interface WhatsAppTextHeading {
	type: 'TextHeading';
	text: string;
	visible?: boolean;
}

// Text input component
export interface WhatsAppTextInput {
	type: 'TextInput';
	name: string;
	label: string;
	required: boolean;
	'input-type': 'text' | 'email' | 'phone' | 'number' | 'password';
	'min-chars'?: number;
	'max-chars'?: number;
	pattern?: string;
	'helper-text'?: string;
	'init-value'?: string;
	visible: boolean;
}

// Text area component (multi-line text)
export interface WhatsAppTextArea {
	type: 'TextArea';
	name: string;
	label: string;
	required: boolean;
	'max-length'?: number;
	'helper-text'?: string;
	'init-value'?: string;
	visible: boolean;
}

export interface WhatsAppDropdown {
	type: 'Dropdown';
	name: string;
	label: string;
	required: boolean;
	'data-source': Array<{
		id: string;
		title: string;
	}>;
	'init-value'?: string;
	visible: boolean;
}

// Radio buttons group component (single selection)
export interface WhatsAppRadioButtonsGroup {
	type: 'RadioButtonsGroup';
	name: string;
	label: string;
	required: boolean;
	'data-source': Array<{
		id: string;
		title: string;
		description?: string;
	}>;
	'init-value'?: string;
	visible: boolean;
}

// Checkbox group component (multiple selection)
export interface WhatsAppCheckboxGroup {
	type: 'CheckboxGroup';
	name: string;
	label: string;
	required: boolean;
	'data-source': Array<{
		id: string;
		title: string;
		description?: string;
	}>;
	'min-selected-items'?: number;
	'max-selected-items'?: number;
	'init-value'?: string[];
	visible: boolean;
}

// Date picker component
export interface WhatsAppDatePicker {
	type: 'DatePicker';
	name: string;
	label: string;
	required: boolean;
	'min-date'?: string;
	'max-date'?: string;
	'unavailable-dates'?: string[];
	'helper-text'?: string;
	'init-value'?: string;
	visible: boolean;
}

// Opt-in component (checkbox/boolean)
export interface WhatsAppOptIn {
	type: 'OptIn';
	name: string;
	label: string;
	required: boolean;
	'init-value'?: boolean;
	visible: boolean;
}

// Footer component (navigation/action button)
export interface WhatsAppFooter {
	type: 'Footer';
	label: string;
	'on-click-action': {
		name: 'navigate' | 'complete' | 'data_exchange';
		payload: Record<string, unknown>;
	};
}

// YCloud API request format
export interface YCloudCreateFlowRequest {
	wabaId: string;
	name: string;
	categories: string[];
	flowJson: string; // Stringified WhatsAppFlowJSON
	publish?: boolean;
	endpointUri?: string;
	cloneFlowId?: string;
}
