import { type XYPosition } from '@xyflow/svelte';
export interface WhatsAppButton {
	id: string;
	label: string;
}

export type NodeGenericData = {
	id: string;
	type: string;
	position: XYPosition;
	width?: number | undefined;
	height?: number | undefined;
};

export interface WhatsAppMessageData {
	hideImage?: boolean;
	text: string;
	buttons: WhatsAppButton[];
	imageUrl: string | null;
}

export interface WhatsAppNodeData extends NodeGenericData {
	type: 'message';
	data: {
		hideImage?: boolean;
		text: string;
		buttons: WhatsAppButton[];
		imageUrl: string | null;
	};
}

export interface EventSignupNodeData extends NodeGenericData {
	id: string;
	type: 'eventSignup';
	data: {
		eventId: string;
	};
}

export interface TagAddNodeData extends NodeGenericData {
	id: string;
	type: 'tagAdd';
	data: {
		tagId: string;
	};
}

export interface TargetingNodeData extends NodeGenericData {
	id: string;
	type: 'targeting';
	data: {
		recipients: string[];
	};
}

export type FlowNode = WhatsAppNodeData | EventSignupNodeData | TagAddNodeData | TargetingNodeData;
