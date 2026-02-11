<script lang="ts">
	const { teamId, onRemove }: { teamId: string; onRemove: () => void } = $props();

	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const team = $derived.by(() => z.createQuery(queries.team.read({ teamId })));
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
