import { json } from '@sveltejs/kit';
import { toJsonSchema } from '@valibot/to-json-schema';
import { convert } from '@openapi-contrib/json-schema-to-openapi-schema';
import { type BaseSchema, type BaseIssue } from 'valibot';
import { activityWebhook } from '$lib/schema/activity';
import { personWebhook } from '$lib/schema/person';
import { eventWebhook } from '$lib/schema/event';
import { eventSignupWebhook } from '$lib/schema/event-signup';
import { personNoteWebhook } from '$lib/schema/person-note';
import { personImportWebhook } from '$lib/schema/person-import';
import { petitionWebhook } from '$lib/schema/petition/petition';
import { petitionSignatureWebhook } from '$lib/schema/petition/petition-signature';
import { tagWebhook, personTagWebhook } from '$lib/schema/tag';
import { teamWebhook, teamPersonWebhook, teamUserWebhook } from '$lib/schema/team';
import { organizationWebhook, organizationMemberWebhook } from '$lib/schema/organization';
import { whatsappMessageWebhook } from '$lib/schema/whatsapp-message';
import { whatsappThreadWebhook } from '$lib/schema/whatsapp-thread';
import { emailMessageWebhook } from '$lib/schema/email-message';

import { CURRENT_API_VERSION } from '$lib/schema/helpers';
import { type WebhookEvent } from '$lib/schema/webhook';
async function generateOpenSchemaFromValibot(
	input: BaseSchema<unknown, unknown, BaseIssue<unknown>>
) {
	const schema = toJsonSchema(input, { errorMode: 'ignore' });
	const openapiSchema = await convert(schema);
	return openapiSchema;
}

type WebhookBoilerplateArgs = {
	description: string;
	eventType: WebhookEvent;
	/** `components.schemas` key; envelope `data` is `#/components/schemas/{componentPath}` */
	componentPath: string;
};

function generateOpenApiWebhookBoilerplate({
	description,
	eventType,
	componentPath
}: WebhookBoilerplateArgs) {
	const data: { $ref: string } = { $ref: `#/components/schemas/${componentPath}` };
	return {
		[`${eventType}`]: {
			post: {
				parameters: [
					{
						$ref: '#/components/parameters/WebhookSecretHeader'
					}
				],
				requestBody: {
					description,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['id', 'type', 'createdAt', 'apiVersion', 'data'],
								properties: {
									id: {
										type: 'string',
										format: 'uuid',
										description: 'Unique webhook event ID'
									},
									type: {
										type: 'string',
										const: eventType,
										description: 'Event type'
									},
									createdAt: {
										type: 'string',
										format: 'date-time',
										description: 'ISO8601 timestamp when the webhook event was created'
									},
									apiVersion: {
										type: 'string',
										description: 'API version used to generate this event',
										example: CURRENT_API_VERSION
									},
									data
								},
								additionalProperties: false
							}
						}
					}
				},
				responses: {
					'200': {
						description: 'Return a 2xx response to acknowledge that the payload was received'
					}
				}
			}
		}
	};
}

/** `data` payload for `*.deleted` webhooks that only carry a resource id (see Valibot in `webhook.ts`). */
function singleIdDeletePayload(idKey: string, idDescription: string) {
	return {
		type: 'object' as const,
		required: [idKey] as [string, ...string[]],
		properties: {
			[idKey]: { type: 'string' as const, format: 'uuid' as const, description: idDescription }
		},
		additionalProperties: false as const
	};
}

/**
 * All entries from `webhookEvents` in `$lib/schema/webhook.ts` (event subscription types).
 * Order matches that array.
 */
const WEBHOOK_EVENT_SPECS: WebhookBoilerplateArgs[] = [
	{
		eventType: 'event.created',
		description: 'Fires when a new event is created',
		componentPath: 'event'
	},
	{
		eventType: 'event.updated',
		description: 'Fires when an event is updated',
		componentPath: 'event'
	},
	{
		eventType: 'event.deleted',
		description: 'Fires when an event is deleted',
		componentPath: 'eventDeleted'
	},
	{
		eventType: 'event.signup.created',
		description: 'Fires when someone signs up for an event',
		componentPath: 'eventSignup'
	},
	{
		eventType: 'event.signup.updated',
		description: 'Fires when an event signup is updated',
		componentPath: 'eventSignup'
	},
	{
		eventType: 'event.signup.deleted',
		description: 'Fires when an event signup is removed',
		componentPath: 'eventSignupDeleted'
	},
	{
		eventType: 'person.created',
		description: 'Fires when a new person record is created',
		componentPath: 'person'
	},
	{
		eventType: 'person.updated',
		description: 'Fires when a person record is updated',
		componentPath: 'person'
	},
	{
		eventType: 'person.deleted',
		description: 'Fires when a person record is deleted',
		componentPath: 'personDeleted'
	},
	{
		eventType: 'person.note.created',
		description: 'Fires when a note is added to a person',
		componentPath: 'personNote'
	},
	{
		eventType: 'person.note.updated',
		description: 'Fires when a person note is updated',
		componentPath: 'personNote'
	},
	{
		eventType: 'person.note.deleted',
		description: 'Fires when a person note is deleted',
		componentPath: 'personNoteDeleted'
	},
	{
		eventType: 'person.import.created',
		description: 'Fires when a person import job is created or completes',
		componentPath: 'personImport'
	},
	{
		eventType: 'activity.created',
		description: 'Fires when a new activity is recorded',
		componentPath: 'activity'
	},
	{
		eventType: 'petition.created',
		description: 'Fires when a new petition is created',
		componentPath: 'petition'
	},
	{
		eventType: 'petition.updated',
		description: 'Fires when a petition is updated',
		componentPath: 'petition'
	},
	{
		eventType: 'petition.deleted',
		description: 'Fires when a petition is deleted',
		componentPath: 'petitionDeleted'
	},
	{
		eventType: 'petition.signature.created',
		description: 'Fires when a new petition signature is created',
		componentPath: 'petitionSignature'
	},
	{
		eventType: 'petition.signature.updated',
		description: 'Fires when a petition signature is updated',
		componentPath: 'petitionSignature'
	},
	{
		eventType: 'petition.signature.deleted',
		description: 'Fires when a petition signature is deleted',
		componentPath: 'petitionSignatureDeleted'
	},
	{
		eventType: 'tag.created',
		description: 'Fires when a new tag is created',
		componentPath: 'tag'
	},
	{ eventType: 'tag.updated', description: 'Fires when a tag is updated', componentPath: 'tag' },
	{
		eventType: 'tag.deleted',
		description: 'Fires when a tag is deleted',
		componentPath: 'tagDeleted'
	},
	{
		eventType: 'tag.person.added',
		description: 'Fires when a tag is added to a person',
		componentPath: 'personTag'
	},
	{
		eventType: 'tag.person.removed',
		description: 'Fires when a tag is removed from a person',
		componentPath: 'personTag'
	},
	{
		eventType: 'team.created',
		description: 'Fires when a new team is created',
		componentPath: 'team'
	},
	{ eventType: 'team.updated', description: 'Fires when a team is updated', componentPath: 'team' },
	{
		eventType: 'team.deleted',
		description: 'Fires when a team is deleted',
		componentPath: 'teamDeleted'
	},
	{
		eventType: 'team.person.added',
		description: 'Fires when a person is added to a team',
		componentPath: 'teamPerson'
	},
	{
		eventType: 'team.person.removed',
		description: 'Fires when a person is removed from a team',
		componentPath: 'teamPerson'
	},
	{
		eventType: 'team.user.added',
		description: 'Fires when a user is added to a team',
		componentPath: 'teamUser'
	},
	{
		eventType: 'team.user.removed',
		description: 'Fires when a user is removed from a team',
		componentPath: 'teamUser'
	},
	{
		eventType: 'whatsapp.message.created',
		description: 'Fires when a WhatsApp message is created',
		componentPath: 'whatsappMessage'
	},
	{
		eventType: 'whatsapp.message.updated',
		description: 'Fires when a WhatsApp message is updated',
		componentPath: 'whatsappMessage'
	},
	{
		eventType: 'whatsapp.message.deleted',
		description: 'Fires when a WhatsApp message is deleted',
		componentPath: 'whatsappMessageDeleted'
	},
	{
		eventType: 'whatsapp.thread.created',
		description: 'Fires when a WhatsApp thread is created',
		componentPath: 'whatsappThread'
	},
	{
		eventType: 'whatsapp.thread.updated',
		description: 'Fires when a WhatsApp thread is updated',
		componentPath: 'whatsappThread'
	},
	{
		eventType: 'whatsapp.thread.deleted',
		description: 'Fires when a WhatsApp thread is deleted',
		componentPath: 'whatsappThreadDeleted'
	},
	{
		eventType: 'email.message.created',
		description: 'Fires when an email message is created',
		componentPath: 'emailMessage'
	},
	{
		eventType: 'email.message.updated',
		description: 'Fires when an email message is updated',
		componentPath: 'emailMessage'
	},
	{
		eventType: 'email.message.deleted',
		description: 'Fires when an email message is deleted',
		componentPath: 'emailMessageDeleted'
	},
	{
		eventType: 'organization.updated',
		description: 'Fires when organization settings are updated',
		componentPath: 'organization'
	},
	{
		eventType: 'member.created',
		description: 'Fires when a member is added to the organization',
		componentPath: 'organizationMember'
	},
	{
		eventType: 'member.updated',
		description: 'Fires when an organization member is updated',
		componentPath: 'organizationMember'
	},
	{
		eventType: 'member.deleted',
		description: 'Fires when a member is removed from the organization',
		componentPath: 'memberDeleted'
	}
];

export async function GET() {
	const [
		activityOpenApiSchema,
		personOpenApiSchema,
		eventOpenApiSchema,
		eventSignupOpenApiSchema,
		personNoteOpenApiSchema,
		personImportOpenApiSchema,
		petitionOpenApiSchema,
		petitionSignatureOpenApiSchema,
		tagOpenApiSchema,
		personTagOpenApiSchema,
		teamOpenApiSchema,
		teamPersonOpenApiSchema,
		teamUserOpenApiSchema,
		organizationOpenApiSchema,
		organizationMemberOpenApiSchema,
		whatsappMessageOpenApiSchema,
		whatsappThreadOpenApiSchema,
		emailMessageOpenApiSchema
	] = await Promise.all([
		generateOpenSchemaFromValibot(activityWebhook),
		generateOpenSchemaFromValibot(personWebhook),
		generateOpenSchemaFromValibot(eventWebhook),
		generateOpenSchemaFromValibot(eventSignupWebhook),
		generateOpenSchemaFromValibot(personNoteWebhook),
		generateOpenSchemaFromValibot(personImportWebhook),
		generateOpenSchemaFromValibot(petitionWebhook),
		generateOpenSchemaFromValibot(petitionSignatureWebhook),
		generateOpenSchemaFromValibot(tagWebhook),
		generateOpenSchemaFromValibot(personTagWebhook),
		generateOpenSchemaFromValibot(teamWebhook),
		generateOpenSchemaFromValibot(teamPersonWebhook),
		generateOpenSchemaFromValibot(teamUserWebhook),
		generateOpenSchemaFromValibot(organizationWebhook),
		generateOpenSchemaFromValibot(organizationMemberWebhook),
		generateOpenSchemaFromValibot(whatsappMessageWebhook),
		generateOpenSchemaFromValibot(whatsappThreadWebhook),
		generateOpenSchemaFromValibot(emailMessageWebhook)
	]);

	return json({
		openapi: '3.1.0',
		info: {
			title: 'Belcoda Webhooks Reference',
			version: '2026-04-16',
			description:
				'Webhooks provide a way to receive real-time event notifications from the platform. You can register and manage webhook endpoints in the Organization Settings menu.\n\nOnly organization owners are authorized to create and manage webhook configurations.\n\nCurrently, webhook endpoints receive all event types emitted by the system. Granular event subscriptions—enabling selection of individual or grouped event types—are planned for a future release.'
		},
		webhooks: Object.assign(
			{},
			...WEBHOOK_EVENT_SPECS.map((spec) => generateOpenApiWebhookBoilerplate(spec))
		),
		components: {
			parameters: {
				WebhookSecretHeader: {
					name: 'X-Webhook-Secret',
					in: 'header',
					required: true,
					schema: {
						type: 'string'
					},
					description: 'Shared secret used to verify the webhook sender'
				}
			},
			schemas: {
				activity: activityOpenApiSchema,
				person: personOpenApiSchema,
				event: eventOpenApiSchema,
				eventSignup: eventSignupOpenApiSchema,
				personNote: personNoteOpenApiSchema,
				personImport: personImportOpenApiSchema,
				petition: petitionOpenApiSchema,
				petitionSignature: petitionSignatureOpenApiSchema,
				tag: tagOpenApiSchema,
				personTag: personTagOpenApiSchema,
				team: teamOpenApiSchema,
				teamPerson: teamPersonOpenApiSchema,
				teamUser: teamUserOpenApiSchema,
				organization: organizationOpenApiSchema,
				organizationMember: organizationMemberOpenApiSchema,
				whatsappMessage: whatsappMessageOpenApiSchema,
				whatsappThread: whatsappThreadOpenApiSchema,
				emailMessage: emailMessageOpenApiSchema,

				eventDeleted: singleIdDeletePayload('eventId', 'ID of the deleted event'),
				eventSignupDeleted: singleIdDeletePayload(
					'eventSignupId',
					'ID of the deleted event signup'
				),
				personDeleted: singleIdDeletePayload('personId', 'ID of the deleted person'),
				personNoteDeleted: singleIdDeletePayload('personNoteId', 'ID of the deleted person note'),
				petitionDeleted: singleIdDeletePayload('petitionId', 'ID of the deleted petition'),
				petitionSignatureDeleted: singleIdDeletePayload(
					'petitionSignatureId',
					'ID of the deleted petition signature'
				),
				tagDeleted: singleIdDeletePayload('tagId', 'ID of the deleted tag'),
				teamDeleted: singleIdDeletePayload('teamId', 'ID of the deleted team'),
				whatsappMessageDeleted: singleIdDeletePayload(
					'whatsappMessageId',
					'ID of the deleted WhatsApp message'
				),
				whatsappThreadDeleted: singleIdDeletePayload(
					'whatsappThreadId',
					'ID of the deleted WhatsApp thread'
				),
				emailMessageDeleted: singleIdDeletePayload(
					'emailMessageId',
					'ID of the deleted email message'
				),

				memberDeleted: {
					type: 'object',
					required: ['organizationMemberId', 'userId'],
					properties: {
						organizationMemberId: {
							type: 'string',
							format: 'uuid',
							description: 'ID of the organization membership that was removed'
						},
						userId: {
							type: 'string',
							format: 'uuid',
							description: 'ID of the user who was removed from the organization'
						}
					},
					additionalProperties: false
				}
			}
		}
	});
}
