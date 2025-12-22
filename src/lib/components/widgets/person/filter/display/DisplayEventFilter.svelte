<script lang="ts">
	const { eventId, onRemove }: { eventId: string; onRemove: () => void } = $props();

	import { readEvent } from '$lib/zero/query/event/read';
	import { z } from '$lib/zero.svelte';
	import { appState } from '$lib/state.svelte';
	const event = $derived.by(() => z.createQuery(readEvent(appState.queryContext, { eventId })));
	import DismissableAvatarBadge from '$lib/components/ui/custom-badge/dismissable-avatar-badge.svelte';
</script>

{#if event.data}
	<DismissableAvatarBadge
		color="red"
		src={'/images/icons/calendar-white.svg'}
		onRemove={() => onRemove()}
		title={event.data?.title}
	/>
{/if}
