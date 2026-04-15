export const activityTypesList = [
	'whatsapp_message_incoming', //referenceId: whatsappMessageId
	'whatsapp_message_outgoing', //referenceId: whatsappMessageId
	'whatsapp_group_message_incoming',

	'email_outgoing', //referenceId: emailMessageId

	'tag_added', //referenceId: tagId
	'tag_removed', //referenceId: tagId

	'team_added', //referenceId: teamId
	'team_removed', //referenceId: teamId

	'event_signup', //referenceId: eventSignupId
	'event_not_attending', //referenceId: eventSignupId
	'event_attended', //referenceId: eventSignupId
	'event_noshow', //referenceId: eventSignupId
	'event_apology', //referenceId: eventSignupId
	'event_removed', //referenceId: eventSignuId

	'event_signup_email_sent', //referenceId: eventSignupId
	'event_reminder_email_sent', //referenceId: eventSignupId

	'petition_signed',
	'petition_removed',

	'note_added' //referenceId: noteId
] as const;
export const activityType = v.picklist(activityTypesList);
export type ActivityType = v.InferOutput<typeof activityType>;

import * as v from 'valibot';
import { shortString, mediumString, uuid, emoji } from '$lib/schema/helpers';

export const activityPreviewTypesList = [...activityTypesList] as const;
export const activityPreviewType = v.picklist(activityPreviewTypesList);
export type ActivityPreviewType = v.InferOutput<typeof activityPreviewType>;

import { whatsappMessage } from '$lib/schema/whatsapp/message';

export const activityPreviewPayloads = v.variant('type', [
	v.object({
		type: v.literal('whatsapp_message_incoming'),
		message: whatsappMessage,
		whatsappMessageId: uuid
	}),
	v.object({
		type: v.literal('whatsapp_message_outgoing'),
		message: whatsappMessage,
		whatsappMessageId: uuid
	}),
	v.object({
		type: v.literal('whatsapp_group_message_incoming'),
		message: whatsappMessage,
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
		type: v.literal('event_not_attending'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('event_signup_email_sent'),
		eventName: mediumString,
		eventId: uuid
	}),
	v.object({
		type: v.literal('event_reminder_email_sent'),
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
	}),
	v.object({
		type: v.literal('note_added'),
		notePreview: shortString,
		userName: mediumString,
		noteId: uuid
	})
]);
export type ActivityPreviewPayload = v.InferOutput<typeof activityPreviewPayloads>;
