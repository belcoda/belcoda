import { parse } from 'valibot';
import { db } from '$lib/server/db';
import { renderValiError } from '$lib/schema/helpers';
import {
	incomingMessageSchema,
	type IncomingMessage
} from '$lib/schema/whatsapp/ycloud/incoming_message';
import { sendFlowMessage } from '$lib/server/utils/whatsapp/ycloud/ycloud_api';
import { getPersonIdFromButtonAction } from '$lib/server/queue/handlers/whatsapp/incoming_message_actions/get_details_from_message';
import pino from '$lib/pino';
import { and, eq } from 'drizzle-orm';
import { whatsappThread } from '$lib/schema/drizzle';
import { extractButtonActionString } from '$lib/server/utils/whatsapp/ycloud/convert_outbound';
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
import { getDetailsFromMessageByWabaId } from '$lib/server/queue/handlers/whatsapp/incoming_message_actions/get_details_from_message';
import { handleFlowResponse } from '$lib/server/queue/handlers/whatsapp/handlers/flow';

import { convertIncomingWhatsAppMessage } from '$lib/server/queue/handlers/whatsapp/incoming_message_actions/convert_incoming';

import { v7 as uuidv7 } from 'uuid';
export async function handleIncomingMessage(incomingMessage: unknown) {
	try {
		const parsed = parse(incomingMessageSchema, incomingMessage);

		log.debug(parsed, 'Parsed incoming whatsapp message');

		let personId: string | undefined = undefined;
		let organizationId: string | undefined = undefined;
		let logActivity: boolean = true; //whether to log the activity to the timeline. Some messages (eg: emoji reactions, etc) are not meant to be logged to the timeline.
		let insertedWhatsAppMessageId: string = uuidv7();
		await db.transaction(async (tx) => {
			switch (parsed.whatsappInboundMessage.type) {
				case 'text': {
					const actionCode = extractActionCode(parsed.whatsappInboundMessage.text.body);
					log.info(
						{ actionCode, text: parsed.whatsappInboundMessage.text.body },
						'Extracted action code from message'
					);
					if (actionCode) {
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
									safeGetCountryCodeFromPhoneNumber(parsed.whatsappInboundMessage.from) ||
									organization.country;
								const eventSignup = await createIncompleteEventSignupHelper({
									eventId: event.id,
									personAction: {
										subscribed: true,
										country: countryCode,
										phoneNumber: parsed.whatsappInboundMessage.from,
										givenName:
											parsed.whatsappInboundMessage.customerProfile?.name ??
											parsed.whatsappInboundMessage.from
									},
									signupDetails: {
										channel: { type: 'whatsapp' },
										customFields: {}
									},
									organizationId: event.organizationId,
									tx
								});
								personId = eventSignup.personId;
								const flowId = event.settings.whatsappFlowId;
								if (flowId) {
									try {
										await sendFlowMessage({
											from: parsed.whatsappInboundMessage.to,
											to: parsed.whatsappInboundMessage.from,
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
												personPhone: parsed.whatsappInboundMessage.from,
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
												phoneNumber: parsed.whatsappInboundMessage.from,
												givenName:
													parsed.whatsappInboundMessage.customerProfile?.name ??
													parsed.whatsappInboundMessage.from
											},
											signupDetails: {
												channel: { type: 'whatsapp' },
												customFields: {}
											},
											organizationId: event.organizationId,
											tx,
											defaultEventSignupId: eventSignup.id
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
											phoneNumber: parsed.whatsappInboundMessage.from,
											givenName:
												parsed.whatsappInboundMessage.customerProfile?.name ??
												parsed.whatsappInboundMessage.from
										},
										signupDetails: {
											channel: { type: 'whatsapp' },
											customFields: {}
										},
										organizationId: event.organizationId,
										tx,
										defaultEventSignupId: eventSignup.id
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
									safeGetCountryCodeFromPhoneNumber(parsed.whatsappInboundMessage.from) ||
									organization.country;
								const eventSignup = await attendedEventHelper({
									eventId: event.id,
									personAction: {
										subscribed: true,
										country: countryCode,
										phoneNumber: parsed.whatsappInboundMessage.from,
										givenName:
											parsed.whatsappInboundMessage.customerProfile?.name ??
											parsed.whatsappInboundMessage.from
									},
									signupDetails: {
										channel: { type: 'whatsapp' },
										customFields: {}
									},
									organizationId: event.organizationId,
									tx
								});
								personId = eventSignup.personId;
								organizationId = event.organizationId;
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
					break;
				}
				case 'interactive': {
					// interactive can be button_reply or nfm_reply (flow message)
					if (parsed.whatsappInboundMessage.interactive.type === 'button_reply') {
						// get the button id, which should give me the thread Id and node Id...
						const buttonActionString = parsed.whatsappInboundMessage.interactive.button_reply.id;
						const { threadId, nodeId, buttonId } = extractButtonActionString(buttonActionString);
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
							personPhoneNumber: parsed.whatsappInboundMessage.from,
							personName:
								parsed.whatsappInboundMessage.customerProfile?.name ??
								parsed.whatsappInboundMessage.from,
							organizationId: threadObject.organizationId,
							organizationCountry: organization.country,
							messageId: insertedWhatsAppMessageId,
							tx
						});
						const queue = await getQueue();
						queue.processFlowNodeAction({
							nodeId: nextNode,
							personId,
							organizationId: threadObject.organizationId,
							threadId: threadObject.id
						});
						break;
						// TODO: handle button reply messages
					} else if (parsed.whatsappInboundMessage.interactive.type === 'nfm_reply') {
						// Handle flow response messages
						const flowResult = await handleFlowResponse({
							flowName: parsed.whatsappInboundMessage.interactive.nfm_reply.name,
							body: parsed.whatsappInboundMessage.interactive.nfm_reply.body,
							response: parsed.whatsappInboundMessage.interactive.nfm_reply.response_json,
							from: parsed.whatsappInboundMessage.from,
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
							phoneNumber: parsed.whatsappInboundMessage.from,
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
				// get organization from wabaId if possible...
				const { organization, person } = await getDetailsFromMessageByWabaId({
					wabaId: parsed.whatsappInboundMessage.wabaId,
					messageId: insertedWhatsAppMessageId,
					personPhoneNumber: parsed.whatsappInboundMessage.from,
					personName:
						parsed.whatsappInboundMessage.customerProfile?.name ??
						parsed.whatsappInboundMessage.from,
					tx
				});
				organizationId = organization.id;
				personId = person.id;
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
			const whatsappMessage = await createWhatsAppMessage({
				message: await convertIncomingWhatsAppMessage({
					inboundMessage: parsed as IncomingMessage,
					organizationId
				}),
				personId,
				id: insertedWhatsAppMessageId,
				type: 'incoming_api_message',
				organizationId,
				tx
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
	const edge = edges.filter((edge) => edge.source === buttonId || edge.sourceHandle === buttonId);
	if (edge.length === 0) {
		throw new Error('Edge not found');
	}
	return edge[0].target; // once we have nodes that have more than one input, we will need to update this to handle targetHandle
}
