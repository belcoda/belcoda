export const activityTypesList = [
	'whatsapp_message_incoming',
	'whatsapp_message_outgoing',
	'whatsapp_group_message_incoming',

	'email_outgoing',

	'tag_added',
	'tag_removed',

	'team_added',
	'team_removed',

	'event_signup',
	'event_attended',
	'event_noshow',
	'event_apology',
	'event_removed',

	'petition_signed',
	'petition_removed',

	'status_updated',
	'note_added'
] as const;
export const activityType = v.picklist(activityTypesList);
export type ActivityType = v.InferOutput<typeof activityType>;

import * as v from 'valibot';
import { longString, mediumString, shortStringEmpty, uuid, emoji } from '$lib/schema/helpers';
import { whatsappMessage } from '$lib/schema/whatsapp/message';
import { eventSignupDetails } from '$lib/schema/event/settings';

export const activityPreviewTypesList = [
	'whatsapp_message_incoming',
	'whatsapp_message_outgoing',
	'whatsapp_group_message_incoming',
	'email_outgoing',
	'tag_added',
	'tag_removed',
	'team_added',
	'team_removed',
	'event_signup',
	'event_attended',
	'event_noshow',
	'event_apology',
	'event_removed',
	'petition_signed',
	'petition_removed'
] as const;
export const activityPreviewType = v.picklist(activityPreviewTypesList);
export type ActivityPreviewType = v.InferOutput<typeof activityPreviewType>;

export const activityPreviewWhatsAppMessage = v.variant('type', [
	v.object({
		type: v.literal('text'),
		text: v.pipe(
			v.string(),
			v.trim(),
			v.transform((input) => input.substring(0, 100))
		)
	}),
	v.object({
		type: v.literal('image')
	}),
	v.object({
		type: v.literal('video')
	}),
	v.object({
		type: v.literal('audio')
	}),
	v.object({
		type: v.literal('document')
	}),
	v.object({
		type: v.literal('sticker')
	}),
	v.object({
		type: v.literal('location')
	}),
	v.object({
		type: v.literal('contact')
	}),
	v.object({
		type: v.literal('flow')
	}),
	v.object({
		type: v.literal('button'),
		text: v.pipe(
			v.string(),
			v.trim(),
			v.transform((input) => input.substring(0, 100))
		)
	}),
	v.object({
		type: v.literal('reaction'),
		emoji: emoji
	})
]);

export const activityPreviewPayloads = v.variant('type', [
	v.object({
		type: v.literal('whatsapp_message_incoming'),
		message: activityPreviewWhatsAppMessage,
		whatsappMessageId: uuid
	}),

	v.object({
		type: v.literal('whatsapp_message_outgoing'),
		message: activityPreviewWhatsAppMessage,
		whatsappMessageId: uuid
	}),

	v.object({
		type: v.literal('whatsapp_group_message_incoming'),
		message: activityPreviewWhatsAppMessage,
		whatsappGroupId: uuid
	}),
	v.object({
		type: v.literal('email_outgoing'),
		subject: mediumString,
		bodyStart: v.pipe(
			v.string(),
			v.trim(),
			v.transform((input) => input.substring(0, 100))
		),
		emailMessageId: uuid
	}),
	v.object({
		type: v.literal('tag_added'),
		tagName: mediumString,
		tagId: uuid
	}),
	v.object({
		type: v.literal('tag_removed'),
		tagName: mediumString,
		tagId: uuid
	}),
	v.object({
		type: v.literal('team_added'),
		teamName: mediumString,
		teamId: uuid
	}),
	v.object({
		type: v.literal('team_removed'),
		teamName: mediumString,
		teamId: uuid
	}),
	v.object({
		type: v.literal('event_signup'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('event_attended'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('event_noshow'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('event_apology'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('event_removed'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('petition_signed'),
		petitionName: mediumString,
		petitionId: uuid
	}),
	v.object({
		type: v.literal('petition_removed'),
		petitionName: mediumString,
		petitionId: uuid
	})
]);
export type ActivityPreviewPayload = v.InferOutput<typeof activityPreviewPayloads>;
