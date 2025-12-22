<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	import { type ListFilter } from '$lib/schema/helpers';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';

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

	import { listTeams } from '$lib/zero/query/team/list';
	import { z } from '$lib/zero.svelte';
	import { appState, getListFilter } from '$lib/state.svelte';
	const teamsListFilter: ListFilter = $state(getListFilter(appState.organizationId));
	const teamList = $derived.by(() =>
		z.createQuery(
			listTeams(appState.queryContext, {
				...teamsListFilter
			})
		)
	);
	const personTeamList = $derived.by(() =>
		z.createQuery(
			listTeams(appState.queryContext, {
				...teamsListFilter,
				personId: personId
			})
		)
	);
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="gap-2" role="combobox" aria-expanded={open}>
				Add
				<ChevronDownIcon class="size-4" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root>
			<Command.Input autofocus placeholder="Filter teams..." />
			<Command.List>
				<Command.Empty class="text-sm text-muted-foreground">No teams found.</Command.Empty>
				<Command.Group>
					{#each teamList.data as team (team.id)}
						{#if !personTeamList.data.some((pt) => pt.id === team.id)}
							<Command.Item
								keywords={[team.name]}
								value={team.id}
								onSelect={() => {
									z.mutate.person.addToTeam({
										metadata: {
											organizationId: appState.organizationId,
											personId: personId,
											teamId: team.id
										}
									});
									closeAndFocusTrigger();
								}}
							>
								<Avatar src={null} name1={team.name} class="size-4 rounded-full text-xs" />
								{team.name}
							</Command.Item>
						{/if}
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
