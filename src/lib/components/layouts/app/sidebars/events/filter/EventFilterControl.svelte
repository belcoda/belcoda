<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { type Snippet } from 'svelte';
	import type { ListPersonsInput } from '$lib/zero/query/person/list';
	import type { EventListFilter } from '$lib/zero/query/event/list';
	let {
		trigger,
		filter = $bindable()
	}: { trigger: Snippet<[{ props: Record<string, unknown> }]>; filter: EventListFilter } = $props();

	import type { ListFilter } from '$lib/schema/helpers';
	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	import { appState, getListFilter } from '$lib/state.svelte';
	const teamsListFilter: ListFilter = $state(getListFilter(appState.organizationId));

	const teamList = $derived.by(() =>
		z.createQuery(queries.team.list(teamsListFilter))
	);

	const tagListFilter: ListFilter = $state(getListFilter(appState.organizationId));

	const tagList = $derived.by(() => z.createQuery(queries.tag.list(tagListFilter)));

	import { tick } from 'svelte';
	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>{t`Teams`}</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<Command.Root value={filter.teamId ?? ''}>
					<Command.Input autofocus placeholder={t`Filter teams...`} />
					<Command.List>
						<Command.Empty class="text-sm text-muted-foreground">{t`No teams found.`}</Command.Empty
						>
						<Command.Group>
							{#each teamList.data as team (team.id)}
								<Command.Item
									keywords={[team.name]}
									value={team.id}
									onSelect={() => {
										filter.teamId = team.id;
										closeAndFocusTrigger();
									}}
								>
									<Avatar src={null} name1={team.name} class="size-4 rounded-full text-xs" />
									{team.name}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>{t`Tags`}</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<Command.Root value={filter.tagId ?? ''}>
					<Command.Input autofocus placeholder={t`Filter tags...`} />
					<Command.List>
						<Command.Empty class="text-sm text-muted-foreground">{t`No tags found.`}</Command.Empty>
						<Command.Group>
							{#each tagList.data as tag (tag.id)}
								<Command.Item
									keywords={[tag.name]}
									value={tag.id}
									onSelect={() => {
										filter.tagId = tag.id;
										closeAndFocusTrigger();
									}}
								>
									<Avatar
										src={null}
										name1={'#'}
										class="size-4 rounded-full from-yellow-500 to-yellow-800 text-xs"
									/>
									{tag.name}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Label>{t`Event type`}</DropdownMenu.Label>
			<DropdownMenu.CheckboxItem
				checked={filter.eventType === 'online'}
				onCheckedChange={(checked) => {
					if (checked) {
						filter.eventType = 'online';
					} else {
						filter.eventType = null;
					}
				}}>{t`Online`}</DropdownMenu.CheckboxItem
			>
			<DropdownMenu.CheckboxItem
				checked={filter.eventType === 'in-person'}
				onCheckedChange={(checked) => {
					if (checked) {
						filter.eventType = 'in-person';
					} else {
						filter.eventType = null;
					}
				}}>{t`In-person`}</DropdownMenu.CheckboxItem
			>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Label>{t`Status`}</DropdownMenu.Label>
			<DropdownMenu.CheckboxItem
				checked={filter.status === 'draft'}
				onCheckedChange={(checked) => {
					if (checked) {
						filter.status = 'draft';
					} else {
						filter.status = null;
					}
				}}>{t`Draft`}</DropdownMenu.CheckboxItem
			>
			<DropdownMenu.CheckboxItem
				checked={filter.status === 'published'}
				onCheckedChange={(checked) => {
					if (checked) {
						filter.status = 'published';
					} else {
						filter.status = null;
					}
				}}>{t`Published`}</DropdownMenu.CheckboxItem
			>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.CheckboxItem
				checked={filter.hasSignups ?? false}
				onCheckedChange={(checked) => {
					filter.hasSignups = checked;
				}}>{t`Has signups`}</DropdownMenu.CheckboxItem
			>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
