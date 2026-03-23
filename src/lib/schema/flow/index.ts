import { type XYPosition } from '@xyflow/svelte';
import { type FilterGroupType, filterGroup } from '$lib/schema/person/filter';

import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';

const nodeType = v.picklist(['message', 'eventSignup', 'tagAdd', 'targeting', 'templateMessage']);

const nodeBase = v.object({
	id: helpers.uuid,
	position: v.object({
		x: v.number(),
		y: v.number()
	})
});

const eventSignupNode = v.object({
	...nodeBase.entries,
	type: v.literal('eventSignup'),
	data: v.object({
		eventId: helpers.uuid
	})
});

const tagAddNode = v.object({
	...nodeBase.entries,
	type: v.literal('tagAdd'),
	data: v.object({
		tagId: helpers.uuid
	})
});

const targetingNode = v.object({
	...nodeBase.entries,
	type: v.literal('targeting'),
	data: v.object({
		filterGroup: filterGroup
	})
});

export const whatsappMessageNodeData = v.object({
	text: helpers.mediumString,
	imageUrl: v.optional(helpers.url),
	buttons: v.array(v.object({ id: helpers.uuid, label: helpers.mediumString }))
});
export type WhatsappMessageNodeData = v.InferOutput<typeof whatsappMessageNodeData>;

const messageNode = v.object({
	...nodeBase.entries,
	type: v.literal('message'),
	data: whatsappMessageNodeData
});

export const whatsappTemplateMessageNodeData = v.object({
	templateId: helpers.uuid,
	header: v.optional(
		v.object({
			templateStrings: v.optional(v.array(helpers.shortString)),
			imageUrl: v.optional(helpers.url)
		})
	),
	body: v.optional(
		v.object({
			templateStrings: v.optional(v.array(helpers.shortString))
		})
	),
	buttons: v.optional(v.array(v.object({ id: helpers.uuid })))
});
export type WhatsappTemplateMessageNodeData = v.InferOutput<typeof whatsappTemplateMessageNodeData>;

const templateMessageNode = v.object({
	...nodeBase.entries,
	type: v.literal('templateMessage'),
	data: whatsappTemplateMessageNodeData
});

const nodeSchema = v.variant('type', [
	eventSignupNode,
	tagAddNode,
	targetingNode,
	messageNode,
	templateMessageNode
]);

const edgeSchema = v.object({
	type: v.literal('edge'),
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
