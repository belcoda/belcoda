import { type WhatsappMessage } from '$lib/schema/whatsapp/message';

// stub function for converting inbound messages from the Titan API format to our internal data format for storing whatsapp messages
export function convertInboundMessage({ message }: { message: WhatsappMessage }) {
	//convert message to outbound message...
	return message;
}
