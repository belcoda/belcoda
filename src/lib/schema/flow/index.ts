import { type XYPosition } from '@xyflow/svelte';
import { type FilterGroupType, filterGroup } from '$lib/schema/person/filter';

import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

export const nodeType = v.picklist([
	'message',
	'eventSignup',
	'tagAdd',
	'targeting',
	'templateMessage'
]);
export type NodeType = v.InferOutput<typeof nodeType>;

const nodeBase = v.object({
	id: helpers.uuid,
	width: v.optional(v.number()),
	height: v.optional(v.number()),
	position: v.object({
		x: v.number(),
		y: v.number()
	})
});
export type FlowNodeBase = v.InferOutput<typeof nodeBase>;

const eventSignupData = v.object({
	eventId: helpers.uuid
});
export type EventSignupData = v.InferOutput<typeof eventSignupData>;
const eventSignupNode = v.object({
	...nodeBase.entries,
	type: v.literal('eventSignup'),
	data: eventSignupData
});
export type EventSignupNodeData = v.InferOutput<typeof eventSignupNode>;

const tagAddData = v.object({
	tagId: helpers.uuid
});
export type TagAddData = v.InferOutput<typeof tagAddData>;
const tagAddNode = v.object({
	...nodeBase.entries,
	type: v.literal('tagAdd'),
	data: tagAddData
});
export type TagAddNodeData = v.InferOutput<typeof tagAddNode>;

const targetingData = v.object({
	filter: filterGroup
});
export type TargetingData = v.InferOutput<typeof targetingData>;
const targetingNode = v.object({
	...nodeBase.entries,
	type: v.literal('targeting'),
	data: targetingData
});
export type TargetingNodeData = v.InferOutput<typeof targetingNode>;

export const whatsappMessageNodeData = v.object({
	text: helpers.mediumString,
	imageUrl: v.optional(helpers.url),
	buttons: v.array(v.object({ id: helpers.uuid, label: helpers.mediumString }))
});
export type WhatsappMessageData = v.InferOutput<typeof whatsappMessageNodeData>;
const messageNode = v.object({
	...nodeBase.entries,
	type: v.literal('message'),
	data: whatsappMessageNodeData
});
export type MessageNodeData = v.InferOutput<typeof messageNode>;

export const whatsappTemplateMessageNodeData = v.object({
	templateId: helpers.uuid,
	header: v.optional(
		v.object({
			templateStrings: v.optional(v.array(helpers.shortStringEmpty)),
			imageUrl: v.optional(v.nullable(helpers.url))
		})
	),
	body: v.optional(
		v.object({
			templateStrings: v.optional(v.array(helpers.shortStringEmpty))
		})
	),
	buttons: v.optional(v.array(v.object({ id: helpers.uuid })))
});
export type WhatsappTemplateMessageData = v.InferOutput<typeof whatsappTemplateMessageNodeData>;

const templateMessageNode = v.object({
	...nodeBase.entries,
	type: v.literal('templateMessage'),
	data: whatsappTemplateMessageNodeData
});
export type TemplateMessageNode = v.InferOutput<typeof templateMessageNode>;

const nodeSchema = v.variant('type', [
	eventSignupNode,
	tagAddNode,
	targetingNode,
	messageNode,
	templateMessageNode
]);

const edgeSchema = v.object({
	id: helpers.mediumString,
	source: helpers.uuid,
	target: helpers.uuid,
	sourceHandle: v.optional(helpers.uuid),
	targetHandle: v.optional(helpers.uuid)
});

export const flowSchema = v.object({
	nodes: v.array(nodeSchema),
	edges: v.array(edgeSchema)
});

export type Flow = v.InferOutput<typeof flowSchema>;
