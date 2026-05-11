import * as v from 'valibot';

export const templateVariableContexts = [
	'person',
	'organization',
	'sender',
	'event',
	'petition'
] as const;
export const templateVariableContext = v.picklist(templateVariableContexts);
export type TemplateVariableContext = v.InferOutput<typeof templateVariableContext>;

export const defaultTemplateVariableContexts = ['person', 'organization', 'sender'] as const;

export const templateVariableKeys = [
	'person.given_name',
	'person.family_name',
	'person.email_address',
	'person.phone_number',
	'organization.name',
	'organization.slug',
	'sender.name',
	'sender.email',
	'event.name',
	'event.start_date',
	'event.location',
	'petition.name',
	'petition.goal_count'
] as const;
export const templateVariableKey = v.picklist(templateVariableKeys);
export type TemplateVariableKey = v.InferOutput<typeof templateVariableKey>;

export type TemplateVariable = {
	context: TemplateVariableContext;
	field: string;
	key: TemplateVariableKey;
};

export const templateVariable = v.object({
	context: templateVariableContext,
	field: v.string(),
	key: templateVariableKey
});

export const templateLiteralParamSource = v.object({
	type: v.literal('literal'),
	value: v.string()
});

export const templateVariableParamSource = v.object({
	type: v.literal('variable'),
	key: templateVariableKey,
	fallback: v.optional(v.string())
});

export const templateParamSource = v.variant('type', [
	templateLiteralParamSource,
	templateVariableParamSource
]);
export type TemplateParamSource = v.InferOutput<typeof templateParamSource>;

export type TemplateVariableGroup = {
	context: TemplateVariableContext;
	optional?: boolean;
	variables: readonly TemplateVariable[];
};

function createTemplateVariable(key: TemplateVariableKey): TemplateVariable {
	const [context, field] = key.split('.') as [TemplateVariableContext, string];

	return {
		context,
		field,
		key
	};
}

function createTemplateVariableGroup<TContext extends TemplateVariableContext>({
	context,
	keys,
	optional
}: {
	context: TContext;
	keys: readonly Extract<TemplateVariableKey, `${TContext}.${string}`>[];
	optional?: boolean;
}): TemplateVariableGroup {
	return {
		context,
		optional,
		variables: keys.map(createTemplateVariable)
	};
}

export const templateVariableGroups = [
	createTemplateVariableGroup({
		context: 'person',
		keys: ['person.given_name', 'person.family_name', 'person.email_address', 'person.phone_number']
	}),
	createTemplateVariableGroup({
		context: 'organization',
		keys: ['organization.name', 'organization.slug']
	}),
	createTemplateVariableGroup({
		context: 'sender',
		keys: ['sender.name', 'sender.email']
	}),
	createTemplateVariableGroup({
		context: 'event',
		optional: true,
		keys: ['event.name', 'event.start_date', 'event.location']
	}),
	createTemplateVariableGroup({
		context: 'petition',
		optional: true,
		keys: ['petition.name', 'petition.goal_count']
	})
] as const satisfies readonly TemplateVariableGroup[];
