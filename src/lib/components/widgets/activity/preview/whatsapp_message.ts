import type { WhatsappMessage } from '$lib/schema/whatsapp/message';
import { t } from '$lib/index.svelte';
export function renderWhatsAppMessagePreview(message: WhatsappMessage): string {
	if (message.text) {
		return message.text;
	}
	if (message.image_url) {
		return t`📷 Photo`;
	}
	if (message.video_url) {
		return t`🎥 Video`;
	}
	if (message.audio_url) {
		return t`🎧 Audio message`;
	}
	if (message.sticker_url) {
		return t`🎨 Sticker`;
	}

	return 'WhatsApp message';
}
