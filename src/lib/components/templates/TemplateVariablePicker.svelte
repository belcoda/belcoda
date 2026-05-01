<script lang="ts">
	import BracesIcon from '@lucide/svelte/icons/braces';
	import { tick } from 'svelte';
	import { t } from '$lib/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { formatTemplateVariable } from '$lib/utils/template-variables';
	import {
		defaultTemplateVariableContexts,
		templateVariableGroups,
		type TemplateVariable,
		type TemplateVariableContext,
		type TemplateVariableGroup
	} from '$lib/schema/template-variables';

	let {
		onSelect,
		contexts = defaultTemplateVariableContexts,
		groups = templateVariableGroups,
		triggerLabel,
		disabled = false,
		class: className,
		contentClass
	}: {
		onSelect?: (token: string, variable: TemplateVariable) => void;
		contexts?: readonly TemplateVariableContext[];
		groups?: readonly TemplateVariableGroup[];
		triggerLabel?: string;
		disabled?: boolean;
		class?: string;
		contentClass?: string;
	} = $props();

	let open = $state(false);
	let searchString = $state('');
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const resolvedTriggerLabel = $derived(triggerLabel ?? t`Insert variable`);

	function getContextLabel(context: TemplateVariableContext) {
		switch (context) {
			case 'person':
				return t`Person`;
			case 'organization':
				return t`Organization`;
			case 'sender':
				return t`Sender`;
			case 'event':
				return t`Event`;
			case 'petition':
				return t`Petition`;
		}
	}

	function getVariableLabel(variable: TemplateVariable) {
		switch (variable.key) {
			case 'person.given_name':
				return t`Given name`;
			case 'person.family_name':
				return t`Family name`;
			case 'person.email_address':
				return t`Email address`;
			case 'person.phone_number':
				return t`Phone number`;
			case 'organization.name':
				return t`Organization name`;
			case 'organization.slug':
				return t`Organization slug`;
			case 'sender.name':
				return t`Sender name`;
			case 'sender.email':
				return t`Sender email`;
			case 'event.name':
				return t`Event name`;
			case 'event.start_date':
				return t`Event start date`;
			case 'event.location':
				return t`Event location`;
			case 'petition.name':
				return t`Petition name`;
			case 'petition.goal_count':
				return t`Petition goal`;
			default:
				return variable.field.replaceAll('_', ' ');
		}
	}

	function matchesSearch(variable: TemplateVariable, search: string) {
		const normalizedSearch = search.trim().toLowerCase();
		if (!normalizedSearch) return true;

		return [
			getContextLabel(variable.context),
			getVariableLabel(variable),
			variable.key,
			formatTemplateVariable(variable)
		]
			.join(' ')
			.toLowerCase()
			.includes(normalizedSearch);
	}

	const visibleGroups = $derived.by(() => {
		const allowedContexts = new Set(contexts);

		return groups
			.filter((group) => allowedContexts.has(group.context))
			.map((group) => ({
				...group,
				variables: group.variables.filter((variable) => matchesSearch(variable, searchString))
			}))
			.filter((group) => group.variables.length > 0);
	});

	function selectVariable(variable: TemplateVariable) {
		onSelect?.(formatTemplateVariable(variable), variable);
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} class={className}>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm" {disabled} aria-label={resolvedTriggerLabel}>
				<BracesIcon class="size-4" />
				{resolvedTriggerLabel}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class={cn('w-80 p-0', contentClass)} align="end">
		<Command.Root>
			<Command.Input bind:value={searchString} placeholder={t`Search variables...`} />
			<Command.List>
				{#if visibleGroups.length === 0}
					<Command.Empty>{t`No variables found.`}</Command.Empty>
				{:else}
					{#each visibleGroups as group (group.context)}
						<Command.Group heading={getContextLabel(group.context)} value={group.context}>
							{#each group.variables as variable (variable.key)}
								<Command.Item
									value={`${getVariableLabel(variable)} ${variable.key}`}
									onSelect={() => selectVariable(variable)}
								>
									<div class="flex min-w-0 flex-1 items-center justify-between gap-3">
										<span class="truncate">{getVariableLabel(variable)}</span>
										<code class="text-xs whitespace-nowrap text-muted-foreground">
											{formatTemplateVariable(variable)}
										</code>
									</div>
								</Command.Item>
							{/each}
						</Command.Group>
					{/each}
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
