import { type WhatsappMessage } from '$lib/schema/whatsapp/message';

// stub function for converting outbound messages to Titan API format
export function convertOutboundMessage({
	message,
	jid
}: {
	message: WhatsappMessage;
	jid: string;
}) {
	//convert message to outbound message, addressing it to the linked-device destination JID...
	return {
		...message,
		jid
	};
}
