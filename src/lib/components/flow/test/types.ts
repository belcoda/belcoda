export interface WhatsAppButton {
	id: string;
	label: string;
}
import { type XYPosition } from '@xyflow/svelte';
export interface WhatsAppNodeData {
	id: string;
	type: 'message';
	position: XYPosition;
	width?: number | undefined;
	height?: number | undefined;
	data: {
		text: string;
		buttons: WhatsAppButton[];
		imageUrl: string | null;
	};
}
