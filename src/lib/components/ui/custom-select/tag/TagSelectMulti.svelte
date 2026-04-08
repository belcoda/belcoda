<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { cn } from '$lib/utils.js';
	import { t } from '$lib/index.svelte';
	import { appState } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { getListFilter } from '$lib/state.svelte';

	let open = $state(false);

	let {
		selectedIds = $bindable<string[]>([]),
		class: className,
		triggerRef = $bindable<HTMLButtonElement | null>(null),
		placeholder,
		...props
	}: {
		selectedIds?: string[];
		class?: string;
		triggerRef?: HTMLButtonElement | null;
		placeholder?: string;
	} = $props();

	let searchString = $state('');
	let filter = $derived({
		...getListFilter(appState.organizationId),
		searchString: searchString || null,
		pageSize: 200
	});
	const tagsQuery = $derived.by(() => z.createQuery(queries.tag.list(filter)));

	const tagOptions = $derived(
		tagsQuery.data?.map((t) => {
			return { value: t.id, label: t.name };
		}) ?? []
	);

	function toggleTag(tagId: string) {
		if (selectedIds.includes(tagId)) {
			selectedIds = selectedIds.filter((id) => id !== tagId);
		} else {
			selectedIds = [...selectedIds, tagId];
		}
	}

	function removeTag(tagId: string) {
		selectedIds = selectedIds.filter((id) => id !== tagId);
	}
</script>

<div class={cn('flex w-full min-w-0 flex-col gap-2', className)}>
	{#if selectedIds.length > 0}
		<div class="flex min-w-0 flex-wrap gap-1.5">
			{#each selectedIds as tagId (tagId)}
				<Badge variant="secondary" class="max-w-full gap-1 pr-1">
					<span class="min-w-0 truncate"
						>{tagOptions.find((o) => o.value === tagId)?.label ?? tagId}</span
					>
					<button
						type="button"
						class="rounded-full p-0.5 hover:bg-muted"
						onclick={() => removeTag(tagId)}
						aria-label={t`Remove tag`}
					>
						<XIcon class="size-3" />
					</button>
				</Badge>
			{/each}
		</div>
	{/if}
	<div class="w-full min-w-0">
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
						<span class="min-w-0 flex-1 truncate text-left text-muted-foreground">
							{placeholder || t`Select tags...`}
						</span>
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
							{#each tagOptions as tagItem (tagItem.value)}
								<Command.Item
									value={tagItem.value}
									onSelect={() => {
										toggleTag(tagItem.value);
									}}
								>
									<CheckIcon
										class={cn(!selectedIds.includes(tagItem.value) && 'text-transparent')}
									/>
									{tagItem.label}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
