import type { FilterGroupType } from '$lib/schema/person/filter';
export type NodeType = 'message' | 'eventSignup' | 'tagAdd' | 'targeting';

export type WhatsAppButton = {
	id: string;
	label: string;
};
export type WhatsAppMessageData = {
	hideImage?: boolean;
	text: string;
	buttons: WhatsAppButton[];
	imageUrl: string | null;
};

export type TemplateMessageData = {
	templateId: string;
	header?: {
		templateStrings?: string[];
		imageUrl?: string;
	};
	body?: {
		templateStrings?: string[];
	};
	buttons?: { id: string }[];
};

export type EventSignupData = {
	eventId: string | null;
};

export type TagAddData = {
	tagId: string | null;
};

export type TargetingData = {
	filter: FilterGroupType;
};
