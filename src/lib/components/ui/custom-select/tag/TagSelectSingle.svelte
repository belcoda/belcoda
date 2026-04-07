<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { getListFilter } from '$lib/state.svelte';

	let open = $state(false);

	let {
		value = $bindable<string | null | undefined>(undefined),
		class: className,
		triggerRef = $bindable<HTMLButtonElement | null>(null),
		placeholder,
		onSelectChange,
		...props
	}: {
		value?: string | null | undefined;
		class?: string;
		triggerRef?: HTMLButtonElement | null;
		placeholder?: string;
		onSelectChange?: (value: string | null) => void;
	} = $props();

	let searchString = $state('');
	let filter = $derived({
		...getListFilter(appState.organizationId),
		searchString: searchString || null,
		pageSize: 200
	});
	const tagsQuery = $derived.by(() => z.createQuery(queries.tag.list(filter)));

	const values = $derived(
		tagsQuery.data?.map((t) => {
			return { value: t.id, label: t.name };
		}) ?? []
	);

	const selectedValue = $derived(values.find((t) => t.value === value)?.label);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}

	function clearSelection(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		value = null;
		onSelectChange?.(null);
	}
</script>

<div class={cn('flex w-full min-w-0 items-center gap-1.5', className)}>
	<div class="min-w-0 flex-1">
		<Popover.Root bind:open>
			<Popover.Trigger bind:ref={triggerRef} class="block w-full min-w-0">
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="w-full max-w-full min-w-0 justify-between gap-2 overflow-hidden"
						role="combobox"
						aria-expanded={open}
					>
						<span class="min-w-0 flex-1 truncate text-left"
							>{selectedValue || placeholder || t`Select a tag...`}</span
						>
						<ChevronsUpDownIcon class="size-4 shrink-0 opacity-50" />
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
	</div>
	{#if value}
		<Button
			type="button"
			variant="ghost"
			size="icon"
			class="shrink-0 self-center"
			onclick={clearSelection}
			aria-label={t`Clear selection`}
		>
			<XIcon class="size-4" />
		</Button>
	{/if}
</div>
