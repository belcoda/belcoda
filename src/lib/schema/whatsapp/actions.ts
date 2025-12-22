import { uuid } from '$lib/schema/helpers';
import { string, literal, object, type InferOutput, variant } from 'valibot';

export const whatsappMessageActions = {
	sendMessage: object({
		type: literal('sendMessage'),
		messageId: uuid,
		messageText: string()
	}),
	eventSignup: object({
		type: literal('eventSignup'),
		eventId: uuid,
		eventName: string()
	})
};

export const whatsappMessageActionsSchema = variant('type', [
	whatsappMessageActions.sendMessage,
	whatsappMessageActions.eventSignup
]);

export type WhatsappMessageActions = InferOutput<typeof whatsappMessageActionsSchema>;
