import * as v from 'valibot';
import * as h from '$lib/schema/helpers';
import { signupChannelType } from '$lib/schema/event/settings';
import { filterGroup } from '$lib/schema/person/filter';
import { outgoingWhatsAppMessageDataSchema } from '$lib/schema/whatsapp/message';
import { createEmailMessage } from '$lib/schema/email-message';
export const nodeTypes = [
	'trigger',
	'whatsapp.sendMessage',
	'email.send',
	'event.signup',
	'tag.add',
	'team.add',
	'utils.waitUntil',
	'utils.split',
	'utils.filter',
	'utils.merge'
] as const;
export const nodeType = v.picklist(nodeTypes);
export type NodeType = v.InferOutput<typeof nodeType>;

export const nodeBase = v.object({
	id: h.uuid,
	width: v.optional(v.number()),
	height: v.optional(v.number()),
	position: v.object({
		x: v.number(),
		y: v.number()
	})
});
export type NodeBase = v.InferOutput<typeof nodeBase>;

// keep in exact 1:1 sync with the triggerData variants below
export const triggerTypes = [
	'event.signup',
	'utils.cron',
	'utils.manualTrigger',
	'whatsapp.messageReceived.actionCode',
	'whatsapp.messageReceived.triggerWords',
	'person.created',
	'person.addedToTeam'
] as const;
export const triggerType = v.picklist(triggerTypes);
export type TriggerType = v.InferOutput<typeof triggerType>;

export const triggerData = [
	v.object({
		type: v.literal('event.signup'),
		eventId: h.uuid,
		triggerOnSignupChannel: v.record(signupChannelType, v.boolean())
	}),
	v.object({
		type: v.literal('utils.cron'),
		targets: filterGroup,
		cronExpression: v.string()
	}),
	v.object({
		type: v.literal('utils.manualTrigger'),
		targets: filterGroup
	}),
	v.object({
		type: v.literal('whatsapp.messageReceived.actionCode'),
		actionCodeId: h.uuid
	}),
	v.object({
		type: v.literal('whatsapp.messageReceived.triggerWords'),
		triggerWords: v.array(v.string())
	}),
	v.object({
		type: v.literal('person.created'),
		triggerOnImports: v.boolean()
	}),
	v.object({
		type: v.literal('person.addedToTeam'),
		teamId: h.uuid
	})
];

const triggerDataSchema = v.variant('type', triggerData);
export type TriggerData = v.InferOutput<typeof triggerDataSchema>;

export const triggerNode = v.object({
	type: v.literal('trigger'),
	trigger: triggerDataSchema
});
export type TriggerNode = v.InferOutput<typeof triggerNode>;

export const nodeData = [
	v.object({
		type: v.literal('whatsapp.sendMessage'),
		message: outgoingWhatsAppMessageDataSchema,
		whatsappAccountId: h.uuid
	}),
	v.object({
		type: v.literal('email.send'),
		email: v.omit(createEmailMessage, ['recipients'])
	}),
	v.object({
		type: v.literal('event.signup'),
		eventId: h.uuid
	}),
	v.object({
		type: v.literal('tag.add'),
		tagId: h.uuid
	}),
	v.object({
		type: v.literal('team.add'),
		teamId: h.uuid
	}),
	v.object({
		type: v.literal('utils.waitUntil'),
		waitUntil: h.unixTimestamp
	}),
	v.object({
		type: v.literal('utils.split'),
		numberOfHandlesOut: h.count
	}),
	v.object({
		type: v.literal('utils.filter'),
		allowThrough: filterGroup,
		block: filterGroup
	}),
	v.object({
		type: v.literal('utils.merge'),
		numberOfHandlesIn: h.count
	}),
	triggerNode
];
export const nodeDataSchema = v.variant('type', nodeData);
export type NodeData = v.InferOutput<typeof nodeDataSchema>;

export const node = v.object({
	...nodeBase.entries,
	data: nodeDataSchema
});

export type Node = v.InferOutput<typeof node>;

const edgeSchema = v.object({
	id: h.mediumString,
	source: h.uuid,
	target: h.uuid,
	sourceHandle: v.optional(h.uuid),
	targetHandle: v.optional(h.uuid)
});
export type Edge = v.InferOutput<typeof edgeSchema>;

export const flowSchema = v.object({
	nodes: v.array(node),
	edges: v.array(edgeSchema)
});
export type Flow = v.InferOutput<typeof flowSchema>;
