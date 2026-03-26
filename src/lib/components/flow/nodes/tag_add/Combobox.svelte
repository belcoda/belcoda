<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';

	let open = $state(false);

	let {
		value = $bindable(undefined),
		class: className,
		triggerRef = $bindable(null!),
		onSelectChange,
		...props
	}: {
		value: string | null | undefined;
		class?: string;
		triggerRef?: HTMLButtonElement | null;
		onSelectChange?: (value: string) => void;
	} = $props();

	import { appState } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	let searchString = $state('');
	import { getListFilter } from '$lib/state.svelte';
	let filter = $derived({
		...getListFilter(appState.organizationId),
		searchString: searchString
	});
	const tagsQuery = $derived.by(() => {
		return z.createQuery(queries.tag.list(filter));
	});

	const values = $derived(
		tagsQuery.data?.map((t) => {
			return { value: t.id, label: t.name };
		}) ?? []
	);

	const selectedValue = $derived(values.find((t) => t.value === value)?.label);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} class={className}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="w-full justify-between overflow-hidden"
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue || t`Select a tag...`}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root {...props}>
			<Command.Input bind:value={searchString} placeholder={t`Search tag...`} />
			<Command.List>
				<Command.Empty>{t`No tags found.`}</Command.Empty>
				<Command.Group value="tags">
					{#each values as tagItem (tagItem.value)}
						<Command.Item
							value={tagItem.value}
							onSelect={() => {
								value = tagItem.value;
								onSelectChange?.(tagItem.value);
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn(value !== tagItem.value && 'text-transparent')} />
							{tagItem.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
