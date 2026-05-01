export type TemplateVariableContext = 'person' | 'organization' | 'sender' | 'event' | 'petition';

export type TemplateVariable = {
	context: TemplateVariableContext;
	field: string;
	key: `${TemplateVariableContext}.${string}`;
};

export type TemplateVariableGroup = {
	context: TemplateVariableContext;
	optional?: boolean;
	variables: readonly TemplateVariable[];
};

function createTemplateVariable<TContext extends TemplateVariableContext>(
	context: TContext,
	field: string
): TemplateVariable {
	return {
		context,
		field,
		key: `${context}.${field}`
	};
}

export const defaultTemplateVariableContexts = ['person', 'organization', 'sender'] as const;

export const allTemplateVariableContexts = [
	'person',
	'organization',
	'sender',
	'event',
	'petition'
] as const satisfies readonly TemplateVariableContext[];

export const templateVariableGroups = [
	{
		context: 'person',
		variables: [
			createTemplateVariable('person', 'given_name'),
			createTemplateVariable('person', 'family_name'),
			createTemplateVariable('person', 'email_address'),
			createTemplateVariable('person', 'phone_number')
		]
	},
	{
		context: 'organization',
		variables: [
			createTemplateVariable('organization', 'name'),
			createTemplateVariable('organization', 'slug')
		]
	},
	{
		context: 'sender',
		variables: [createTemplateVariable('sender', 'name'), createTemplateVariable('sender', 'email')]
	},
	{
		context: 'event',
		optional: true,
		variables: [
			createTemplateVariable('event', 'name'),
			createTemplateVariable('event', 'start_date'),
			createTemplateVariable('event', 'location')
		]
	},
	{
		context: 'petition',
		optional: true,
		variables: [
			createTemplateVariable('petition', 'name'),
			createTemplateVariable('petition', 'goal_count')
		]
	}
] as const satisfies readonly TemplateVariableGroup[];
