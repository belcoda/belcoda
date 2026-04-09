import pino from '$lib/pino';
import { drizzle } from '$lib/server/db';
import { person as personTable, organization as organizationTable } from '$lib/schema/drizzle';
import { eq } from 'drizzle-orm';
import { sendWhatsappMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { v7 as uuidv7 } from 'uuid';

import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';

import { env as publicEnv } from '$env/dynamic/public';
import { _getEventByIdUnsafe } from '$lib/server/api/data/event/event';
import { completeEventSignupHelper } from '$lib/server/api/data/event/signup';
import { _getPetitionByIdUnsafeNoTenantCheck } from '$lib/server/api/data/petition/petition';
import { completePetitionSignatureHelper } from '$lib/server/api/data/petition/signature';
import { safeGetCountryCodeFromPhoneNumber } from '$lib/utils/phone';
import { parse, safeParse, intersect } from 'valibot';
import type { ServerTransaction } from '@rocicorp/zero';
import {
	personActionHelperWhatsAppFlow,
	personActionHelperCustomFieldsOnly
} from '$lib/schema/person';
import type { FlowResponses } from '$lib/schema/whatsapp/flows/responses';

const log = pino(import.meta.url);

async function sendConfirmationMessage({
	from,
	organizationId,
	eventTitle,
	eventStartDate,
	eventTimezone,
	tx
}: {
	from: string;
	organizationId: string;
	eventTitle: string;
	eventStartDate: Date | null;
	eventTimezone: string;
	tx: ServerTransaction;
}) {
	try {
		// Get workspace settings for WhatsApp phone number
		const organization = await getOrganizationByIdUnsafe({
			organizationId,
			tx
		});

		const waPhoneNumber =
			organization.settings.whatsApp?.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER;
		if (!waPhoneNumber) {
			throw new Error('WhatsApp sender number is not configured');
		}

		// Format event date in the event's timezone if available
		let dateString = 'Date TBA';
		if (eventStartDate) {
			try {
				const formatter = new Intl.DateTimeFormat('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					timeZone: eventTimezone,
					timeZoneName: 'short'
				});
				dateString = formatter.format(new Date(eventStartDate));
			} catch (error) {
				log.error({ error, eventTimezone }, 'Invalid timezone, falling back to UTC');
				// Fallback to UTC if timezone is invalid
				const formatter = new Intl.DateTimeFormat('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					timeZone: 'UTC',
					timeZoneName: 'short'
				});
				dateString = formatter.format(new Date(eventStartDate));
			}
		}

		const confirmationText = `✅ You're registered for *${eventTitle}*!\n\n📅 ${dateString}\n\nWe'll send you a reminder before the event. See you there!`;

		await sendWhatsappMessage({
			from: waPhoneNumber,
			to: from,
			type: 'text',
			externalId: uuidv7(),
			text: {
				body: confirmationText
			}
		});

		log.info({ from, eventTitle }, 'Sent confirmation message after event signup');
	} catch (error) {
		log.error({ error, from, eventTitle }, 'Failed to send confirmation message');
		// Don't throw - confirmation message failure shouldn't break signup
	}
}

async function sendPetitionConfirmationMessage({
	from,
	organizationId,
	petitionTitle,
	tx
}: {
	from: string;
	organizationId: string;
	petitionTitle: string;
	tx: ServerTransaction;
}) {
	try {
		const organization = await getOrganizationByIdUnsafe({
			organizationId,
			tx
		});

		const waPhoneNumber =
			organization.settings.whatsApp?.number || publicEnv.PUBLIC_DEFAULT_WHATSAPP_NUMBER;
		if (!waPhoneNumber) {
			throw new Error('WhatsApp sender number is not configured');
		}

		const confirmationText = `✅ You've signed *${petitionTitle}*! Thank you for your support.`;

		await sendWhatsappMessage({
			from: waPhoneNumber,
			to: from,
			type: 'text',
			externalId: uuidv7(),
			text: {
				body: confirmationText
			}
		});

		log.info({ from, petitionTitle }, 'Sent confirmation message after petition signature');
	} catch (error) {
		log.error({ error, from, petitionTitle }, 'Failed to send petition confirmation message');
	}
}

/**
 * Determines the target table and action based on flow response payload
 * Uses resource_type and resource_id
 */
async function determineFlowTarget(responsePayload: Record<string, unknown>) {
	const resourceType = responsePayload.resource_type;
	const resourceId = responsePayload.resource_id;

	if (!resourceType || typeof resourceType !== 'string') {
		log.error({ responsePayload }, 'Missing or invalid resource_type in flow response');
		throw new Error('Missing or invalid resource_type in flow response payload');
	}

	if (!resourceId || typeof resourceId !== 'string') {
		log.error({ responsePayload }, 'Missing or invalid resource_id in flow response');
		throw new Error('Missing or invalid resource_id in flow response payload');
	}

	switch (resourceType) {
		case 'event':
			return {
				type: 'event_signup' as const,
				eventId: resourceId
			};

		case 'petition':
			return {
				type: 'petition_signature' as const,
				petitionId: resourceId
			};

		case 'survey':
			throw new Error('Survey responses are not supported yet');
		// return {
		// 	type: 'survey_response' as const,
		// 	surveyId: resourceId
		// };

		default:
			log.error({ resourceType }, 'Unsupported resource_type in flow response');
			throw new Error(
				`Unsupported resource_type: ${resourceType}. Expected: event, petition, or survey`
			);
	}
}

export async function handleFlowResponse({
	flowName,
	body,
	response,
	from,
	tx
}: {
	flowName: string;
	body?: string;
	response: string;
	from: string;
	tx: ServerTransaction;
}) {
	try {
		log.info(
			{
				flowName,
				from,
				response
			},
			'Handling WhatsApp Flow response'
		);
		let responseJson: Record<string, unknown>;
		try {
			responseJson = JSON.parse(response);
		} catch (error) {
			log.error({ error }, 'invalid JSON in flow response');
			throw error;
		}

		// Determine what type of flow this is and where to save the data
		// Looks for resource_type and resource_id in the response payload
		const target = await determineFlowTarget(responseJson);

		switch (target.type) {
			case 'event_signup': {
				const event = await _getEventByIdUnsafe({ eventId: target.eventId, tx });
				const organization = await getOrganizationByIdUnsafe({
					organizationId: event.organizationId,
					tx
				});
				const countryCode = safeGetCountryCodeFromPhoneNumber(from) || organization.country;
				const parsedPersonAction = parse(
					intersect([personActionHelperWhatsAppFlow, personActionHelperCustomFieldsOnly]),
					{
						subscribed: true,
						country: countryCode,
						phoneNumber: from,
						...responseJson
					}
				);
				const parsedCustomFields = safeParse(personActionHelperCustomFieldsOnly, responseJson);
				const customFields = parsedCustomFields.success ? parsedCustomFields.output : {};
				log.debug(
					{ parsedPersonAction },
					'Signing up person for event with personAction from WhatsApp flow'
				);
				const eventSignup = await completeEventSignupHelper({
					eventId: event.id,
					personAction: parsedPersonAction,
					signupDetails: {
						channel: { type: 'whatsapp' },
						customFields: customFields
					},
					organizationId: event.organizationId,
					tx
				});

				// Send confirmation message
				await sendConfirmationMessage({
					from,
					organizationId: organization.id,
					eventTitle: event.title,
					eventStartDate: event.startsAt,
					eventTimezone: event.timezone,
					tx
				});

				return { personId: eventSignup.personId, organizationId: event.organizationId };
			}

			case 'petition_signature': {
				const petition = await _getPetitionByIdUnsafeNoTenantCheck({
					petitionId: target.petitionId,
					tx
				});
				if (!petition) {
					throw new Error('Petition not found');
				}
				const organization = await getOrganizationByIdUnsafe({
					organizationId: petition.organizationId,
					tx
				});
				const countryCode = safeGetCountryCodeFromPhoneNumber(from) || organization.country;
				const parsedPersonAction = parse(
					intersect([personActionHelperWhatsAppFlow, personActionHelperCustomFieldsOnly]),
					{
						subscribed: true,
						country: countryCode,
						phoneNumber: from,
						...responseJson
					}
				);
				const parsedCustomFields = safeParse(personActionHelperCustomFieldsOnly, responseJson);
				const customFields = parsedCustomFields.success ? parsedCustomFields.output : {};
				log.debug({ parsedPersonAction }, 'Signing petition with personAction from WhatsApp flow');
				const petitionSignature = await completePetitionSignatureHelper({
					petitionId: petition.id,
					teamId: petition.teamId ?? undefined,
					tx,
					personAction: parsedPersonAction,
					signatureDetails: { channel: { type: 'whatsapp' } },
					organizationId: petition.organizationId,
					responses: Object.keys(customFields).length > 0 ? customFields : null,
					skipNotifications: true
				});

				await sendPetitionConfirmationMessage({
					from,
					organizationId: organization.id,
					petitionTitle: petition.title,
					tx
				});

				return {
					personId: petitionSignature.personId,
					organizationId: petition.organizationId
				};
			}

			default:
				throw new Error(`Unsupported flow type: ${(target as { type: string }).type}`);
		}
	} catch (error) {
		log.error(
			{
				error,
				flowName,
				from,
				response
			},
			'Error handling flow response'
		);
		throw error;
	}
}

/**
 * Process form data from WhatsApp Flow endpoint
 * Called directly from the data exchange endpoint
 */
export async function processFlowDataExchange({
	formData,
	flowToken,
	tx
}: {
	formData: Record<string, unknown>;
	flowToken: string;
	tx: ServerTransaction;
}) {
	log.info({ flowToken, formData }, 'Processing flow data exchange');

	// Extract resource identifiers from footer payload
	const resourceType = formData.resource_type;
	const resourceId = formData.resource_id;

	if (!resourceType || typeof resourceType !== 'string') {
		throw new Error('Missing or invalid resource_type in form data');
	}

	if (!resourceId || typeof resourceId !== 'string') {
		throw new Error('Missing or invalid resource_id in form data');
	}

	// Extract phone number (required field; flows may use `phone` or `phoneNumber`)
	const phone =
		(typeof formData.phone === 'string' && formData.phone) ||
		(typeof formData.phoneNumber === 'string' && formData.phoneNumber);
	if (!phone || typeof phone !== 'string') {
		throw new Error('Missing or invalid phone number in form data');
	}

	// TODO: This should be done using the "from" phone number that the message came from.
	// Look up person by phone number
	const existingPerson = await drizzle.query.person.findFirst({
		where: eq(personTable.phoneNumber, phone)
	});

	if (!existingPerson) {
		log.error({ phone }, 'Person not found for phone number');
		throw new Error('Person not found. Please send an event code first.');
	}

	// Route based on resource type
	switch (resourceType) {
		case 'event': {
			// Convert form data to flow response format
			const flowResponses = {
				name: 'flow',
				body: 'Sent',
				response_json: formData
			};

			await handleEventSignupFlowResponse({
				eventId: resourceId,
				tx,
				from: phone,
				givenName: existingPerson.givenName || existingPerson.familyName || phone,
				responses: flowResponses
			});

			log.info(
				{ eventId: resourceId, personId: existingPerson.id },
				'Event signup processed successfully'
			);
			break;
		}

		case 'petition': {
			const flowResponses = {
				name: 'flow',
				body: 'Sent',
				response_json: formData
			};

			await handlePetitionSignatureFlowResponse({
				petitionId: resourceId,
				tx,
				from: phone,
				givenName: existingPerson.givenName || existingPerson.familyName || phone,
				responses: flowResponses
			});

			log.info(
				{ petitionId: resourceId, personId: existingPerson.id },
				'Petition signature processed successfully'
			);
			break;
		}

		case 'survey':
			throw new Error('Survey responses are not supported yet');

		default:
			throw new Error(`Unsupported resource_type: ${resourceType}`);
	}
}

export async function handleEventSignupFlowResponse({
	eventId,
	givenName,
	from,
	responses,
	tx
}: {
	eventId: string;
	from: string;
	givenName: string;
	responses?: FlowResponses;
	tx: ServerTransaction;
}) {
	// Extract and update person data from flow responses
	const customFields: Record<string, unknown> = {};

	if (responses?.response_json) {
		try {
			const flowData =
				typeof responses.response_json === 'string'
					? JSON.parse(responses.response_json)
					: responses.response_json;

			// Extract custom fields (everything except standard fields and resource identifiers)
			const standardFields = [
				'fullName',
				'email',
				'phone',
				'address',
				'gender',
				'dateOfBirth',
				'organization',
				'position',
				'resource_type',
				'resource_id'
			];

			Object.keys(flowData).forEach((key) => {
				if (!standardFields.includes(key)) {
					const value = flowData[key];
					// Handle different field types from WhatsApp Flows
					if (value === null || value === undefined) {
						// Skip null/undefined values
						return;
					}
					if (Array.isArray(value)) {
						// Multi-select/Checkbox fields return arrays
						// Filter out any non-string values and empty strings
						const arrayValue = value.filter(
							(item) => typeof item === 'string' && item.trim().length > 0
						);
						if (arrayValue.length > 0) {
							customFields[key] = arrayValue as string[];
						}
					} else if (typeof value === 'string') {
						// Text, TextArea, Email, Phone, DatePicker, RadioButtonsGroup, Dropdown
						const stringValue = value.trim();
						if (stringValue.length > 0) {
							customFields[key] = stringValue as string;
						}
					} else if (typeof value === 'boolean') {
						// OptIn fields return boolean
						customFields[key] = value as boolean;
					} else if (typeof value === 'number') {
						// Numeric fields
						customFields[key] = value as number;
					} else {
						// Log unexpected types for debugging
						log.warn(
							{ key, value, type: typeof value },
							'Unexpected custom field type in flow response'
						);
						customFields[key] = value as string;
					}
				}
			});

			log.debug({ customFields }, 'Extracted custom fields from flow response');
		} catch (error) {
			log.error({ error, responses }, 'Failed to parse flow response for custom fields');
		}
	}

	const event = await _getEventByIdUnsafe({ eventId, tx });
	const organization = await getOrganizationByIdUnsafe({
		organizationId: event.organizationId,
		tx
	});
	const countryCode = safeGetCountryCodeFromPhoneNumber(from) || organization.country;
	const eventSignup = await completeEventSignupHelper({
		eventId: event.id,
		personAction: {
			subscribed: true,
			country: countryCode,
			phoneNumber: from,
			givenName: givenName
		},
		signupDetails: {
			channel: { type: 'whatsapp' },
			customFields: customFields as Record<string, string | number | boolean | string[]>
		},
		organizationId: event.organizationId,
		tx
	});

	log.info(
		{ eventSignupId: eventSignup.id, personId: eventSignup.personId, eventId: event.id },
		'Created activity record for event signup'
	);

	return eventSignup;
}

export async function handlePetitionSignatureFlowResponse({
	petitionId,
	givenName,
	from,
	responses,
	tx
}: {
	petitionId: string;
	from: string;
	givenName: string;
	responses?: FlowResponses;
	tx: ServerTransaction;
}) {
	const customFields: Record<string, unknown> = {};

	if (responses?.response_json) {
		try {
			const flowData =
				typeof responses.response_json === 'string'
					? JSON.parse(responses.response_json)
					: responses.response_json;

			const standardFields = [
				'givenName',
				'familyName',
				'emailAddress',
				'phoneNumber',
				'fullName',
				'email',
				'phone',
				'address',
				'gender',
				'dateOfBirth',
				'organization',
				'position',
				'resource_type',
				'resource_id',
				'flow_token'
			];

			Object.keys(flowData as Record<string, unknown>).forEach((key) => {
				if (!standardFields.includes(key)) {
					const value = (flowData as Record<string, unknown>)[key];
					if (value === null || value === undefined) {
						return;
					}
					if (Array.isArray(value)) {
						const arrayValue = value.filter(
							(item) => typeof item === 'string' && item.trim().length > 0
						);
						if (arrayValue.length > 0) {
							customFields[key] = arrayValue as string[];
						}
					} else if (typeof value === 'string') {
						const stringValue = value.trim();
						if (stringValue.length > 0) {
							customFields[key] = stringValue as string;
						}
					} else if (typeof value === 'boolean') {
						customFields[key] = value as boolean;
					} else if (typeof value === 'number') {
						customFields[key] = value as number;
					} else {
						log.warn(
							{ key, value, type: typeof value },
							'Unexpected custom field type in petition flow response'
						);
						customFields[key] = value as string;
					}
				}
			});

			log.debug({ customFields }, 'Extracted custom fields from petition flow response');
		} catch (error) {
			log.error({ error }, 'Failed to parse petition flow response for custom fields');
		}
	}

	const petition = await _getPetitionByIdUnsafeNoTenantCheck({ petitionId, tx });
	if (!petition) {
		throw new Error('Petition not found');
	}
	const organization = await getOrganizationByIdUnsafe({
		organizationId: petition.organizationId,
		tx
	});
	const countryCode = safeGetCountryCodeFromPhoneNumber(from) || organization.country;

	let flowDataForPerson: Record<string, unknown> = {};
	if (responses?.response_json) {
		flowDataForPerson =
			typeof responses.response_json === 'string'
				? JSON.parse(responses.response_json)
				: (responses.response_json as Record<string, unknown>);
	}

	const given =
		typeof flowDataForPerson.givenName === 'string' && flowDataForPerson.givenName.trim()
			? flowDataForPerson.givenName.trim()
			: givenName;
	const family =
		typeof flowDataForPerson.familyName === 'string' && flowDataForPerson.familyName.trim()
			? flowDataForPerson.familyName.trim()
			: '—';

	const petitionSignature = await completePetitionSignatureHelper({
		petitionId: petition.id,
		teamId: petition.teamId ?? undefined,
		tx,
		personAction: {
			subscribed: true,
			country: countryCode,
			phoneNumber: from,
			givenName: given,
			familyName: family,
			...(typeof flowDataForPerson.emailAddress === 'string' &&
			flowDataForPerson.emailAddress.trim()
				? { emailAddress: flowDataForPerson.emailAddress.trim() }
				: {})
		},
		signatureDetails: { channel: { type: 'whatsapp' } },
		organizationId: petition.organizationId,
		responses: Object.keys(customFields).length > 0 ? customFields : null,
		skipNotifications: true
	});

	await sendPetitionConfirmationMessage({
		from,
		organizationId: organization.id,
		petitionTitle: petition.title,
		tx
	});

	log.info(
		{
			petitionSignatureId: petitionSignature.id,
			personId: petitionSignature.personId,
			petitionId: petition.id
		},
		'Created activity record for petition signature'
	);

	return petitionSignature;
}
