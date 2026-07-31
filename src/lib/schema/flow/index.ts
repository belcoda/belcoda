import { filterGroup } from '$lib/schema/person/filter';

import * as v from 'valibot';
import * as helpers from '$lib/schema/helpers';
import { templateParamSource } from '$lib/schema/template-variables';

export const schemaVersionOptions = ['1.0.0'] as const;
export const schemaVersion = v.picklist(schemaVersionOptions);
export type FlowSchemaVersion = v.InferOutput<typeof schemaVersion>;

export const triggerTypeOptions = ['cron', 'whatsappMessageActionCode'] as const;
export const triggerType = v.picklist(triggerTypeOptions);
export type TriggerType = v.InferOutput<typeof triggerType>;

export const flowTriggerConfigurationSchema = v.object({}); //placeholder
export type FlowTriggerConfiguration = v.InferOutput<typeof flowTriggerConfigurationSchema>;

export const flowExecutionStatusOptions = [
	'queued',
	'pending',
	'scheduled',
	'running',
	'completed',
	'failed'
] as const;
export const flowExecutionStatus = v.picklist(flowExecutionStatusOptions);
export type FlowExecutionStatus = v.InferOutput<typeof flowExecutionStatus>;

export const flowExecutionInputSchema = v.object({}); //placeholder
export type FlowExecutionInput = v.InferOutput<typeof flowExecutionInputSchema>;
export const flowExecutionErrorSchema = v.object({}); //placeholder
export type FlowExecutionError = v.InferOutput<typeof flowExecutionErrorSchema>;

export const flowExecutionStepInputSchema = v.object({}); //placeholder
export type FlowExecutionStepInput = v.InferOutput<typeof flowExecutionStepInputSchema>;
export const flowExecutionStepErrorSchema = v.object({ message: v.optional(v.string()) }); //placeholder
export type FlowExecutionStepError = v.InferOutput<typeof flowExecutionStepErrorSchema>;
export const flowExecutionStepOutputSchema = v.object({}); //placeholder
export type FlowExecutionStepOutput = v.InferOutput<typeof flowExecutionStepOutputSchema>;

export const flowExecutionStepStatusOptions = [
	'queued',
	'pending',
	'running',
	'completed',
	'failed'
] as const;
export const flowExecutionStepStatus = v.picklist(flowExecutionStepStatusOptions);
export type FlowExecutionStepStatus = v.InferOutput<typeof flowExecutionStepStatus>;

export const nodeType = v.picklist([
	'message',
	'eventSignup',
	'petitionSignup',
	'tagAdd',
	'teamAdd',
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
	eventId: v.nullable(helpers.uuid)
});
export type EventSignupData = v.InferOutput<typeof eventSignupData>;
const eventSignupNode = v.object({
	...nodeBase.entries,
	type: v.literal('eventSignup'),
	data: eventSignupData
});
export type EventSignupNodeData = v.InferOutput<typeof eventSignupNode>;

const petitionSignupData = v.object({
	petitionId: v.nullable(helpers.uuid)
});
export type PetitionSignupData = v.InferOutput<typeof petitionSignupData>;
const petitionSignupNode = v.object({
	...nodeBase.entries,
	type: v.literal('petitionSignup'),
	data: petitionSignupData
});
export type PetitionSignupNodeData = v.InferOutput<typeof petitionSignupNode>;

const tagAddData = v.object({
	tagId: v.nullable(helpers.uuid)
});
export type TagAddData = v.InferOutput<typeof tagAddData>;
const tagAddNode = v.object({
	...nodeBase.entries,
	type: v.literal('tagAdd'),
	data: tagAddData
});
export type TagAddNodeData = v.InferOutput<typeof tagAddNode>;

const teamAddData = v.object({
	teamId: helpers.uuid
});
export type TeamAddData = v.InferOutput<typeof teamAddData>;
const teamAddNode = v.object({
	...nodeBase.entries,
	type: v.literal('teamAdd'),
	data: teamAddData
});
export type TeamAddNodeData = v.InferOutput<typeof teamAddNode>;

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
	text: v.optional(helpers.mediumStringEmpty),
	imageUrl: v.optional(v.nullable(helpers.url)),
	buttons: v.optional(v.array(v.object({ id: helpers.uuid, label: helpers.mediumString })), [])
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
			templateParams: v.optional(v.array(templateParamSource)),
			imageUrl: v.optional(v.nullable(helpers.url))
		})
	),
	body: v.optional(
		v.object({
			templateStrings: v.optional(v.array(helpers.shortStringEmpty)),
			templateParams: v.optional(v.array(templateParamSource))
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
	petitionSignupNode,
	tagAddNode,
	teamAddNode,
	targetingNode,
	messageNode,
	templateMessageNode
]);
export type Node = v.InferOutput<typeof nodeSchema>;
const edgeSchema = v.object({
	id: helpers.mediumString,
	source: helpers.uuid,
	target: helpers.uuid,
	sourceHandle: v.optional(helpers.uuid),
	targetHandle: v.optional(helpers.uuid)
});
export type Edge = v.InferOutput<typeof edgeSchema>;

export const flowSchema = v.object({
	nodes: v.array(nodeSchema),
	edges: v.array(edgeSchema)
});

export type Flow = v.InferOutput<typeof flowSchema>;

export type FlowSendValidationIssue = {
	nodeId: string;
	message: string;
};

type FlowSendValidationNode = {
	id: string;
	type?: string;
	data?: unknown;
};

export const emptyMessageNodeError =
	'Message nodes must include message text or an image before sending.';
export const emptyButtonMessageNodeError =
	'Message nodes with buttons must include message text before sending.';

export function validateFlowForSending(flow: {
	nodes: FlowSendValidationNode[];
}): FlowSendValidationIssue[] {
	const issues: FlowSendValidationIssue[] = [];

	for (const node of flow.nodes) {
		if (node.type !== 'message') continue;

		const data = node.data as WhatsappMessageData | undefined;
		const text = data?.text?.trim() ?? '';
		const hasImage = !!data?.imageUrl;
		const hasButtons = (data?.buttons?.length ?? 0) > 0;

		if (hasButtons && !text) {
			issues.push({
				nodeId: node.id,
				message: emptyButtonMessageNodeError
			});
			continue;
		}

		if (!text && !hasImage) {
			issues.push({
				nodeId: node.id,
				message: emptyMessageNodeError
			});
		}
	}

	return issues;
}
