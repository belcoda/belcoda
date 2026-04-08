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
		searchString: searchString,
		status: 'published' as const
	});
	const petitionsQuery = $derived.by(() => {
		return z.createQuery(queries.petition.list(filter));
	});

	const values = $derived(
		petitionsQuery.data?.map((p) => {
			return { value: p.id, label: p.title };
		}) ?? []
	);

	const selectedValue = $derived(values.find((p) => p.value === value)?.label);

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
				class=" w-full justify-between overflow-hidden"
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue || t`Select a petition...`}
				<ChevronsUpDownIcon class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root {...props}>
			<Command.Input bind:value={searchString} placeholder={t`Search petition...`} />
			<Command.List>
				<Command.Empty>{t`No petitions found.`}</Command.Empty>
				<Command.Group value="petitions">
					{#each values as petitionItem (petitionItem.value)}
						<Command.Item
							value={petitionItem.value}
							onSelect={() => {
								value = petitionItem.value;
								onSelectChange?.(petitionItem.value);
								closeAndFocusTrigger();
							}}
						>
							<CheckIcon class={cn(value !== petitionItem.value && 'text-transparent')} />
							{petitionItem.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
