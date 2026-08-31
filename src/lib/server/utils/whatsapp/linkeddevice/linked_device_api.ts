import { type WhatsappMessage } from '$lib/schema/whatsapp/message';
import { v7 as uuidv7 } from 'uuid';
//stub function for sending messages via Linked Device API
export async function sendWhatsappMessageToLinkedDeviceGateway({
	message
}: {
	message: WhatsappMessage;
}) {
	return {
		id: uuidv7()
	};
}
