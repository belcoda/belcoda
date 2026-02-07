<script lang="ts">
	const { teamId, onRemove }: { teamId: string; onRemove: () => void } = $props();

	import { readTeam } from '$lib/zero/query/team/read';
	import { z } from '$lib/zero.svelte';
	import { getAppState } from '$lib/state.svelte'; const appState = getAppState();;
	const team = $derived.by(() => z.createQuery(readTeam(appState.queryContext, { teamId })));
	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
</script>

{#if team.data}
	<DismissableAvatarBadge
		color="blue"
		src={null}
		onRemove={() => onRemove()}
		title={team.data?.name}
	/>
{/if}
