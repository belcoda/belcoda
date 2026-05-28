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

		let personId: string | undefined = undefined;
		let organizationId: string | undefined = undefined;
		let logActivity: boolean = true; //whether to log the activity to the timeline. Some messages (eg: emoji reactions, action code signups, flow responses, etc) are not meant to be logged to the timeline. A message and webhook record will still be stored.
		const insertedWhatsAppMessageId: string = uuidv7();
		await db.transaction(async (tx) => {
			const senderPhone = parsed.whatsappInboundMessage.from;
			const senderDisplayName =
				parsed.whatsappInboundMessage.customerProfile?.name ??
				parsed.whatsappInboundMessage.customerProfile?.username ??
				senderPhone;
			const whatsappIdentity = parsed.whatsappInboundMessage.fromUserId
				? {
						wabaId: parsed.whatsappInboundMessage.wabaId,
						bsuid: parsed.whatsappInboundMessage.fromUserId
					}
				: undefined;
			const whatsappContextWamidId = parsed.whatsappInboundMessage.context?.id; //wamid of replied to message if exists
			switch (parsed.whatsappInboundMessage.type) {
				case 'text': {
					const actionCode = extractActionCode(parsed.whatsappInboundMessage.text.body);
					log.info(
						{ actionCode, text: parsed.whatsappInboundMessage.text.body },
						'Extracted action code from message'
					);
					if (actionCode) {
						logActivity = false;
						const actionCodeDetails = await _getActionCodeUnsafe({ tx, code: actionCode });
						switch (actionCodeDetails?.type) {
							case 'event_signup': {
								//handle event signup
								const event = await _getEventByIdUnsafe({
									eventId: actionCodeDetails.referenceId,
									tx
								});
								organizationId = event.organizationId;
								const organization = await getOrganizationByIdUnsafe({
									organizationId: event.organizationId,
									tx
								});
								const countryCode =
									safeGetCountryCodeFromPhoneNumber(senderPhone) || organization.country;
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
								personId = eventSignup.personId;
								const flowId = event.settings.whatsappFlowId;
								if (flowId) {
									try {
										await sendFlowMessage({
											from: parsed.whatsappInboundMessage.to,
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
										logActivity = false;
										break;
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
										personId = completedSignup.personId;
										logActivity = false;
										break;
									}
								} else {
									log.warn(
										{ eventId: event.id },
										'No flow deployed for event, registering immediately'
									);
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
									personId = completedSignup.personId;
									logActivity = false;
									break;
								}
							}
							case 'event_attended': {
								//handle event attended
								const event = await _getEventByIdUnsafe({
									eventId: actionCodeDetails.referenceId,
									tx
								});
								const organization = await getOrganizationByIdUnsafe({
									organizationId: event.organizationId,
									tx
								});
								const countryCode =
									safeGetCountryCodeFromPhoneNumber(senderPhone) || organization.country;
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
								personId = eventSignup.personId;
								organizationId = event.organizationId;
								break;
							}
							case 'petition_signed': {
								const petitionRecord = await getPetitionByIdUnsafe({
									petitionId: actionCodeDetails.referenceId,
									organizationId: actionCodeDetails.organizationId,
									tx
								});
								const organization = await getOrganizationByIdUnsafe({
									organizationId: petitionRecord.organizationId,
									tx
								});
								const countryCode =
									safeGetCountryCodeFromPhoneNumber(senderPhone) || organization.country;
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
									flowMessageFrom: parsed.whatsappInboundMessage.to,
									flowMessageTo: senderPhone,
									whatsappIdentity,
									whatsappContextWamidId
								});
								personId = outcome.personId;
								organizationId = petitionRecord.organizationId;
								logActivity = false;
								break;
							}
							default:
								//log and move on
								log.warn(actionCodeDetails, 'Unknown action code');
								break;
						}
					}
					break;
				}
				case 'image':
					break;
				case 'video':
					break;
				case 'audio':
					break;
				case 'document':
					break;
				case 'sticker':
					break;
				case 'location':
					break;
				case 'button': {
					// TODO: handle button messages
					if (parsed.whatsappInboundMessage.type === 'button') {
						const buttonActionString = parsed.whatsappInboundMessage.button.payload;
						const { threadId, buttonId } = extractButtonActionString(buttonActionString);
						const threadObject =
							await tx.dbTransaction.wrappedTransaction.query.whatsappThread.findFirst({
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
							messageId: insertedWhatsAppMessageId,
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
					break;
				}
				case 'interactive': {
					// interactive can be button_reply or nfm_reply (flow message)
					if (parsed.whatsappInboundMessage.interactive.type === 'button_reply') {
						// get the button id, which should give me the thread Id and node Id...
						const buttonActionString = parsed.whatsappInboundMessage.interactive.button_reply.id;
						const { threadId, buttonId } = extractButtonActionString(buttonActionString);
						const threadObject =
							await tx.dbTransaction.wrappedTransaction.query.whatsappThread.findFirst({
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
							messageId: insertedWhatsAppMessageId,
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
						break;
						// TODO: handle button reply messages
					} else if (parsed.whatsappInboundMessage.interactive.type === 'nfm_reply') {
						logActivity = false;
						// Handle flow response messages
						const flowResult = await handleFlowResponse({
							flowName: parsed.whatsappInboundMessage.interactive.nfm_reply.name,
							body: parsed.whatsappInboundMessage.interactive.nfm_reply.body,
							response: parsed.whatsappInboundMessage.interactive.nfm_reply.response_json,
							from: senderPhone,
							whatsappIdentity,
							whatsappContextWamidId,
							tx
						});
						personId = flowResult.personId;
						organizationId = flowResult.organizationId;
					}
					break;
				}
				case 'reaction': {
					// reaction is for emoji reactions
					logActivity = false;
					const messageActivity = await _findWhatsAppMessageByWamidIdUnsafe({
						wamidId: parsed.whatsappInboundMessage.reaction.message_id,
						tx
					});

					personId = messageActivity.personId || undefined;
					organizationId = messageActivity.organizationId;
					if (messageActivity.personId) {
						await handleIncomingReaction({
							tx,
							messageId: messageActivity.id,
							personId: messageActivity.personId,
							phoneNumber: senderPhone,
							emoji: parsed.whatsappInboundMessage.reaction.emoji || null
						});
					}
					break;
				}
				default:
					log.warn(parsed, 'Unknown message type');
					break;
			}

			if (!organizationId || !personId) {
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
