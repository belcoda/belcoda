<script lang="ts">
	import ProfileRow from '../ProfileRow.svelte';
	import { type ReadPersonOutputWithReadonlyArrays } from '$lib/zero/query/person/read';
	let { person }: { person: ReadPersonOutputWithReadonlyArrays } = $props();
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
	let edit = $state(true);
	import { z } from '$lib/zero.svelte';
	import AddTag from './form/AddTag.svelte';
	import { t } from '$lib/index.svelte';
</script>

<ProfileRow
	title={t`Tags`}
	separator={true}
	showCopyButton={false}
	copyText={person.emailAddress}
	bind:edit
>
	{#if person.tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each person.tags as tag (tag.id)}
				<div class="flex items-center gap-2">
					<DismissableAvatarBadge
						color="yellow"
						src={null}
						avatarTitle={'#'}
						onRemove={() => {
							if (!appState.isAdminOrOwner) return;
							if (window.confirm(t`Are you sure you want to remove this tag?`)) {
								z.mutate.person.removeTag({
									metadata: {
										organizationId: appState.organizationId,
										personId: person.id,
										tagId: tag.id
									}
								});
							}
						}}
						title={tag.name}
						hideRemove={!appState.isAdminOrOwner}
					/>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-sm text-muted-foreground">{t`No tags found.`}</div>
	{/if}
	{#snippet action()}
		<AddTag personId={person.id} />
	{/snippet}
</ProfileRow>
