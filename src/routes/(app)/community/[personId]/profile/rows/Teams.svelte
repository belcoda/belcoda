<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import { type ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';
	let { person }: { person: ReadPersonOutputWithReadonlyArrays } = $props();
	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
	import { appState } from '$lib/state.svelte';
	import { z } from '$lib/zero.svelte';
	import { mutators } from '$lib/zero/mutate/client_mutators';
	import AddTeam from './form/AddTeam.svelte';
	let edit = $state(true);
	import { t } from '$lib/index.svelte';
</script>

<ProfileRow
	title={t`Teams`}
	separator={true}
	showCopyButton={false}
	copyText={person.emailAddress}
	bind:edit
>
	{#if person.teams.length > 0}
		<div class="space-y-2">
			{#each person.teams as team (team.id)}
				<div class="flex items-center gap-2">
					<DismissableAvatarBadge
						hideRemove={!appState.isAdminOrOwner}
						color="blue"
						src={null}
						onRemove={() => {
							if (!appState.isAdminOrOwner) return;
							if (window.confirm(t`Are you sure you want to remove this team?`)) {
								z.mutate(
									mutators.person.removeFromTeam({
										metadata: {
											organizationId: appState.organizationId,
											personId: person.id,
											teamId: team.id
										}
									})
								);
							}
						}}
						title={team.name}
					/>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-sm text-muted-foreground">{t`No teams found.`}</div>
	{/if}

	{#snippet action()}
		<AddTeam personId={person.id} />
	{/snippet}
</ProfileRow>
