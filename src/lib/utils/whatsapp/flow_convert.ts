/**
 * Converters between Form-friendly format and Internal format (WhatsApp official)
 *
 * Form Format: Easy to edit in UI with simple field structure
 * Internal Format: WhatsApp official format + metadata (stored in database)
 */

import type {
	WhatsappFlowSurveySchema,
	WhatsappFlowInternal
} from '$lib/schema/whatsapp/flows/schema';
import type { EventSettings } from '$lib/schema/event/settings';
import type { PetitionSettingsSchema } from '$lib/schema/petition/settings';
import type { SurveyCollection } from '$lib/schema/survey/collection';
import type {
	WhatsAppFlowScreen,
	WhatsAppFlowComponent,
	WhatsAppTextInput,
	WhatsAppTextArea,
	WhatsAppRadioButtonsGroup,
	WhatsAppCheckboxGroup,
	WhatsAppDatePicker,
	WhatsAppOptIn,
	WhatsAppFooter,
	YCloudCreateFlowRequest
} from '$lib/schema/whatsapp/ycloud/flow_json_types';
import { v7 as uuidv7 } from 'uuid';

/**
 * Convert from form to internal format
 */
export function convertFormToInternal(formFlow: WhatsappFlowSurveySchema): WhatsappFlowInternal {
	const screens: WhatsAppFlowScreen[] = formFlow.screens.map((screen, index) => {
		const isLastScreen = index === formFlow.screens.length - 1;
		const nextScreenId = !isLastScreen ? formFlow.screens[index + 1]?.id : undefined;

		// Convert fields to WhatsApp components
		const components: WhatsAppFlowComponent[] = screen.fields.map((field) => {
			switch (field.type) {
				case 'TextInput': {
					const component: WhatsAppTextInput = {
						type: 'TextInput',
						name: field.id,
						label: field.label,
						required: field.required,
						'input-type':
							(field.inputType as 'text' | 'email' | 'phone' | 'number' | 'password') || 'text',
						visible: field.visible ?? true
					};
					if (field.minChars !== undefined) component['min-chars'] = field.minChars;
					if (field.maxChars !== undefined) component['max-chars'] = field.maxChars;
					if (field.helperText) component['helper-text'] = field.helperText;
					if (field.initValue !== undefined) component['init-value'] = field.initValue;
					if (field.pattern) component.pattern = field.pattern;
					return component;
				}

				case 'TextArea': {
					const component: WhatsAppTextArea = {
						type: 'TextArea',
						name: field.id,
						label: field.label,
						required: field.required,
						visible: field.visible ?? true
					};
					if (field.maxLength !== undefined) component['max-length'] = field.maxLength;
					if (field.helperText) component['helper-text'] = field.helperText;
					if (field.initValue !== undefined) component['init-value'] = field.initValue;
					return component;
				}

				case 'RadioButtonsGroup': {
					const component: WhatsAppRadioButtonsGroup = {
						type: 'RadioButtonsGroup',
						name: field.id,
						label: field.label,
						required: field.required,
						'data-source': field.options,
						visible: field.visible ?? true
					};
					if (field.initValue !== undefined) component['init-value'] = field.initValue;
					return component;
				}

				case 'CheckboxGroup': {
					const component: WhatsAppCheckboxGroup = {
						type: 'CheckboxGroup',
						name: field.id,
						label: field.label,
						required: field.required,
						'data-source': field.options,
						visible: field.visible ?? true
					};
					if (field.minSelectedItems !== undefined)
						component['min-selected-items'] = field.minSelectedItems;
					if (field.maxSelectedItems !== undefined)
						component['max-selected-items'] = field.maxSelectedItems;
					if (field.initValue !== undefined) component['init-value'] = field.initValue;
					return component;
				}

				case 'DatePicker': {
					const component: WhatsAppDatePicker = {
						type: 'DatePicker',
						name: field.id,
						label: field.label,
						required: field.required,
						visible: field.visible ?? true
					};
					if (field.minDate) component['min-date'] = field.minDate;
					if (field.maxDate) component['max-date'] = field.maxDate;
					if (field.unavailableDates) component['unavailable-dates'] = field.unavailableDates;
					if (field.helperText) component['helper-text'] = field.helperText;
					if (field.initValue !== undefined) component['init-value'] = field.initValue;
					return component;
				}

				case 'OptIn': {
					const component: WhatsAppOptIn = {
						type: 'OptIn',
						name: field.id,
						label: field.label,
						required: field.required,
						visible: field.visible ?? true
					};
					if (field.initValue !== undefined) component['init-value'] = field.initValue;
					return component;
				}

				default:
					throw new Error(`Unknown field type: ${(field as { type: string }).type}`);
			}
		});

		// Add footer navigation
		const footer: WhatsAppFooter = isLastScreen
			? {
					type: 'Footer',
					label: 'Submit',
					'on-click-action': {
						name: 'complete',
						payload: {}
					}
				}
			: {
					type: 'Footer',
					label: 'Next',
					'on-click-action': {
						name: 'navigate',
						payload: { screen: nextScreenId }
					}
				};

		components.push(footer);

		return {
			id: screen.id,
			title: screen.title,
			terminal: isLastScreen,
			success: isLastScreen,
			data: {},
			layout: {
				type: 'SingleColumnLayout',
				children: components
			}
		};
	});

	return {
		version: formFlow.version,
		screens,
		metadata: formFlow.metadata
	};
}

/**
 * Convert internal format to form-friendly format
 * Used when loading from the database to the UI for editing
 */
export function convertInternalToForm(
	internalFlow: WhatsappFlowInternal
): WhatsappFlowSurveySchema {
	const screens = internalFlow.screens.map((screen) => {
		// Filter out Footer components and convert back to fields
		const fields = screen.layout.children
			.filter((component) => component.type !== 'Footer')
			.map((component) => {
				if (component.type === 'TextHeading') {
					// Skip text headings in form conversion
					return null;
				}

				// Type guards ensure safe access to component properties
				const hasName = 'name' in component;
				if (!hasName) return null;

				const baseField = {
					id: component.name,
					label: component.label,
					required: component.required,
					visible: component.visible ?? true
				};

				switch (component.type) {
					case 'TextInput': {
						const c = component as WhatsAppTextInput;
						return {
							type: 'TextInput' as const,
							...baseField,
							inputType: c['input-type'] || 'text',
							...(c['min-chars'] !== undefined && { minChars: c['min-chars'] }),
							...(c['max-chars'] !== undefined && { maxChars: c['max-chars'] }),
							...(c['helper-text'] && { helperText: c['helper-text'] }),
							...(c['init-value'] !== undefined && { initValue: c['init-value'] }),
							...(c.pattern && { pattern: c.pattern })
						};
					}

					case 'TextArea': {
						const c = component as WhatsAppTextArea;
						return {
							type: 'TextArea' as const,
							...baseField,
							...(c['max-length'] !== undefined && { maxLength: c['max-length'] }),
							...(c['helper-text'] && { helperText: c['helper-text'] }),
							...(c['init-value'] !== undefined && { initValue: c['init-value'] })
						};
					}

					case 'RadioButtonsGroup': {
						const c = component as WhatsAppRadioButtonsGroup;
						return {
							type: 'RadioButtonsGroup' as const,
							...baseField,
							options: c['data-source'],
							...(c['init-value'] !== undefined && { initValue: c['init-value'] })
						};
					}

					case 'CheckboxGroup': {
						const c = component as WhatsAppCheckboxGroup;
						return {
							type: 'CheckboxGroup' as const,
							...baseField,
							options: c['data-source'],
							...(c['min-selected-items'] !== undefined && {
								minSelectedItems: c['min-selected-items']
							}),
							...(c['max-selected-items'] !== undefined && {
								maxSelectedItems: c['max-selected-items']
							}),
							...(c['init-value'] !== undefined && { initValue: c['init-value'] })
						};
					}

					case 'DatePicker': {
						const c = component as WhatsAppDatePicker;
						return {
							type: 'DatePicker' as const,
							...baseField,
							...(c['min-date'] && { minDate: c['min-date'] }),
							...(c['max-date'] && { maxDate: c['max-date'] }),
							...(c['unavailable-dates'] && { unavailableDates: c['unavailable-dates'] }),
							...(c['helper-text'] && { helperText: c['helper-text'] }),
							...(c['init-value'] !== undefined && { initValue: c['init-value'] })
						};
					}

					case 'OptIn': {
						const c = component as WhatsAppOptIn;
						return {
							type: 'OptIn' as const,
							...baseField,
							...(c['init-value'] !== undefined && { initValue: c['init-value'] })
						};
					}

					default:
						throw new Error(`Unknown component type: ${(component as { type: string }).type}`);
				}
			})
			.filter((f) => f !== null); // Remove null entries (text headings)

		return {
			id: screen.id,
			title: screen.title,
			description: screen.title, // Use title as description fallback
			fields
		};
	});

	return {
		version: internalFlow.version,
		metadata: internalFlow.metadata,
		screens
	};
}

/**
 * Convert internal format to YCloud API request
 * Strips metadata and wraps flow in YCloud request structure
 */
export function convertInternalToYCloudRequest(
	internal: WhatsappFlowInternal,
	options: {
		wabaId: string;
		publish?: boolean;
		endpointUri?: string;
		categories?: string[];
		cloneFlowId?: string;
	}
): YCloudCreateFlowRequest {
	console.debug({ flowId: internal.metadata.id }, 'Converting to YCloud API request');

	// Strip metadata and stringify the flow JSON
	const flowJson = JSON.stringify({
		version: internal.version,
		...(internal.data_api_version && { data_api_version: internal.data_api_version }),
		...(internal.routing_model && { routing_model: internal.routing_model }),
		screens: internal.screens
	});

	return {
		wabaId: options.wabaId,
		name: `${internal.metadata.id} - ${internal.metadata.title}`,
		categories: options.categories || ['SURVEY'],
		flowJson,
		publish: options.publish || false,
		...(options.endpointUri && { endpointUri: options.endpointUri }),
		...(options.cloneFlowId && { cloneFlowId: options.cloneFlowId })
	};
}

/**
 * Validate that the internal format is properly structured for YCloud
 */

// TODO: This should probably be part of a test suite but it does help with validation here
export function validateInternalForYCloud(internal: WhatsappFlowInternal): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Check version
	if (internal.version !== '7.2') {
		errors.push(`Invalid version: ${internal.version}. Expected 7.2`);
	}

	// Check screens exist
	if (!internal.screens || internal.screens.length === 0) {
		errors.push('Flow must have at least one screen');
	}

	// Check each screen has proper structure
	internal.screens.forEach((screen, index) => {
		if (!screen.layout || screen.layout.type !== 'SingleColumnLayout') {
			errors.push(`Screen ${index} must have SingleColumnLayout`);
		}

		if (!screen.layout.children || screen.layout.children.length === 0) {
			errors.push(`Screen ${index} must have at least one component`);
		}

		// Check for footer
		const hasFooter = screen.layout.children.some((child) => child.type === 'Footer');
		if (!hasFooter) {
			errors.push(`Screen ${index} must have a Footer component`);
		}
	});

	return {
		isValid: errors.length === 0,
		errors
	};
}

function pushBaseSignupPersonFields(components: WhatsAppFlowComponent[]): void {
	components.push(
		{
			type: 'TextInput',
			name: 'givenName',
			label: 'Given name',
			required: true,
			'input-type': 'text',
			visible: true
		},
		{
			type: 'TextInput',
			name: 'familyName',
			label: 'Family name',
			required: true,
			'input-type': 'text',
			visible: true
		},
		{
			type: 'TextInput',
			name: 'emailAddress',
			label: 'Email',
			required: false,
			'input-type': 'email',
			visible: true
		},
		{
			type: 'TextInput',
			name: 'phoneNumber',
			label: 'Phone Number',
			required: true,
			'input-type': 'phone',
			visible: true
		}
	);
}

/**
 * Maps survey collections to WhatsApp flow components (shared by event + petition flows).
 * Note: `custom.dropdown` intentionally falls through to `custom.emailInput` (legacy behavior).
 */
function pushSurveyQuestionComponentsFromCollections(
	components: WhatsAppFlowComponent[],
	collections: readonly SurveyCollection[]
): void {
	collections.forEach((collection) => {
		(collection.questions ?? []).forEach((question) => {
			const base = {
				name: question.id,
				label: question.label,
				required: question.required,
				visible: true
			};
			switch (question.type) {
				case 'person.dateOfBirth':
					components.push({ ...base, type: 'DatePicker' });
					break;
				case 'person.gender':
					components.push({
						...base,
						type: 'RadioButtonsGroup',
						'data-source': [
							{ id: 'male', title: 'Male' },
							{ id: 'female', title: 'Female' },
							{ id: 'other', title: 'Other' },
							{ id: 'not-specified', title: 'Prefer not to say' }
						]
					});
					break;
				case 'person.address': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'text' }); //will need to use the google places API to extract the address components (or, if that becomes too expensive, switch to https://www.postalparser.com/#pricing or selfhosted libpostal)
					break;
				}
				case 'person.workplace': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'text' });
					break;
				}
				case 'person.position': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'text' });
					break;
				}
				case 'custom.checkboxGroup': {
					components.push({
						...base,
						type: 'CheckboxGroup',
						'data-source': question.options.map((option) => ({ id: option, title: option }))
					});
					break;
				}
				case 'custom.textInput': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'text' });
					break;
				}
				case 'custom.textarea': {
					components.push({ ...base, type: 'TextArea' });
					break;
				}
				case 'custom.numberInput': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'number' });
					break;
				}
				case 'custom.dateInput': {
					components.push({ ...base, type: 'DatePicker' });
					break;
				}
				case 'custom.dropdown': {
					components.push({
						...base,
						type: 'Dropdown',
						'data-source': question.options.map((option) => ({ id: option, title: option }))
					});
				}
				case 'custom.emailInput': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'email' });
					break;
				}
				case 'custom.phoneInput': {
					components.push({ ...base, type: 'TextInput', 'input-type': 'phone' });
					break;
				}
				case 'custom.radioGroup': {
					components.push({
						...base,
						type: 'RadioButtonsGroup',
						'data-source': question.options.map((option) => ({ id: option, title: option }))
					});
					break;
				}
				default:
					break;
			}
		});
	});
}

type SignupFlowKind = 'event' | 'petition';

function buildSignupFlowFromSurveyCollections(params: {
	kind: SignupFlowKind;
	resourceId: string;
	title: string;
	organizationId: string;
	collections: readonly SurveyCollection[];
	existingFlowId?: string;
	existingFlowYCloudId?: string;
	existingFlowCreatedAt?: number;
}): WhatsappFlowInternal {
	const {
		kind,
		resourceId,
		title,
		organizationId,
		collections,
		existingFlowId,
		existingFlowYCloudId,
		existingFlowCreatedAt
	} = params;

	const components: WhatsAppFlowComponent[] = [];
	pushBaseSignupPersonFields(components);
	pushSurveyQuestionComponentsFromCollections(components, collections);

	const resourceSuffix = kind === 'event' ? 'Registration' : 'Signature';
	const descriptionPrefix = kind === 'event' ? 'Registration form' : 'Signature form';

	const footer: WhatsAppFooter = {
		type: 'Footer',
		label: 'Submit',
		'on-click-action': {
			name: 'complete',
			payload: {
				givenName: '${form.givenName}',
				familyName: '${form.familyName}',
				emailAddress: '${form.emailAddress}',
				phoneNumber: '${form.phoneNumber}',
				...Object.fromEntries(
					collections.flatMap((collection) =>
						(collection.questions ?? []).map((question) => [question.id, `\${form.${question.id}}`])
					)
				),
				resource_type: kind,
				resource_id: resourceId
			}
		}
	};
	components.push(footer);

	const screen: WhatsAppFlowScreen = {
		id: 'registration', // TODO: make this unique. Only letters and underscore allowed
		title: `${title} - ${resourceSuffix}`,
		terminal: true,
		success: true,
		data: {},
		layout: {
			type: 'SingleColumnLayout',
			children: components
		}
	};

	return {
		version: '7.2',
		screens: [screen],
		metadata: {
			id: existingFlowId || uuidv7(),
			ycloudFlowId: existingFlowYCloudId,
			title,
			description: `${descriptionPrefix} for ${title}`,
			createdAt: existingFlowCreatedAt || Date.now(),
			updatedAt: Date.now(),
			organizationId,
			...(kind === 'event' ? { sourceEventId: resourceId } : { sourcePetitionId: resourceId })
		}
	};
}

/**
 * Convert event signup fields to WhatsApp Flow format
 */
export function convertEventSignupFieldsToFlow({
	eventId,
	eventTitle,
	organizationId,
	settings,
	existingFlowId,
	existingFlowYCloudId,
	existingFlowCreatedAt
}: {
	eventId: string;
	eventTitle: string;
	organizationId: string;
	settings: EventSettings;
	existingFlowId?: string;
	existingFlowYCloudId?: string;
	existingFlowCreatedAt?: number;
}): WhatsappFlowInternal {
	const collections = settings.survey?.collections ?? [];
	return buildSignupFlowFromSurveyCollections({
		kind: 'event',
		resourceId: eventId,
		title: eventTitle,
		organizationId,
		collections,
		existingFlowId,
		existingFlowYCloudId,
		existingFlowCreatedAt
	});
}

/**
 * Convert petition signup fields to WhatsApp Flow format
 */
export function convertPetitionSignupFieldsToFlow({
	petitionId,
	petitionTitle,
	organizationId,
	settings,
	existingFlowId,
	existingFlowYCloudId,
	existingFlowCreatedAt
}: {
	petitionId: string;
	petitionTitle: string;
	organizationId: string;
	settings: PetitionSettingsSchema;
	existingFlowId?: string;
	existingFlowYCloudId?: string;
	existingFlowCreatedAt?: number;
}): WhatsappFlowInternal {
	const collections = settings.survey?.collections ?? [];
	return buildSignupFlowFromSurveyCollections({
		kind: 'petition',
		resourceId: petitionId,
		title: petitionTitle,
		organizationId,
		collections,
		existingFlowId,
		existingFlowYCloudId,
		existingFlowCreatedAt
	});
}
