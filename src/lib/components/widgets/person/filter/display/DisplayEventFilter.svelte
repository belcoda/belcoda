<script lang="ts">
	const { eventId, onRemove }: { eventId: string; onRemove: () => void } = $props();

	import { z } from '$lib/zero.svelte';
	import queries from '$lib/zero/query/index';
	const event = $derived.by(() => z.createQuery(queries.event.read({ eventId })));
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
