import { parse } from 'valibot';
import { db } from '$lib/server/db';
import { renderValiError } from '$lib/schema/helpers';
import {
	incomingMessageSchema,
	type IncomingMessage,
	type IncomingMessageObject
} from '$lib/schema/whatsapp/ycloud/incoming_message';
import type { ServerTransaction } from '@rocicorp/zero';
import { sendFlowMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { getPersonIdFromButtonAction } from '$lib/server/queue/handlers/whatsapp/incoming_message_actions/get_details_from_message';
import pino from '$lib/pino';
import { eq } from 'drizzle-orm';
import { whatsappThread } from '$lib/schema/drizzle';
import { extractButtonActionString } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
import { _updateMostRecentWhatsappMessageReceivedAtUnsafe } from '$lib/server/api/data/person/person';
const log = pino(import.meta.url);
import { _getActionCodeUnsafe } from '$lib/server/api/data/action/check';
import { extractActionCode } from '$lib/server/queue/handlers/whatsapp/incoming_message_actions/action_code';
import { getQueue } from '$lib/server/queue';
import { safeGetCountryCodeFromPhoneNumber } from '$lib/utils/phone';

import { getOrganizationByIdUnsafe } from '$lib/server/api/data/organization';
import { _getEventByIdUnsafe } from '$lib/server/api/data/event/event';
import {
	_findWhatsAppMessageByWamidIdUnsafe,
	createWhatsAppMessage,
	handleIncomingReaction
} from '$lib/server/api/data/whatsapp/message';
import { createActivityWhatsAppMessageIncoming } from '$lib/server/api/data/activity/activity';
import {
	attendedEventHelper,
	completeEventSignupHelper,
	createIncompleteEventSignupHelper
} from '$lib/server/api/data/event/signup';
import {
	getPetitionByIdUnsafe,
	createIncompletePetitionSignatureHelper
} from '$lib/server/api/data/petition/signature';
import { handleFlowResponse } from '$lib/server/queue/handlers/whatsapp/handlers/flow';
import {
	resolveIncomingWhatsappIdentity,
	upsertWhatsappIdentityForPersonUnsafe
} from '$lib/server/api/data/whatsapp/identity';

import { convertIncomingWhatsAppMessage } from '$lib/server/queue/handlers/whatsapp/incoming_message_actions/convert_incoming';

import { v7 as uuidv7 } from 'uuid';
export async function handleIncomingMessage(incomingMessage: unknown) {
	try {
		const parsed = parse(incomingMessageSchema, incomingMessage);

		log.debug(parsed, 'Parsed incoming whatsapp message');

		const insertedWhatsAppMessageId: string = uuidv7();
		await db.transaction(async (tx) => {
			await processIncomingMessageInTransaction(parsed, insertedWhatsAppMessageId, tx);
		});
	} catch (err) {
		const renderedError = renderValiError(err);
		if (renderedError.isValiError) {
			log.error(renderedError, 'Failed to parse incoming message');
			log.debug(incomingMessage, 'Full message');
		} else {
			log.error(err, 'Failed to process incoming message');
		}
	}
}

async function routeIncomingMessage(
	message: IncomingMessageObject,
	parsed: IncomingMessage,
	ctx: MessageRoutingContext
): Promise<MessageRoutingResult> {
	switch (message.type) {
		case 'text':
			return handleTextMessage(message, ctx);
		case 'image':
		case 'video':
		case 'audio':
		case 'document':
		case 'sticker':
		case 'location':
			return {};
		case 'button':
			return handleButtonMessage(message, ctx);
		case 'interactive':
			return handleInteractiveMessage(message, ctx);
		case 'reaction':
			return handleReactionMessage(message, ctx);
		default:
			log.warn(parsed, 'Unknown message type');
			return {};
	}
}

async function processIncomingMessageInTransaction(
	parsed: IncomingMessage,
	insertedWhatsAppMessageId: string,
	tx: ServerTransaction
) {
	const senderPhone = parsed.whatsappInboundMessage.from;
	const senderDisplayName =
		parsed.whatsappInboundMessage.customerProfile?.name ??
		parsed.whatsappInboundMessage.customerProfile?.username ??
		senderPhone;
	const whatsappIdentity: WhatsappIdentity = parsed.whatsappInboundMessage.fromUserId
		? {
				wabaId: parsed.whatsappInboundMessage.wabaId,
				bsuid: parsed.whatsappInboundMessage.fromUserId
			}
		: undefined;
	const whatsappContextWamidId = parsed.whatsappInboundMessage.context?.id; //wamid of replied to message if exists

	const ctx: MessageRoutingContext = {
		senderPhone,
		senderDisplayName,
		whatsappIdentity,
		whatsappContextWamidId,
		insertedWhatsAppMessageId,
		tx
	};

	// Each handler returns any of personId / organizationId / logActivity it determined.
	// Only the keys it actually set are merged back, preserving the original defaults
	// (personId/organizationId undefined, logActivity true) for everything it leaves untouched.
	const routingResult = await routeIncomingMessage(parsed.whatsappInboundMessage, parsed, ctx);
	let personId: string | undefined = routingResult.personId;
	let organizationId: string | undefined = routingResult.organizationId;
	//whether to log the activity to the timeline. Some messages (eg: emoji reactions, action code signups, flow responses, etc) are not meant to be logged to the timeline. A message and webhook record will still be stored.
	const logActivity: boolean = routingResult.logActivity ?? true;

	if (!organizationId || !personId) {
		// we've made it this far without an organization or person, so we need to resolve the identity by wabaId (which only works for organizations that have onboarded with a managed wabaId)
		const sender = await resolveIncomingWhatsappIdentity({
			inboundMessage: parsed.whatsappInboundMessage,
			messageId: insertedWhatsAppMessageId,
			tx
		});
		organizationId = sender.organization.id;
		personId = sender.person.id;
	}
	if (!organizationId) {
		throw new Error(
			'Reached the end of incoming message processing and was unable to determine organization'
		);
	}
	if (!personId) {
		throw new Error(
			'Reached the end of incoming message processing and was unable to determine person'
		);
	}
	await linkIncomingWhatsappIdentities({
		organizationId,
		personId,
		inboundMessage: parsed.whatsappInboundMessage,
		senderPhone,
		senderDisplayName,
		tx
	});
	const convertedMessage = await convertIncomingWhatsAppMessage({
		inboundMessage: parsed as IncomingMessage,
		organizationId
	});
	await createWhatsAppMessage({
		message: convertedMessage,
		personId,
		id: insertedWhatsAppMessageId,
		wamidId: parsed.whatsappInboundMessage.wamid,
		type: 'incoming_api_message',
		organizationId,
		tx
	});

	// even if we don't create an activity, we want to update the most recent whatsapp message received at because it is used for determining if the customer service window is open
	await _updateMostRecentWhatsappMessageReceivedAtUnsafe({
		tx,
		args: {
			personId,
			organizationId,
			mostRecentWhatsappMessageReceivedAt: parsed.whatsappInboundMessage.sendTime
				? new Date(parsed.whatsappInboundMessage.sendTime)
				: new Date()
		}
	});

	// Don't create an activity for reaction messages (we'll add it to existing activity)
	if (logActivity) {
		if (!insertedWhatsAppMessageId) {
			throw new Error('WhatsApp message was not inserted -- cannot create activity');
		}
		const activity = await createActivityWhatsAppMessageIncoming({
			personId,
			organizationId,
			referenceId: insertedWhatsAppMessageId,
			tx
		});
		log.debug(activity, 'Activity created');
	}
}

type WhatsappIdentity = { wabaId: string; bsuid: string } | undefined;

type MessageRoutingContext = {
	senderPhone: string;
	senderDisplayName: string;
	whatsappIdentity: WhatsappIdentity;
	whatsappContextWamidId: string | undefined;
	insertedWhatsAppMessageId: string;
	tx: ServerTransaction;
};

// Values a per-type handler may resolve. Keys left absent fall back to the
// caller's defaults (personId/organizationId undefined, logActivity true).
type MessageRoutingResult = {
	personId?: string;
	organizationId?: string;
	logActivity?: boolean;
};

type TextMessage = Extract<IncomingMessageObject, { type: 'text' }>;
type ButtonMessage = Extract<IncomingMessageObject, { type: 'button' }>;
type InteractiveMessage = Extract<IncomingMessageObject, { type: 'interactive' }>;
type ReactionMessage = Extract<IncomingMessageObject, { type: 'reaction' }>;

async function handleTextMessage(
	message: TextMessage,
	ctx: MessageRoutingContext
): Promise<MessageRoutingResult> {
	const { tx } = ctx;
	const actionCode = extractActionCode(message.text.body);
	log.info({ actionCode, text: message.text.body }, 'Extracted action code from message');
	if (!actionCode) {
		return {};
	}
	const actionCodeDetails = await _getActionCodeUnsafe({ tx, code: actionCode });
	switch (actionCodeDetails?.type) {
		case 'event_signup':
			return handleEventSignupActionCode(message, ctx, actionCodeDetails.referenceId);
		case 'event_attended':
			return handleEventAttendedActionCode(message, ctx, actionCodeDetails.referenceId);
		case 'petition_signed':
			return handlePetitionSignedActionCode(
				message,
				ctx,
				actionCodeDetails.referenceId,
				actionCodeDetails.organizationId
			);
		default:
			//log and move on
			log.warn(actionCodeDetails, 'Unknown action code');
			return { logActivity: false };
	}
}

async function handleEventSignupActionCode(
	message: TextMessage,
	ctx: MessageRoutingContext,
	referenceId: string
): Promise<MessageRoutingResult> {
	const { senderPhone, senderDisplayName, whatsappIdentity, whatsappContextWamidId, tx } = ctx;
	//handle event signup
	const event = await _getEventByIdUnsafe({ eventId: referenceId, tx });
	const organizationId = event.organizationId;
	const organization = await getOrganizationByIdUnsafe({
		organizationId: event.organizationId,
		tx
	});
	const countryCode = safeGetCountryCodeFromPhoneNumber(senderPhone) || organization.country;
	const eventSignup = await createIncompleteEventSignupHelper({
		eventId: event.id,
		personAction: {
			subscribed: true,
			country: countryCode,
			phoneNumber: senderPhone,
			givenName: senderDisplayName
		},
		signupDetails: {
			channel: { type: 'whatsapp' },
			customFields: {}
		},
		organizationId: event.organizationId,
		whatsappIdentity,
		whatsappContextWamidId,
		tx
	});
	const flowId = event.settings.whatsappFlowId;
	if (flowId) {
		try {
			const responseId = await sendFlowMessage({
				from: message.to,
				to: senderPhone,
				flowId: flowId,
				flowCta: 'Register',
				headerText: event.title,
				bodyText: `Complete the registration form to sign up for ${event.title}`,
				footerText: 'Tap to start registration'
			});

			log.info(
				{
					eventId: event.id,
					flowId,
					personPhone: senderPhone,
					eventSignupId: eventSignup.id
				},
				'Sent flow message for event registration'
			);
			// create a whatsapp message record in the database because we want to be able to track the reply to this message to infer a personId
			// note: in other message types, the createWhatsAppMessage function is called on the outbound message sending utility, but we don't want to add that to flows...
			await createWhatsAppMessage({
				id: uuidv7(),
				organizationId: organizationId,
				personId: eventSignup.personId,
				externalId: responseId,
				message: { id: responseId, emojiReactions: [] },
				type: 'outbound_api_message:system-flow',
				tx
			});
			// we don't want to log this activity to the timeline because it is a system-generated message
			return { organizationId, personId: eventSignup.personId, logActivity: false };
		} catch (error) {
			log.error(error, 'Failed to send flow message for event registration');
			const completedSignup = await completeEventSignupHelper({
				eventId: event.id,
				personAction: {
					subscribed: true,
					country: countryCode,
					phoneNumber: senderPhone,
					givenName: senderDisplayName
				},
				signupDetails: {
					channel: { type: 'whatsapp' },
					customFields: {}
				},
				organizationId: event.organizationId,
				tx,
				defaultEventSignupId: eventSignup.id,
				whatsappIdentity,
				whatsappContextWamidId
			});
			return { organizationId, personId: completedSignup.personId, logActivity: false };
		}
	}
	log.warn({ eventId: event.id }, 'No flow deployed for event, registering immediately');
	const completedSignup = await completeEventSignupHelper({
		eventId: event.id,
		personAction: {
			subscribed: true,
			country: countryCode,
			phoneNumber: senderPhone,
			givenName: senderDisplayName
		},
		signupDetails: {
			channel: { type: 'whatsapp' },
			customFields: {}
		},
		organizationId: event.organizationId,
		tx,
		defaultEventSignupId: eventSignup.id,
		whatsappIdentity,
		whatsappContextWamidId
	});
	return { organizationId, personId: completedSignup.personId, logActivity: false };
}

async function handleEventAttendedActionCode(
	_message: TextMessage,
	ctx: MessageRoutingContext,
	referenceId: string
): Promise<MessageRoutingResult> {
	const { senderPhone, senderDisplayName, whatsappIdentity, whatsappContextWamidId, tx } = ctx;
	//handle event attended
	const event = await _getEventByIdUnsafe({ eventId: referenceId, tx });
	const organization = await getOrganizationByIdUnsafe({
		organizationId: event.organizationId,
		tx
	});
	const countryCode = safeGetCountryCodeFromPhoneNumber(senderPhone) || organization.country;
	const eventSignup = await attendedEventHelper({
		eventId: event.id,
		personAction: {
			subscribed: true,
			country: countryCode,
			phoneNumber: senderPhone,
			givenName: senderDisplayName
		},
		signupDetails: {
			channel: { type: 'whatsapp' },
			customFields: {}
		},
		organizationId: event.organizationId,
		whatsappIdentity,
		whatsappContextWamidId,
		tx
	});
	// logActivity stays false (set by the text handler having found an action code)
	return {
		personId: eventSignup.personId,
		organizationId: event.organizationId,
		logActivity: false
	};
}

async function handlePetitionSignedActionCode(
	message: TextMessage,
	ctx: MessageRoutingContext,
	referenceId: string,
	actionCodeOrganizationId: string
): Promise<MessageRoutingResult> {
	const { senderPhone, senderDisplayName, whatsappIdentity, whatsappContextWamidId, tx } = ctx;
	const petitionRecord = await getPetitionByIdUnsafe({
		petitionId: referenceId,
		organizationId: actionCodeOrganizationId,
		tx
	});
	const organization = await getOrganizationByIdUnsafe({
		organizationId: petitionRecord.organizationId,
		tx
	});
	const countryCode = safeGetCountryCodeFromPhoneNumber(senderPhone) || organization.country;
	const outcome = await createIncompletePetitionSignatureHelper({
		petitionId: petitionRecord.id,
		organizationId: petitionRecord.organizationId,
		tx,
		personAction: {
			subscribed: true,
			country: countryCode,
			phoneNumber: senderPhone,
			givenName: senderDisplayName
		},
		signatureDetails: {
			channel: { type: 'whatsapp' }
		},
		teamId: petitionRecord.teamId ?? undefined,
		flowMessageFrom: message.to,
		flowMessageTo: senderPhone,
		whatsappIdentity,
		whatsappContextWamidId
	});
	return {
		personId: outcome.personId,
		organizationId: petitionRecord.organizationId,
		logActivity: false
	};
}

async function processButtonAction(
	buttonActionString: string,
	ctx: MessageRoutingContext
): Promise<void> {
	const { senderPhone, senderDisplayName, whatsappIdentity, whatsappContextWamidId, tx } = ctx;
	const { threadId, buttonId } = extractButtonActionString(buttonActionString);
	const threadObject = await tx.dbTransaction.wrappedTransaction.query.whatsappThread.findFirst({
		where: eq(whatsappThread.id, threadId)
	});
	if (!threadObject) {
		throw new Error('Thread not found');
	}
	const nextNode = extractNextNodeFromButtonAction(threadObject, buttonId);
	const organization = await getOrganizationByIdUnsafe({
		organizationId: threadObject.organizationId,
		tx
	});
	const personId = await getPersonIdFromButtonAction({
		personPhoneNumber: senderPhone,
		personName: senderDisplayName,
		organizationId: threadObject.organizationId,
		organizationCountry: organization.country,
		messageId: ctx.insertedWhatsAppMessageId,
		whatsappIdentity,
		whatsappContextWamidId,
		tx
	});
	const queue = await getQueue();
	await queue.processFlowNodeAction({
		nodeId: nextNode,
		personId,
		organizationId: threadObject.organizationId,
		threadId: threadObject.id
	});
}

async function handleButtonMessage(
	message: ButtonMessage,
	ctx: MessageRoutingContext
): Promise<MessageRoutingResult> {
	// TODO: handle button messages
	await processButtonAction(message.button.payload, ctx);
	return {};
}

async function handleInteractiveMessage(
	message: InteractiveMessage,
	ctx: MessageRoutingContext
): Promise<MessageRoutingResult> {
	// interactive can be button_reply or nfm_reply (flow message)
	if (message.interactive.type === 'button_reply') {
		// get the button id, which should give me the thread Id and node Id...
		await processButtonAction(message.interactive.button_reply.id, ctx);
		// TODO: handle button reply messages
		return {};
	}
	if (message.interactive.type === 'nfm_reply') {
		// Handle flow response messages
		const flowResult = await handleFlowResponse({
			flowName: message.interactive.nfm_reply.name,
			body: message.interactive.nfm_reply.body,
			response: message.interactive.nfm_reply.response_json,
			from: ctx.senderPhone,
			whatsappIdentity: ctx.whatsappIdentity,
			whatsappContextWamidId: ctx.whatsappContextWamidId,
			tx: ctx.tx
		});
		return {
			logActivity: false,
			personId: flowResult.personId,
			organizationId: flowResult.organizationId
		};
	}
	return {};
}

async function handleReactionMessage(
	message: ReactionMessage,
	ctx: MessageRoutingContext
): Promise<MessageRoutingResult> {
	const { tx, senderPhone } = ctx;
	// reaction is for emoji reactions
	const messageActivity = await _findWhatsAppMessageByWamidIdUnsafe({
		wamidId: message.reaction.message_id,
		tx
	});

	if (messageActivity.personId) {
		await handleIncomingReaction({
			tx,
			messageId: messageActivity.id,
			personId: messageActivity.personId,
			phoneNumber: senderPhone,
			emoji: message.reaction.emoji || null
		});
	}
	return {
		logActivity: false,
		personId: messageActivity.personId || undefined,
		organizationId: messageActivity.organizationId
	};
}

function extractNextNodeFromButtonAction(
	thread: typeof whatsappThread.$inferSelect,
	buttonId: string
) {
	// there should be a handle at either source or source handle...
	const edges = thread.flow.edges;
	log.debug({ edges, buttonId }, 'Edges');
	const edge = edges.filter((edge) => edge.source === buttonId || edge.sourceHandle === buttonId);
	if (edge.length === 0) {
		throw new Error('Edge not found');
	}
	const target = edge[0].target;
	if (typeof target !== 'string' || target.length === 0) {
		throw new Error(`Edge target not found for buttonId ${buttonId}`);
	}
	return target; // once we have nodes that have more than one input, we will need to update this to handle targetHandle
}

async function linkIncomingWhatsappIdentities({
	organizationId,
	personId,
	inboundMessage,
	senderPhone,
	senderDisplayName,
	tx
}: {
	organizationId: string;
	personId: string;
	inboundMessage: IncomingMessageObject;
	senderPhone: string;
	senderDisplayName: string;
	tx: ServerTransaction;
}) {
	if (inboundMessage.fromUserId) {
		await upsertWhatsappIdentityForPersonUnsafe({
			organizationId,
			personId,
			wabaId: inboundMessage.wabaId,
			bsuid: inboundMessage.fromUserId,
			parentUserId: inboundMessage.fromParentUserId ?? null,
			waPhone: senderPhone,
			displayName: senderDisplayName,
			tx
		});
	}

	if (inboundMessage.type === 'system' && inboundMessage.system.user_id) {
		await upsertWhatsappIdentityForPersonUnsafe({
			organizationId,
			personId,
			wabaId: inboundMessage.wabaId,
			bsuid: inboundMessage.system.user_id,
			parentUserId: inboundMessage.system.parent_user_id ?? null,
			waPhone: inboundMessage.system.wa_id,
			displayName: senderDisplayName,
			tx
		});
	}
}
