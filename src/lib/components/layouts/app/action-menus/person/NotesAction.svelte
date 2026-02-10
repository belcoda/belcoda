<script lang="ts">
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import NotesDrawer from '$lib/components/layouts/app/action-menus/person/notes/PersonNotesDrawer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { type ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';
	import { type ListFilter } from '$lib/schema/helpers';
	import { getListFilter } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	import { toast } from 'svelte-sonner';
	import { t } from '$lib/index.svelte';
	const {
		person,
		currentPage
	}: { person: ReadPersonOutputWithReadonlyArrays; currentPage: 'profile' | 'timeline' } = $props();
	let open = $state(false);

	// Teams and Tags
	import queries from '$lib/zero/query/index';
	const teamsListFilter: ListFilter = $state(getListFilter(appState.organizationId));
	const teamList = $derived.by(() =>
		z.createQuery(queries.team.list(teamsListFilter))
	);
	const personTeamList = $derived.by(() =>
		z.createQuery(
			queries.team.list({
				...teamsListFilter,
				personId: person.id
			})
		)
	);

	const tagListFilter: ListFilter = $state(getListFilter(appState.organizationId));
	const tagList = $derived.by(() =>
		z.createQuery(queries.tag.list({ ...tagListFilter }))
	);
	const personTagList = $derived.by(() =>
		z.createQuery(
			queries.tag.list({
				...tagListFilter,
				personId: person.id
			})
		)
	);

	import * as Command from '$lib/components/ui/command/index.js';
	import Avatar from '$lib/components/widgets/avatar/Avatar.svelte';
	let filter = $state({
		teamId: null,
		tagId: null
	});
	let triggerRef = $state<HTMLButtonElement>(null!);
	import { tick } from 'svelte';
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<ButtonGroup.Root ref={triggerRef}>
	<NotesDrawer bind:open {person}>
		{#snippet children({ props })}
			<Button {...props} variant="outline">
				{#if person.notes.length > 0}
					<span class="icon-[ph--chat-centered-text-bold]"></span>
				{:else}
					<span class="icon-[ph--chat-centered-bold]"></span>
				{/if}
				{t`Notes`}</Button
			>
		{/snippet}
	</NotesDrawer>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="ps-2!">
					<ChevronDown />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="[--radius:1rem]">
			<DropdownMenu.Group>
				{#if currentPage === 'timeline'}
					<DropdownMenu.Item>
						{#snippet child({ props })}
							<a href={`/community/${person.id}/profile`} {...props}>View profile</a>
						{/snippet}
					</DropdownMenu.Item>
				{/if}
				{#if currentPage === 'profile'}
					<DropdownMenu.Item>
						{#snippet child({ props })}
							<a href={`/community/${person.id}`} {...props}>View timeline</a>
						{/snippet}
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Group>
			<DropdownMenu.Separator />

			{#if person.emailAddress || person.phoneNumber}
				<DropdownMenu.Group>
					{#if person.emailAddress}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={`mailto:${person.emailAddress}`} target="_blank" {...props}
									>{t`Send email`} <span class="icon-[lucide--external-link]"></span></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{/if}
					{#if person.phoneNumber}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={`tel:${person.phoneNumber}`} target="_blank" {...props}
									>{t`Call`} <span class="icon-[lucide--external-link]"></span></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{/if}
					{#if person.phoneNumber}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={`https://wa.me/${person.phoneNumber}`} target="_blank" {...props}
									>{t`WhatsApp`} <span class="icon-[lucide--external-link]"></span></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
			{/if}
			<DropdownMenu.Group>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>{t`Add tag`}</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<Command.Root value={filter.tagId ?? ''}>
							<Command.Input autofocus placeholder={t`Filter tags...`} />
							<Command.List>
								<Command.Empty class="text-sm text-muted-foreground"
									>{t`No tags found.`}</Command.Empty
								>
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
															personId: person.id,
															tagId: tag.id
														}
													});
													closeAndFocusTrigger();
													toast.success(t`Added tag`, { duration: 1000 });
												}}
											>
												<Avatar
													src={null}
													name1={'#'}
													class="size-4 rounded-full from-yellow-500 to-yellow-800 text-xs"
												/>
												{tag.name}
											</Command.Item>
										{/if}
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>{t`Add to team`}</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<Command.Root value={filter.teamId ?? ''}>
							<Command.Input autofocus placeholder={t`Filter teams...`} />
							<Command.List>
								<Command.Empty class="text-sm text-muted-foreground"
									>{t`No teams found.`}</Command.Empty
								>
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
															personId: person.id,
															teamId: team.id
														}
													});
													closeAndFocusTrigger();
													toast.success(t`Person added to team`);
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
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>
