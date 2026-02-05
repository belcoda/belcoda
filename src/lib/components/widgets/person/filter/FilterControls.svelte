<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { type Snippet } from 'svelte';
	import { type ListFilter } from '$lib/schema/helpers';
	import { type ListPersonsInput } from '$lib/zero/query/person/list';
	import { t } from '$lib/index.svelte';
	let {
		trigger,
		filter = $bindable(),
		hideActivityFilter = false
	}: {
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
		filter: ListPersonsInput;
		hideActivityFilter?: boolean;
	} = $props();

	import { listTeams } from '$lib/zero/query/team/list';
	import { listTags } from '$lib/zero/query/tag/list';
	import { listEvents, type EventListFilter } from '$lib/zero/query/event/list';
	import { getTimestampFromCalendarDate, getWeeksFromTodayCalendarDate } from '$lib/utils/date';
	import { getLocalTimeZone } from '@internationalized/date';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	const teamsListFilter: ListFilter = $state(getListFilter(appState.organizationId));

	const teamList = $derived.by(() =>
		z.createQuery(listTeams(appState.queryContext, teamsListFilter))
	);

	const tagListFilter: ListFilter = $state(getListFilter(appState.organizationId));

	const tagList = $derived.by(() => z.createQuery(listTags(appState.queryContext, tagListFilter)));

	const eventListFilter: EventListFilter = $state({
		...getListFilter(appState.organizationId),
		dateRange: {
			start: getTimestampFromCalendarDate(
				getWeeksFromTodayCalendarDate(getLocalTimeZone(), -4),
				getLocalTimeZone(),
				'start'
			),
			end: getTimestampFromCalendarDate(
				getWeeksFromTodayCalendarDate(getLocalTimeZone(), 8),
				getLocalTimeZone(),
				'end'
			)
		}
	});

	const eventList = $derived.by(() =>
		z.createQuery(listEvents(appState.queryContext, eventListFilter))
	);

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
						<Command.Empty class="text-sm text-muted-foreground">{t`No teams found.`}</Command.Empty>
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
		{#if !hideActivityFilter}
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>{t`Activity`}</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Group>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = '7days';
							}}>{t`Recent activity: 7 days`}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = '30days';
							}}>{t`Recent activity: 30 days`}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = '90days';
							}}>{t`Recent activity: 90 days`}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = '1year';
							}}>{t`Recent activity: 1 year`}</DropdownMenu.Item
						>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = 'noactivity7days';
							}}>{t`No activity: 7 days`}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = 'noactivity30days';
							}}>{t`No activity: 30 days`}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = 'noactivity90days';
							}}>{t`No activity: 90 days`}</DropdownMenu.Item
						>
						<DropdownMenu.Item
							onclick={() => {
								filter.mostRecentActivity = 'noactivity1year';
							}}>{t`No activity: 1 year`}</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
