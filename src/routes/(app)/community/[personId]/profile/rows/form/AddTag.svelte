<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { type ListFilter } from '$lib/schema/helpers';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	import { tick } from 'svelte';
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	const { personId }: { personId: string } = $props();
	import { t } from '$lib/index.svelte';

	import { listTags } from '$lib/zero/query/tag/list';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	const tagListFilter: ListFilter = $state(getListFilter(appState.organizationId));
	const tagList = $derived.by(() =>
		z.createQuery(
			listTags(appState.queryContext, {
				...tagListFilter
			})
		)
	);
	const personTagList = $derived.by(() =>
		z.createQuery(
			listTags(appState.queryContext, {
				...tagListFilter,
				personId: personId
			})
		)
	);
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="gap-2" role="combobox" aria-expanded={open}>
				{t`Add`}
				<ChevronDownIcon class="size-4" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root>
			<Command.Input autofocus placeholder={t`Filter tags...`} />
			<Command.List>
				<Command.Empty class="text-sm text-muted-foreground">{t`No tags found.`}</Command.Empty>
				<Command.Group>
					{#each tagList.data as tag (tag.id)}
						{#if !personTagList.data.some((pt) => pt.id === tag.id)}
							<Command.Item
								keywords={[tag.name]}
								value={tag.id}
								onSelect={() => {
									z.mutate.person.addTag({
										metadata: {
											organizationId: appState.organizationId,
											personId: personId,
											tagId: tag.id
										}
									});
									closeAndFocusTrigger();
								}}
							>
								<div class="h-4 w-4">
									<Avatar
										src={null}
										name1={'#'}
										class="size-4 rounded-full from-yellow-500 to-yellow-800 text-xs"
									/>
								</div>
								{tag.name}
							</Command.Item>
						{/if}
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
